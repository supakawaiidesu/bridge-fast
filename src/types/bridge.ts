import { BigNumber } from 'ethers'
import { TokenWithChain } from './token'
import { Address } from 'viem'

export interface BridgeQuote {
  bridgeName: string
  fromToken: TokenWithChain
  toToken: TokenWithChain
  fromAmount: BigNumber
  expectedOutput: BigNumber
  estimatedGasCost: string
  feeAmount: BigNumber
  priceImpact: number
  providerData?: SynapseQuoteResponse
}

export interface QuoteRequest {
  fromToken: TokenWithChain
  toToken: TokenWithChain
  amount: string
}

// Synapse SDK Query types
export type SynapseSDKQuery = {
  tokenOut: string
  minAmountOut: BigNumber
  deadline: BigNumber
  rawParams: string
} & (
  | {
      swapAdapter: string
      routerAdapter?: never
    }
  | {
      swapAdapter?: never
      routerAdapter: string
    }
)

// Our internal Query type matches SDK type
export type SynapseQuery = SynapseSDKQuery

export interface SynapseQuoteResponse {
  feeAmount: BigNumber
  bridgeFee: number
  maxAmountOut: BigNumber
  originQuery: SynapseQuery
  destQuery: SynapseQuery
  routerAddress: string
}

export interface BridgeTransaction {
  to: Address
  data: `0x${string}`
  value: bigint
  chainId: number
}

// Bridge interface that all bridge implementations must follow
export interface Bridge {
  name: string
  getQuote(request: QuoteRequest): Promise<BridgeQuote>
  prepareTransaction(quote: BridgeQuote, toAddress: string): Promise<BridgeTransaction>
}
