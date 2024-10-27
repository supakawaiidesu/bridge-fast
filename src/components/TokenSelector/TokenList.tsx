import { tokens } from '@/data/tokens';
import { Token } from '@/types/token';

interface TokenListProps {
  searchQuery: string;
  selectedChain: string;
  onSelect: (token: Token) => void;
}

export function TokenList({ searchQuery, selectedChain, onSelect }: TokenListProps) {
  const filteredTokens = tokens.filter(token => {
    const matchesSearch = token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         token.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChain = selectedChain === 'All networks' || token.chain === selectedChain;
    return matchesSearch && matchesChain;
  });

  return (
    <div className="space-y-2">
      {filteredTokens.map((token) => (
        <button
          key={token.symbol}
          onClick={() => onSelect(token)}
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
            <div className="font-medium text-white">{token.balance}</div>
            <div className="text-sm text-[#5D6785]">{token.value}</div>
          </div>
        </button>
      ))}
    </div>
  );
}