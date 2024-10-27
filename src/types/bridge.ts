import { BigNumber } from 'ethers'
import { TokenWithChain } from './token'

export interface BridgeQuote {
  bridgeName: string
  fromToken: TokenWithChain
  toToken: TokenWithChain
  fromAmount: BigNumber
  expectedOutput: BigNumber
  estimatedGasCost: string
  feeAmount: BigNumber
  priceImpact: number
}

export interface QuoteRequest {
  fromToken: TokenWithChain
  toToken: TokenWithChain
  amount: string
}

// Synapse specific types
export interface SynapseQuery {
  swapAdapter: string
  tokenOut: string
  minAmountOut: BigNumber
  rawParams: string
}

export interface SynapseQuoteResponse {
  feeAmount: BigNumber
  bridgeFee: number
  maxAmountOut: BigNumber
  originQuery: SynapseQuery
  destQuery: SynapseQuery
}

// Bridge interface that all bridge implementations must follow
export interface Bridge {
  name: string
  getQuote(request: QuoteRequest): Promise<BridgeQuote>
  execute(quote: BridgeQuote): Promise<string> // Returns transaction hash
}
