// data/token-list.ts
export const TOKEN_LIST = {
  tokens: [
    {
      symbol: "ETH",
      name: "Ethereum",
      logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
      addresses: {
        ethereum: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        optimism: "0x4200000000000000000000000000000000000006",
        arbitrum: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        polygon: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
        base: "0x4200000000000000000000000000000000000006"
      },
      decimals: 18
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
      addresses: {
        ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        optimism: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
        arbitrum: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
        polygon: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
      },
      decimals: 6
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
      addresses: {
        ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        optimism: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
        arbitrum: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
      },
      decimals: 6
    }
  ]
};

// types/token.ts
export interface Token {
  symbol: string;
  name: string;
  logo: string;
  addresses: {
    [chain: string]: string;
  };
  decimals: number;
  balance?: string;
  value?: string;
}