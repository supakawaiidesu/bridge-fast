import { BigNumber } from 'ethers'
import { Bridge, BridgeQuote, BridgeTransaction, QuoteRequest, DebridgeQuoteResponse } from '../types/bridge'
import { getChainId } from '../utils/chains'
import { Address } from 'viem'

const DEBRIDGE_API_URL = 'https://dln.debridge.finance/v1.0/dln/order/create-tx'

export class DeBridge implements Bridge {
  name = 'deBridge'

  private async fetchQuote(
    srcChainId: number,
    dstChainId: number,
    srcToken: string,
    dstToken: string,
    amount: string,
    recipient?: string,
  ): Promise<DebridgeQuoteResponse> {
    const params = new URLSearchParams({
      srcChainId: srcChainId.toString(),
      dstChainId: dstChainId.toString(),
      srcChainTokenIn: srcToken,
      dstChainTokenOut: dstToken,
      srcChainTokenInAmount: amount,
      dstChainTokenOutAmount: 'auto',
    })

    // Only add recipient params if provided
    if (recipient) {
      params.append('dstChainTokenOutRecipient', recipient)
      params.append('srcChainOrderAuthorityAddress', recipient)
      params.append('dstChainOrderAuthorityAddress', recipient)
    }

    const response = await fetch(`${DEBRIDGE_API_URL}?${params.toString()}`)
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`DeBridge API error: ${error}`)
    }

    return response.json()
  }

  async getQuote(request: QuoteRequest): Promise<BridgeQuote> {
    const fromChainId = getChainId(request.fromToken.chain)
    const toChainId = getChainId(request.toToken.chain)
    
    if (!fromChainId || !toChainId) {
      throw new Error('Unsupported chain')
    }

    if (!request.fromToken.address || !request.toToken.address) {
      throw new Error('Token address required')
    }

    try {
      console.log('Getting DeBridge quote with params:', {
        fromChainId,
        toChainId,
        fromToken: request.fromToken.address,
        toToken: request.toToken.address,
        amount: request.amount
      })

      const quote = await this.fetchQuote(
        fromChainId,
        toChainId,
        request.fromToken.address,
        request.toToken.address,
        request.amount
      )

      console.log('Received quote from DeBridge:', quote)

      // Calculate total fee from costsDetails
      const totalFee = quote.estimation.costsDetails.reduce((acc, cost) => {
        if (cost.payload.feeAmount) {
          return acc.add(BigNumber.from(cost.payload.feeAmount))
        }
        return acc
      }, BigNumber.from(0))

      // Calculate price impact
      const inputUsdValue = quote.estimation.srcChainTokenIn.approximateUsdValue
      const outputUsdValue = quote.estimation.dstChainTokenOut.approximateUsdValue
      const priceImpact = ((inputUsdValue - outputUsdValue) / inputUsdValue) * 100

      return {
        bridgeName: this.name,
        fromToken: request.fromToken,
        toToken: request.toToken,
        fromAmount: BigNumber.from(request.amount),
        expectedOutput: BigNumber.from(quote.estimation.dstChainTokenOut.recommendedAmount),
        feeAmount: totalFee,
        estimatedGasCost: quote.fixFee,
        priceImpact,
        providerData: quote
      }
    } catch (error) {
      console.error('DeBridge quote error:', error)
      throw error
    }
  }

  async prepareTransaction(quote: BridgeQuote, toAddress: string): Promise<BridgeTransaction> {
    const fromChainId = getChainId(quote.fromToken.chain)
    const toChainId = getChainId(quote.toToken.chain)

    if (!fromChainId || !toChainId) {
      throw new Error('Unsupported chain')
    }

    if (!quote.fromToken.address || !quote.toToken.address) {
      throw new Error('Token address required')
    }

    try {
      console.log('Preparing DeBridge transaction with params:', {
        fromChainId,
        toChainId,
        fromToken: quote.fromToken.address,
        toToken: quote.toToken.address,
        amount: quote.fromAmount.toString(),
        toAddress
      })

      // Get quote with recipient address to get transaction data
      const quoteWithTx = await this.fetchQuote(
        fromChainId,
        toChainId,
        quote.fromToken.address,
        quote.toToken.address,
        quote.fromAmount.toString(),
        toAddress
      )

      if (!quoteWithTx.tx) {
        throw new Error('Transaction data not available')
      }

      console.log('Received transaction data from DeBridge:', quoteWithTx.tx)

      const bridgeTransaction: BridgeTransaction = {
        to: quoteWithTx.tx.to as Address,
        data: quoteWithTx.tx.data as `0x${string}`,
        value: BigInt(quoteWithTx.tx.value),
        chainId: fromChainId
      }

      console.log('Prepared bridge transaction:', bridgeTransaction)

      return bridgeTransaction
    } catch (error) {
      console.error('DeBridge transaction error:', error)
      throw error
    }
  }
}
