import { BigNumber } from 'ethers'
import { JsonRpcProvider } from '@ethersproject/providers'
import { SynapseSDK } from '@synapsecns/sdk-router/dist'
import { Bridge, BridgeQuote, BridgeTransaction, QuoteRequest, SynapseQuoteResponse } from '../types/bridge'
import { getChainId, getChainRpcUrl, SUPPORTED_CHAINS } from '../utils/chains'
import { Address } from 'viem'

const SYNAPSE_RFQ_ROUTER = '0x00cD000000003f7F682BE4813200893d4e690000'

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
      console.log('Getting Synapse quote with params:', {
        fromChainId,
        toChainId,
        fromToken: request.fromToken.address,
        toToken: request.toToken.address,
        amount: amount.toString()
      })

      const rawQuote = await this.sdk.bridgeQuote(
        fromChainId,
        toChainId,
        request.fromToken.address!,
        request.toToken.address!,
        amount,
        {
          excludedModules: ['SynapseBridge', 'SynapseCCTP']
        }
      )

      console.log('Received raw quote from Synapse:', rawQuote)

      // Add deadline to the quote response
      const deadline = BigNumber.from(Math.floor(Date.now() / 1000) + 3600) // 1 hour from now

      // Create a properly typed quote response
      const synapseQuote: SynapseQuoteResponse = {
        feeAmount: rawQuote.feeAmount,
        bridgeFee: Number(rawQuote.feeAmount),
        maxAmountOut: rawQuote.maxAmountOut,
        routerAddress: SYNAPSE_RFQ_ROUTER, // Use constant router address
        originQuery: {
          tokenOut: rawQuote.originQuery.tokenOut,
          minAmountOut: rawQuote.originQuery.minAmountOut,
          deadline,
          rawParams: rawQuote.originQuery.rawParams,
          ...(rawQuote.originQuery.swapAdapter 
            ? { swapAdapter: rawQuote.originQuery.swapAdapter }
            : { routerAdapter: rawQuote.originQuery.routerAdapter! })
        },
        destQuery: {
          tokenOut: rawQuote.destQuery.tokenOut,
          minAmountOut: rawQuote.destQuery.minAmountOut,
          deadline,
          rawParams: rawQuote.destQuery.rawParams,
          ...(rawQuote.destQuery.swapAdapter 
            ? { swapAdapter: rawQuote.destQuery.swapAdapter }
            : { routerAdapter: rawQuote.destQuery.routerAdapter! })
        }
      }

      console.log('Processed Synapse quote:', synapseQuote)

      return {
        bridgeName: this.name,
        fromToken: request.fromToken,
        toToken: request.toToken,
        fromAmount: amount,
        expectedOutput: synapseQuote.maxAmountOut,
        feeAmount: synapseQuote.feeAmount,
        estimatedGasCost: '0',
        priceImpact: 0,
        providerData: synapseQuote as SynapseQuoteResponse // Type assertion to ensure correct type
      }
    } catch (error) {
      console.error('Synapse quote error:', error)
      throw error
    }
  }

  async prepareTransaction(quote: BridgeQuote, toAddress: string): Promise<BridgeTransaction> {
    if (!quote.providerData || !('originQuery' in quote.providerData)) {
      throw new Error('Missing Synapse quote data')
    }

    const synapseQuote = quote.providerData as SynapseQuoteResponse
    const fromChainId = getChainId(quote.fromToken.chain)
    const toChainId = getChainId(quote.toToken.chain)

    if (!fromChainId || !toChainId) {
      throw new Error('Unsupported chain')
    }

    try {
      console.log('Preparing Synapse bridge transaction with params:', {
        toAddress,
        routerAddress: SYNAPSE_RFQ_ROUTER,
        fromChainId,
        toChainId,
        fromToken: quote.fromToken.address,
        fromAmount: quote.fromAmount.toString(),
        originQuery: synapseQuote.originQuery,
        destQuery: synapseQuote.destQuery
      })

      const transaction = await this.sdk.bridge(
        toAddress as string,
        SYNAPSE_RFQ_ROUTER, // Use constant router address
        fromChainId,
        toChainId,
        quote.fromToken.address!,
        quote.fromAmount,
        synapseQuote.originQuery,
        synapseQuote.destQuery
      )

      console.log('Received transaction data from Synapse:', transaction)

      const bridgeTransaction = {
        to: SYNAPSE_RFQ_ROUTER as Address,
        data: transaction.data as `0x${string}`,
        value: BigInt(transaction.value?.toString() || '0'),
        chainId: fromChainId
      }

      console.log('Prepared bridge transaction:', bridgeTransaction)

      return bridgeTransaction
    } catch (error) {
      console.error('Synapse bridge error:', error)
      throw error
    }
  }
}
