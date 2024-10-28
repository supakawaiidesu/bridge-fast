import { BigNumber } from 'ethers'
import { Bridge, BridgeQuote, BridgeTransaction, QuoteRequest, AcrossQuoteResponse } from '../types/bridge'
import { getChainId } from '../utils/chains'
import { Address, encodeFunctionData } from 'viem'

const ACROSS_API_URL = 'https://app.across.to/api/suggested-fees'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// SpokePool ABI for depositV3
const SPOKE_POOL_ABI = [
  {
    name: 'depositV3',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'depositor', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'inputToken', type: 'address' },
      { name: 'outputToken', type: 'address' },
      { name: 'inputAmount', type: 'uint256' },
      { name: 'outputAmount', type: 'uint256' },
      { name: 'destinationChainId', type: 'uint256' },
      { name: 'exclusiveRelayer', type: 'address' },
      { name: 'quoteTimestamp', type: 'uint32' },
      { name: 'fillDeadline', type: 'uint32' },
      { name: 'exclusivityDeadline', type: 'uint32' },
      { name: 'message', type: 'bytes' }
    ],
    outputs: [],
  }
]

export class AcrossBridge implements Bridge {
  name = 'Across'

  private async fetchQuote(
    originChainId: number,
    destinationChainId: number,
    tokenAddress: string,
    amount: string,
  ): Promise<AcrossQuoteResponse> {
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

  async prepareTransaction(quote: BridgeQuote, toAddress: string): Promise<BridgeTransaction> {
    if (!quote.providerData || !('spokePoolAddress' in quote.providerData)) {
      throw new Error('Missing Across quote data')
    }

    const acrossQuote = quote.providerData as AcrossQuoteResponse
    const fromChainId = getChainId(quote.fromToken.chain)
    const toChainId = getChainId(quote.toToken.chain)

    if (!fromChainId || !toChainId) {
      throw new Error('Unsupported chain')
    }

    try {
      console.log('Preparing Across bridge transaction with params:', {
        fromChainId,
        toChainId,
        fromToken: quote.fromToken.address,
        amount: quote.fromAmount.toString(),
        toAddress
      })

      // Calculate fill deadline (5 hours from now)
      const fillDeadlineBuffer = 18000 // 5 hours in seconds
      const fillDeadline = Math.round(Date.now() / 1000) + fillDeadlineBuffer

      // Construct depositV3 parameters
      const depositParams = {
        depositor: toAddress as Address,
        recipient: toAddress as Address,
        inputToken: quote.fromToken.address as Address,
        outputToken: ZERO_ADDRESS as Address, // Will be resolved to equivalent token on destination
        inputAmount: BigInt(quote.fromAmount.toString()),
        outputAmount: BigInt(quote.expectedOutput.toString()),
        destinationChainId: BigInt(toChainId),
        exclusiveRelayer: acrossQuote.exclusiveRelayer as Address,
        quoteTimestamp: Number(acrossQuote.timestamp),
        fillDeadline,
        exclusivityDeadline: Number(acrossQuote.exclusivityDeadline),
        message: '0x' as `0x${string}` // No message for basic transfers
      }

      console.log('Constructing depositV3 call with params:', depositParams)

      // Encode the function call
      const data = encodeFunctionData({
        abi: SPOKE_POOL_ABI,
        functionName: 'depositV3',
        args: [
          depositParams.depositor,
          depositParams.recipient,
          depositParams.inputToken,
          depositParams.outputToken,
          depositParams.inputAmount,
          depositParams.outputAmount,
          depositParams.destinationChainId,
          depositParams.exclusiveRelayer,
          depositParams.quoteTimestamp,
          depositParams.fillDeadline,
          depositParams.exclusivityDeadline,
          depositParams.message
        ]
      })

      const bridgeTransaction: BridgeTransaction = {
        to: acrossQuote.spokePoolAddress as Address,
        data,
        value: quote.fromToken.address === ZERO_ADDRESS ? depositParams.inputAmount : BigInt(0), // Only send value if using native token
        chainId: fromChainId
      }

      console.log('Prepared bridge transaction:', bridgeTransaction)

      return bridgeTransaction
    } catch (error) {
      console.error('Across transaction preparation error:', error)
      throw error
    }
  }
}
