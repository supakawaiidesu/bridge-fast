// src/components/TokenSelector/TokenList.tsx
import { TOKEN_LIST } from '../../data/tokens';
import { TokenWithChain } from '../../types/token';
import { useTokenBalances } from '../../hooks/use-token-balances';
import { useAccount } from 'wagmi';
import { Skeleton } from '../ui/skeleton';

interface TokenListProps {
  searchQuery: string;
  selectedChain: string;
  onSelect: (token: TokenWithChain) => void;
}

export function TokenList({ searchQuery, selectedChain, onSelect }: TokenListProps) {
  const { isConnected } = useAccount();
  const { balances, isLoading } = useTokenBalances(selectedChain);

  // Filter tokens based on search query
  const filteredBalances = balances.filter((asset) => {
    const matchesSearch = 
      asset.tokenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tokenSymbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatChainName = (blockchain: string): string => {
    if (blockchain === 'eth') return 'Ethereum';
    return blockchain.charAt(0).toUpperCase() + blockchain.slice(1);
  };

  return (
    <div className="space-y-2">
      {isLoading ? (
        // Loading state
        Array(3).fill(0).map((_, i) => (
          <div key={i} className="w-full p-3 flex items-center justify-between rounded-lg bg-[#2B2D33]">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full bg-[#3B3D43]" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-20 bg-[#3B3D43]" />
                <Skeleton className="h-4 w-24 bg-[#3B3D43]" />
              </div>
            </div>
            <div className="space-y-1 text-right">
              <Skeleton className="h-5 w-20 bg-[#3B3D43]" />
              <Skeleton className="h-4 w-16 bg-[#3B3D43]" />
            </div>
          </div>
        ))
      ) : (
        filteredBalances.map((asset) => {
          const uiToken: TokenWithChain = {
            symbol: asset.tokenSymbol,
            name: asset.tokenName,
            logo: asset.thumbnail || TOKEN_LIST.tokens.find(t => t.symbol === asset.tokenSymbol)?.logo || '',
            chain: formatChainName(asset.blockchain),
            address: asset.contractAddress || '',
            balance: asset.balance,
            value: `$${parseFloat(asset.balanceUsd).toFixed(2)}`
          };
          
          return (
            <button
              key={`${asset.tokenSymbol}-${asset.blockchain}-${asset.contractAddress || 'native'}`}
              onClick={() => onSelect(uiToken)}
              className="w-full p-3 flex items-center justify-between rounded-lg hover:bg-[#2B2D33] transition-colors"
            >
              <div className="flex items-center gap-3">
                <img 
                  src={uiToken.logo} 
                  alt={asset.tokenName} 
                  className="w-8 h-8"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png';
                  }}
                />
                <div className="text-left">
                  <div className="font-medium text-white">{asset.tokenSymbol}</div>
                  <div className="text-sm text-[#5D6785]">
                    {asset.tokenName}
                    {selectedChain === 'All networks' && (
                      <span className="ml-2 text-[#5D6785]">on {formatChainName(asset.blockchain)}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-white">{parseFloat(asset.balance).toFixed(6)}</div>
                <div className="text-sm text-[#5D6785]">${parseFloat(asset.balanceUsd).toFixed(2)}</div>
              </div>
            </button>
          );
        })
      )}
      {!isLoading && filteredBalances.length === 0 && (
        <div className="text-center text-[#5D6785] py-4">
          {isConnected ? 'No tokens found' : 'Connect wallet to view balances'}
        </div>
      )}
    </div>
  );
}
