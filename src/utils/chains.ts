import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains'

type ChainName = 'Ethereum' | 'Polygon' | 'Optimism' | 'Arbitrum' | 'Base'
type ChainIds = typeof mainnet.id | typeof polygon.id | typeof optimism.id | typeof arbitrum.id | typeof base.id

export const SUPPORTED_CHAINS: Record<ChainName, ChainIds> = {
  'Ethereum': mainnet.id,
  'Polygon': polygon.id,
  'Optimism': optimism.id,
  'Arbitrum': arbitrum.id,
  'Base': base.id
} as const

export const CHAIN_RPC_URLS: Record<ChainIds, string> = {
  [mainnet.id]: 'https://rpc.ankr.com/eth/757fd7b22f376e3de558f4314e5ec7acfed5b77c6ec675900d6ca9a97708f9ee',
  [polygon.id]: 'https://rpc.ankr.com/polygon/757fd7b22f376e3de558f4314e5ec7acfed5b77c6ec675900d6ca9a97708f9ee',
  [optimism.id]: 'https://rpc.ankr.com/optimism/757fd7b22f376e3de558f4314e5ec7acfed5b77c6ec675900d6ca9a97708f9ee',
  [arbitrum.id]: 'https://rpc.ankr.com/arbitrum/757fd7b22f376e3de558f4314e5ec7acfed5b77c6ec675900d6ca9a97708f9ee',
  [base.id]: 'https://rpc.ankr.com/base/757fd7b22f376e3de558f4314e5ec7acfed5b77c6ec675900d6ca9a97708f9ee'
} as const

export function getChainId(chainName: string): number | undefined {
  return SUPPORTED_CHAINS[chainName as ChainName]
}

export function getChainRpcUrl(chainId: number): string | undefined {
  return CHAIN_RPC_URLS[chainId as ChainIds]
}
