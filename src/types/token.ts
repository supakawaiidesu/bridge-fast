// types/token.ts
export interface TokenFromList {
  symbol: string;
  name: string;
  logo: string;
  addresses: {
    [chain: string]: string;
  };
  decimals: number;
}

export interface Token {
  symbol: string;
  name: string;
  logo: string;
  balance?: string;
  chain: string;
  value?: string;
  decimals: number;
}

export interface TokenWithChain extends Token {
  chain: string;
  address?: string;
  decimals: number;
}
