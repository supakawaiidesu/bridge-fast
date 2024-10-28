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

const POLLING_INTERVAL = 10000; // 10 seconds

// Tokens to pin at the top of the list
const PINNED_TOKENS = ['ETH', 'USDT', 'DAI', 'USDC', 'USDC.e'];

export function useTokenBalances(selectedChain: string = 'All networks') {
  const { address: userAddress, isConnected } = useAccount();
  const [balances, setBalances] = useState<AnkrAsset[]>([]);
  const [allBalances, setAllBalances] = useState<AnkrAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  // Fetch balances for all chains
  useEffect(() => {
    const fetchBalances = async () => {
      if (!isConnected || !userAddress) {
        setAllBalances([]);
        setBalances([]);
        return;
      }

      setIsLoading(true);
      setError(undefined);

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

        setAllBalances(sortedAssets);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch balances'));
        setAllBalances([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchBalances();

    // Set up polling
    const intervalId = setInterval(fetchBalances, POLLING_INTERVAL);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [userAddress, isConnected]);

  // Filter balances based on selected chain
  useEffect(() => {
    if (selectedChain === 'All networks') {
      setBalances(allBalances);
    } else {
      const chain = selectedChain.toLowerCase();
      const chainFormatted = chain === 'ethereum' ? 'eth' : chain;
      setBalances(allBalances.filter(asset => asset.blockchain === chainFormatted));
    }
  }, [selectedChain, allBalances]);

  return {
    balances,
    isLoading,
    error
  };
}
