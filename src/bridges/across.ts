import { BigNumber } from 'ethers'
import { Bridge, BridgeQuote, BridgeTransaction, QuoteRequest, AcrossQuoteResponse } from '../types/bridge'
import { getChainId } from '../utils/chains'

const ACROSS_API_URL = 'https://app.across.to/api/suggested-fees'

export class AcrossBridge implements Bridge {
  name = 'Across'

  private async fetchQuote(
    originChainId: number,
    destinationChainId: number,
    tokenAddress: string,
    amount: string,
  ): Promise<AcrossQuoteResponse> {
    // Convert amount to raw amount (e.g. 1 USDC = 1e6, 1 ETH = 1e18)
    // For now assuming 18 decimals, in production would need to handle different token decimals
    const params = new URLSearchParams({
      originChainId: originChainId.toString(),
      destinationChainId: destinationChainId.toString(),
      token: tokenAddress,
      amount: amount,
    })

    console.log('Fetching Across quote with params:', Object.fromEntries(params))

    const response = await fetch(`${ACROSS_API_URL}?${params.toString()}`)
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Across API error: ${error}`)
    }

    return response.json()
  }

  async getQuote(request: QuoteRequest): Promise<BridgeQuote> {
    const fromChainId = getChainId(request.fromToken.chain)
    const toChainId = getChainId(request.toToken.chain)
    
    if (!fromChainId || !toChainId) {
      throw new Error('Unsupported chain')
    }

    if (!request.fromToken.address) {
      throw new Error('Token address required')
    }

    try {
      console.log('Getting Across quote with params:', {
        fromChainId,
        toChainId,
        fromToken: request.fromToken.address,
        amount: request.amount
      })

      const quote = await this.fetchQuote(
        fromChainId,
        toChainId,
        request.fromToken.address,
        request.amount
      )

      console.log('Received quote from Across:', quote)

      // Calculate total fees
      const totalFee = BigNumber.from(quote.totalRelayFee.total)
      
      // Calculate expected output (input amount minus fees)
      const inputAmount = BigNumber.from(request.amount)
      const expectedOutput = inputAmount.sub(totalFee)

      // Calculate price impact (fees / input amount * 100)
      const priceImpact = (Number(totalFee.toString()) / Number(inputAmount.toString())) * 100

      return {
        bridgeName: this.name,
        fromToken: request.fromToken,
        toToken: request.toToken,
        fromAmount: inputAmount,
        expectedOutput,
        feeAmount: totalFee,
        estimatedGasCost: quote.relayerGasFee.total,
        priceImpact,
        providerData: quote
      }
    } catch (error) {
      console.error('Across quote error:', error)
      throw error
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async prepareTransaction(_quote: BridgeQuote, _toAddress: string): Promise<BridgeTransaction> {
    // This will be implemented later as mentioned in the task
    throw new Error('Transaction preparation not yet implemented for Across')
  }
}
