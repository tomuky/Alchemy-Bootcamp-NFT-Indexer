import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { Alchemy, Network } from 'alchemy-sdk';
import { useState } from 'react';

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [loading,setLoading] = useState(false);

  async function getNFTsForOwner() {
    if(hasQueried){
        setHasQueried(false);
        return;
    }
    setLoading(true);
    const config = {
      apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);
    const dataRaw = await alchemy.nft.getNftsForOwner(userAddress);
    
    // filter out missing titles, spam nfts
    const data = dataRaw.ownedNfts
        .filter((d,i)=>d.title!=='')
        .filter((d,i)=>d.title.toLowerCase().indexOf('pass')<0)
        .filter((d,i)=>d.title.toLowerCase().indexOf('airdrop')<0)
        .filter((d,i)=>d.title.toLowerCase().indexOf('visit')<0)
        .filter((d,i)=>d.title.toLowerCase().indexOf('blur')<0);

    if(data.length>100){
        alert('too many NFTs');
        setLoading(false);
        return;
    }

    setResults(data);
    
    const tokenDataPromises = [];

    for (let i = 0; i < data.length; i++) {
      const tokenData = alchemy.nft.getNftMetadata(
        data[i].contract.address,
        data[i].tokenId,
        {}
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setHasQueried(true);
    setLoading(false);
  }
  return (
    <Box w="100vw" mt='-200px'>
      <Center>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <Heading mb={0} fontSize={36} display='flex' alignItems='flex-end'>
            NFT Indexer <Image boxSize='30px' ml='5px' filter='invert(1)' src='nft-indexer-logo.png'/>
          </Heading>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        <Heading mt={42}>Get all the ERC-721 tokens of this address:</Heading>
        <Input
          onChange={(e) => setUserAddress(e.target.value)}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
        />
        <Button fontSize={20} onClick={getNFTsForOwner} mt={36} bgColor="#646cff">
          {loading && 'Loading...'}
          { (!loading && !hasQueried) && 'Fetch NFTs'}
          { (!loading && hasQueried) && 'Change address'}
        </Button>

        { hasQueried && <Heading my={36}>NFTs for {`${userAddress.substring(0,5)}...${userAddress.substring(userAddress.length-3)}`}</Heading> }

        {hasQueried && (
          <SimpleGrid w={'90vw'} columns={4} spacing={24}>
            {results.map((e, i) => {
                let image = tokenDataObjects[i]?.rawMetadata?.image.replace('ipfs://','https://ipfs.io/ipfs/');
              return (
                <Flex
                  flexDir={'column'}
                  w={'20vw'}
                  key={`nft_${i}`}
                  p='8px'
                  border='2px solid black'
                  boxSizing={'border-box'}
                  borderRadius='4px'
                >
                  <Box minHeight='48px'>
                    <b>Name:</b>{' '}
                    {tokenDataObjects[i].title?.length === 0
                      ? 'No Name'
                      : tokenDataObjects[i].title}
                  </Box>
                  <Image
                    src={
                      image ??
                      'https://via.placeholder.com/200'
                    }
                    alt={'Image'}
                  />
                </Flex>
              );
            })}
          </SimpleGrid>
        )}
      </Flex>
    </Box>
  );
}

export default App;
