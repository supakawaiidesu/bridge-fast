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

export function useTokenBalances(selectedChain: string = 'All networks') {
  const { address: userAddress, isConnected } = useAccount();
  const [balances, setBalances] = useState<AnkrAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    const fetchBalances = async () => {
      if (!isConnected || !userAddress) {
        setBalances([]);
        return;
      }

      setIsLoading(true);
      setError(undefined);

      try {
        // Convert selectedChain to Ankr blockchain format
        let blockchains = ['eth', 'arbitrum', 'optimism', 'polygon', 'base'];
        if (selectedChain !== 'All networks') {
          const chain = selectedChain.toLowerCase();
          blockchains = [chain === 'ethereum' ? 'eth' : chain];
        }

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
              blockchain: blockchains,
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
        setBalances(result.assets);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch balances'));
        setBalances([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [userAddress, isConnected, selectedChain]);

  return {
    balances,
    isLoading,
    error
  };
}
