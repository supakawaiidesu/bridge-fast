import { BigNumber } from 'ethers'
import { JsonRpcProvider } from '@ethersproject/providers'
import { SynapseSDK } from '@synapsecns/sdk-router/dist'
import { Bridge, BridgeQuote, QuoteRequest } from '../types/bridge'
import { getChainId, getChainRpcUrl, SUPPORTED_CHAINS } from '../utils/chains'

export class SynapseBridge implements Bridge {
  private sdk: SynapseSDK
  name = 'Synapse'

  constructor() {
    // Get all supported chain IDs
    const chainIds = Object.values(SUPPORTED_CHAINS) as number[]
    
    // Create providers for each chain
    const providers = chainIds.map(chainId => {
      const rpcUrl = getChainRpcUrl(chainId)
      if (!rpcUrl) throw new Error(`No RPC URL found for chain ID ${chainId}`)
      return new JsonRpcProvider(rpcUrl)
    })

    this.sdk = new SynapseSDK(chainIds, providers)
  }

  async getQuote(request: QuoteRequest): Promise<BridgeQuote> {
    const fromChainId = getChainId(request.fromToken.chain)
    const toChainId = getChainId(request.toToken.chain)
    
    if (!fromChainId || !toChainId) {
      throw new Error('Unsupported chain')
    }

    const amount = BigNumber.from(request.amount)
    
    try {
      const synapseQuote = await this.sdk.bridgeQuote(
        fromChainId,
        toChainId,
        request.fromToken.address!,
        request.toToken.address!,
        amount,
        {
          excludedModules: ['SynapseBridge', 'SynapseCCTP']
        }
      )

      return {
        bridgeName: this.name,
        fromToken: request.fromToken,
        toToken: request.toToken,
        fromAmount: amount,
        expectedOutput: synapseQuote.maxAmountOut,
        feeAmount: synapseQuote.feeAmount,
        estimatedGasCost: '0', // We'll implement proper gas estimation later
        priceImpact: 0 // We'll calculate this properly later
      }
    } catch (error) {
      console.error('Synapse quote error:', error)
      throw error
    }
  }

  async execute(quote: BridgeQuote): Promise<string> {
    // Implementation for executing the bridge transaction
    // This would use the SDK's bridge() function with the quote data
    console.log('Executing bridge transaction with quote:', quote)
    throw new Error('Bridge execution not implemented yet')
  }
}
