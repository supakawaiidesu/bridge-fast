// hooks/useBridgeTransaction.ts
import { useState, useCallback } from 'react'
import {
  useTransaction,
  useSendTransaction,
  useAccount,
  useSwitchChain,
  useWriteContract,
  usePublicClient,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { BridgeQuote, DebridgeQuoteResponse, SynapseQuoteResponse, AcrossQuoteResponse } from '../types/bridge'
import { SynapseBridge } from '../bridges/synapse'
import { DeBridge } from '../bridges/debridge'
import { AcrossBridge } from '../bridges/across'
import { Address } from 'viem'
import { getChainId } from '../utils/chains'

// Minimal ERC20 ABI
const ERC20_ABI = [
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
]

interface BridgeTransactionState {
  isLoading: boolean
  error: Error | null
  hash: `0x${string}` | undefined
  needsApproval: boolean
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function useBridgeTransaction() {
  const [state, setState] = useState<BridgeTransactionState>({
    isLoading: false,
    error: null,
    hash: undefined,
    needsApproval: false
  })

  const { address, chain } = useAccount()
  const { switchChain } = useSwitchChain()
  const { sendTransactionAsync } = useSendTransaction()
  const publicClient = usePublicClient()

  // Watch the transaction
  const { isLoading: isConfirming } = useTransaction({
    hash: state.hash,
  })

  // Token approval contract write
  const { writeContractAsync } = useWriteContract()

  // Wait for approval transaction
  const { isLoading: isWaitingForApproval } = useWaitForTransactionReceipt({
    hash: state.hash,
  })

  // Function to check allowance
  const checkAllowance = useCallback(
    async (
      tokenAddress: Address,
      spender: Address,
      amount: bigint
    ): Promise<boolean> => {
      if (!address || !publicClient) {
        throw new Error('Wallet not connected')
      }

      try {
        console.log('Checking allowance for:', {
          token: tokenAddress,
          owner: address,
          spender,
          requiredAmount: amount.toString()
        })

        const allowanceData = await publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, spender],
        })

        const allowance = allowanceData as bigint
        console.log('Current allowance:', allowance.toString())
        
        const hasEnoughAllowance = allowance >= amount
        console.log('Has enough allowance:', hasEnoughAllowance)
        
        return hasEnoughAllowance
      } catch (error) {
        console.error('Error checking allowance:', error)
        throw error
      }
    },
    [address, publicClient]
  )

  // Function to handle token approval
  const handleApproval = useCallback(
    async (
      tokenAddress: Address,
      spender: Address,
      amount: bigint
    ): Promise<void> => {
      if (!address || !publicClient) {
        throw new Error('Wallet not connected')
      }

      try {
        console.log('Requesting approval for:', {
          token: tokenAddress,
          spender,
          amount: amount.toString()
        })

        // Request approval
        const hash = await writeContractAsync({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [spender, amount],
        })

        setState(prev => ({ ...prev, hash }))
        console.log('Approval transaction sent:', hash)
      } catch (error) {
        console.error('Approval error:', error)
        throw error
      }
    },
    [address, publicClient, writeContractAsync]
  )

  // Function to execute the bridge transaction
  const executeBridge = useCallback(
    async (quote: BridgeQuote, toAddress: Address) => {
      console.log('Executing bridge with quote:', quote)
      console.log('To address:', toAddress)

      if (!address) {
        throw new Error('Wallet not connected')
      }

      if (!quote.fromToken.address) {
        throw new Error('Token address required')
      }

      setState(prev => ({ ...prev, isLoading: true, error: null, hash: undefined }))

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

        // Get the spender address from the quote's provider data
        let spenderAddress: Address
        const providerData = quote.providerData

        if (!providerData) {
          throw new Error('Missing provider data in quote')
        }

        console.log('Getting spender address for bridge:', quote.bridgeName)

        // Get the spender address based on the bridge name
        switch (quote.bridgeName) {
          case 'Synapse': {
            const synapseData = providerData as SynapseQuoteResponse
            spenderAddress = synapseData.routerAddress as Address
            console.log('Using Synapse router:', spenderAddress)
            break
          }
          case 'deBridge': {
            const debridgeData = providerData as DebridgeQuoteResponse
            spenderAddress = debridgeData.tx.allowanceTarget as Address
            console.log('Using deBridge router:', spenderAddress)
            break
          }
          case 'Across': {
            const acrossData = providerData as AcrossQuoteResponse
            spenderAddress = acrossData.spokePoolAddress as Address
            console.log('Using Across SpokePool:', spenderAddress)
            break
          }
          default:
            throw new Error(`Unknown bridge: ${quote.bridgeName}`)
        }

        // Check if token is native (ETH/MATIC/etc)
        const isNativeToken = quote.fromToken.address.toLowerCase() === ZERO_ADDRESS.toLowerCase()

        // Only check allowance for non-native tokens
        if (!isNativeToken) {
          console.log('Token is not native, checking allowance...')
          // Convert amount to bigint for allowance check
          const amountRequired = BigInt(quote.fromAmount.toString())
          
          const hasAllowance = await checkAllowance(
            quote.fromToken.address as Address,
            spenderAddress,
            amountRequired
          )

          if (!hasAllowance) {
            console.log('Insufficient allowance, approval needed')
            setState(prev => ({ ...prev, needsApproval: true, isLoading: false }))
            return
          }
          console.log('Sufficient allowance found, proceeding with transaction')
        } else {
          console.log('Token is native, skipping allowance check')
        }

        // Get the bridge instance based on the quote
        let bridgeInstance
        switch (quote.bridgeName) {
          case 'Synapse':
            bridgeInstance = new SynapseBridge()
            break
          case 'deBridge':
            bridgeInstance = new DeBridge()
            break
          case 'Across':
            bridgeInstance = new AcrossBridge()
            break
          default:
            throw new Error(`Unknown bridge: ${quote.bridgeName}`)
        }

        // Proceed with the bridge transaction
        console.log('Getting transaction data from bridge...')
        const tx = await bridgeInstance.prepareTransaction(quote, toAddress)
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

        // Update state with the transaction hash
        setState(prev => ({ 
          ...prev, 
          hash: result, 
          isLoading: false,
          needsApproval: false 
        }))
      } catch (error) {
        console.error('Bridge transaction error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: new Error(errorMessage), 
          hash: undefined,
          needsApproval: false
        }))
        throw error
      }
    },
    [address, chain?.id, sendTransactionAsync, switchChain, checkAllowance]
  )

  return {
    ...state,
    isLoading: state.isLoading || isConfirming || isWaitingForApproval,
    executeBridge,
    handleApproval
  }
}
