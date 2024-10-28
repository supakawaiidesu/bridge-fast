import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

interface AnkrAsset {
  blockchain: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  tokenType: string;
  contractAddress?: string;
  holderAddress: string;
  balance: string;
  balanceRawInteger: string;
  balanceUsd: string;
  tokenPrice: string;
  thumbnail: string;
}

interface AnkrBalanceResponse {
  totalBalanceUsd: string;
  totalCount: number;
  assets: AnkrAsset[];
}

const POLLING_INTERVAL = 20000; // 10 seconds

// Tokens to pin at the top of the list
const PINNED_TOKENS = ['ETH', 'USDT', 'DAI', 'USDC', 'USDC.e'];

// Global state for balances
const globalState = {
  assets: [] as AnkrAsset[],
  lastFetchTime: 0,
  fetchPromise: null as Promise<void> | null
};

// Global fetch function
async function fetchBalances(userAddress: string) {
  // If a fetch is already in progress, wait for it
  if (globalState.fetchPromise) {
    await globalState.fetchPromise;
    return;
  }

  // If not enough time has passed since last fetch, skip
  const now = Date.now();
  if (now - globalState.lastFetchTime < POLLING_INTERVAL) {
    return;
  }

  globalState.fetchPromise = (async () => {
    try {
      const response = await fetch('https://rpc.ankr.com/multichain/79258ce7f7ee046decc3b5292a24eb4bf7c910d7e39b691384c7ce0cfb839a01/?ankr_getAccountBalance', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'ankr_getAccountBalance',
          params: {
            blockchain: ['eth', 'arbitrum', 'optimism', 'polygon', 'base'],
            nativeFirst: true,
            onlyWhitelisted: true,
            walletAddress: userAddress
          },
          id: 1
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balances');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Failed to fetch balances');
      }

      const result = data.result as AnkrBalanceResponse;
      
      // Sort and organize assets
      const sortedAssets = result.assets.sort((a, b) => {
        // First check if either token is pinned
        const aIsPinned = PINNED_TOKENS.includes(a.tokenSymbol);
        const bIsPinned = PINNED_TOKENS.includes(b.tokenSymbol);
        
        if (aIsPinned && !bIsPinned) return -1;
        if (!aIsPinned && bIsPinned) return 1;
        if (aIsPinned && bIsPinned) {
          // If both are pinned, sort by the order in PINNED_TOKENS
          return PINNED_TOKENS.indexOf(a.tokenSymbol) - PINNED_TOKENS.indexOf(b.tokenSymbol);
        }
        
        // If neither is pinned, sort by USD balance
        return parseFloat(b.balanceUsd) - parseFloat(a.balanceUsd);
      });

      globalState.assets = sortedAssets;
      globalState.lastFetchTime = now;
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      globalState.fetchPromise = null;
    }
  })();

  await globalState.fetchPromise;
}

export function useTokenBalances(selectedChain: string = 'All networks') {
  const { address: userAddress, isConnected } = useAccount();
  const [balances, setBalances] = useState<AnkrAsset[]>([]);

  // Effect to start background polling
  useEffect(() => {
    if (!isConnected || !userAddress) {
      setBalances([]);
      return;
    }

    // Initial fetch
    fetchBalances(userAddress);

    // Set up polling
    const intervalId = setInterval(() => {
      fetchBalances(userAddress);
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [userAddress, isConnected]);

  // Effect to update component state from global state
  useEffect(() => {
    const updateFromGlobalState = () => {
      if (selectedChain === 'All networks') {
        setBalances(globalState.assets);
      } else {
        const chain = selectedChain.toLowerCase();
        const chainFormatted = chain === 'ethereum' ? 'eth' : chain;
        setBalances(globalState.assets.filter(asset => asset.blockchain === chainFormatted));
      }
    };

    // Initial update
    updateFromGlobalState();

    // Set up interval to check for global state updates
    const intervalId = setInterval(updateFromGlobalState, 1000);

    return () => clearInterval(intervalId);
  }, [selectedChain]);

  return {
    balances,
    // Always return false for isLoading to prevent loading states in UI
    isLoading: false,
    // Don't expose errors to prevent error states in UI
    error: undefined
  };
}
