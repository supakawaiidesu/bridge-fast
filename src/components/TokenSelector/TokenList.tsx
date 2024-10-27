import { TOKEN_LIST } from '@/data/tokens';
import { Token } from '@/types/token';

// Define valid chain keys
type ChainKey = 'ethereum' | 'optimism' | 'arbitrum' | 'polygon' | 'base';

interface TokenListProps {
  searchQuery: string;
  selectedChain: string;
  onSelect: (token: Token) => void;
}

export function TokenList({ searchQuery, selectedChain, onSelect }: TokenListProps) {
  // Helper function to convert chain name to valid key
  const normalizeChainKey = (chain: string): ChainKey | null => {
    const key = chain.toLowerCase();
    if (key === 'ethereum' || 
        key === 'optimism' || 
        key === 'arbitrum' || 
        key === 'polygon' || 
        key === 'base') {
      return key as ChainKey;
    }
    return null;
  };

  // Helper function to check if token is available on a chain
  const isTokenAvailableOnChain = (
    token: typeof TOKEN_LIST.tokens[0], 
    chain: string
  ): boolean => {
    if (chain === 'All networks') {
      return Object.keys(token.addresses).length > 0;
    }
    
    const chainKey = normalizeChainKey(chain);
    if (!chainKey) return false;
    
    return chainKey in token.addresses;
  };

  const filteredTokens = TOKEN_LIST.tokens.filter((token) => {
    const matchesSearch = 
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesChain = isTokenAvailableOnChain(token, selectedChain);
    
    return matchesSearch && matchesChain;
  });

  return (
    <div className="space-y-2">
      {filteredTokens.map((token) => {
        // Get the token address for the selected chain
        const chainKey = normalizeChainKey(selectedChain);
        let tokenAddress = '';
        
        if (selectedChain === 'All networks') {
          // Use first available address for "All networks"
          const firstChainKey = Object.keys(token.addresses)[0] as ChainKey;
          tokenAddress = token.addresses[firstChainKey] ?? '';
        } else if (chainKey && chainKey in token.addresses) {
          tokenAddress = token.addresses[chainKey] ?? '';
        }
        
        // Transform to Token for the UI
        const uiToken: Token = {
          symbol: token.symbol,
          name: token.name,
          logo: token.logo,
          chain: selectedChain,
          balance: '0',
          value: '$0.00'
        };
        
        return (
          <button
            key={`${token.symbol}-${tokenAddress}`}
            onClick={() => onSelect(uiToken)}
            className="w-full p-3 flex items-center justify-between rounded-lg hover:bg-[#2B2D33] transition-colors"
          >
            <div className="flex items-center gap-3">
              <img src={token.logo} alt={token.name} className="w-8 h-8" />
              <div className="text-left">
                <div className="font-medium text-white">{token.symbol}</div>
                <div className="text-sm text-[#5D6785]">{token.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-white">0</div>
              <div className="text-sm text-[#5D6785]">$0.00</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}