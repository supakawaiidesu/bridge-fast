import { useState } from 'react'
import { useTransaction, useSendTransaction, useAccount, useSwitchChain } from 'wagmi'
import { BridgeQuote } from '../types/bridge'
import { SynapseBridge } from '../bridges/synapse'
import { Address } from 'viem'
import { getChainId } from '../utils/chains'

interface BridgeTransactionState {
  isLoading: boolean
  error: Error | null
  hash: `0x${string}` | null
}

export function useBridgeTransaction() {
  const [state, setState] = useState<BridgeTransactionState>({
    isLoading: false,
    error: null,
    hash: null,
  })

  const { chain } = useAccount()
  const { switchChain } = useSwitchChain()
  const { sendTransactionAsync } = useSendTransaction()

  // Watch the transaction
  const { isLoading: isConfirming } = useTransaction({
    hash: state.hash ?? undefined,
  })

  const executeBridge = async (quote: BridgeQuote, toAddress: Address) => {
    console.log('Executing bridge with quote:', quote)
    console.log('To address:', toAddress)

    setState({ isLoading: true, error: null, hash: null })

    try {
      // Check if we're on the correct chain
      const requiredChainId = getChainId(quote.fromToken.chain)
      if (!requiredChainId) {
        throw new Error(`Unsupported chain: ${quote.fromToken.chain}`)
      }

      console.log('Current chain:', chain?.id, 'Required chain:', requiredChainId)
      
      if (chain?.id !== requiredChainId) {
        console.log('Switching to required chain...')
        await switchChain({ chainId: requiredChainId })
      }

      let bridge
      switch (quote.bridgeName) {
        case 'Synapse':
          bridge = new SynapseBridge()
          break
        default:
          throw new Error(`Unsupported bridge provider: ${quote.bridgeName}`)
      }

      // Get the transaction data
      console.log('Getting transaction data from bridge...')
      const tx = await bridge.prepareTransaction(quote, toAddress)
      console.log('Received transaction data:', tx)

      // Prepare the transaction request
      const request = {
        to: tx.to,
        data: tx.data,
        value: tx.value,
        chainId: tx.chainId,
        account: toAddress,
      }

      console.log('Sending transaction with request:', request)

      // Send the transaction
      const result = await sendTransactionAsync(request)
      console.log('Transaction sent successfully:', result)

      // Update state with the transaction hash
      setState(prev => ({ ...prev, hash: result.hash, isLoading: false }))

    } catch (error) {
      console.error('Bridge transaction error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState({ isLoading: false, error: new Error(errorMessage), hash: null })
      throw error
    }
  }

  return {
    ...state,
    isLoading: state.isLoading || isConfirming,
    executeBridge,
  }
}
