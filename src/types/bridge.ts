import { BigNumber } from 'ethers'
import { TokenWithChain } from './token'
import { Address } from 'viem'

// Synapse specific types
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

export type SynapseQuery = SynapseSDKQuery

export interface SynapseQuoteResponse {
  feeAmount: BigNumber
  bridgeFee: number
  maxAmountOut: BigNumber
  originQuery: SynapseQuery
  destQuery: SynapseQuery
  routerAddress: string
}

// DeBridge specific types
interface TokenDetails {
  address: string
  chainId: number
  decimals: number
  name: string
  symbol: string
  amount: string
  approximateUsdValue: number
}

interface CostDetail {
  chain: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  type: string
  payload: {
    feeAmount?: string
    feeBps?: string
    amountOutBeforeCorrection?: string
    estimatedVolatilityBps?: string
  }
}

interface DebridgeTransaction {
  data: string
  to: string
  value: string
  allowanceTarget: string
  allowanceValue: string
}

interface DebridgeOrder {
  approximateFulfillmentDelay: number
  salt?: number
  metadata?: string
}

export interface DebridgeQuoteResponse {
  estimation: {
    srcChainTokenIn: TokenDetails
    dstChainTokenOut: TokenDetails & {
      recommendedAmount: string
      maxTheoreticalAmount: string
    }
    costsDetails: CostDetail[]
    recommendedSlippage: number
  }
  tx: DebridgeTransaction
  order: DebridgeOrder
  fixFee: string
  orderId?: string
  userPoints?: number
  integratorPoints?: number
}

// Bridge quote with properly typed provider data
export interface BridgeQuote {
  bridgeName: string
  fromToken: TokenWithChain
  toToken: TokenWithChain
  fromAmount: BigNumber
  expectedOutput: BigNumber
  estimatedGasCost: string
  feeAmount: BigNumber
  priceImpact: number
  providerData?: SynapseQuoteResponse | DebridgeQuoteResponse
}

export interface QuoteRequest {
  fromToken: TokenWithChain
  toToken: TokenWithChain
  amount: string
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
