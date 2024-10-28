// TokenInput.tsx
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ChevronDown } from 'lucide-react';
import { TokenWithChain } from '../../types/token';
import arbitrumIcon from '../../icons/arbitrum.svg';
import baseIcon from '../../icons/base.svg';
import ethereumIcon from '../../icons/ethereum.svg';
import optimismIcon from '../../icons/optimism.svg';
import polygonIcon from '../../icons/polygon.svg';

const chainIcons: Record<string, string> = {
  Ethereum: ethereumIcon,
  ethereum: ethereumIcon,
  Arbitrum: arbitrumIcon,
  arbitrum: arbitrumIcon,
  Optimism: optimismIcon,
  optimism: optimismIcon,
  Polygon: polygonIcon,
  polygon: polygonIcon,
  Base: baseIcon,
  base: baseIcon,
};

interface TokenInputProps {
  label: string;
  amount: string;
  token: TokenWithChain;
  balance?: string;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTokenSelect: () => void;
  showChain?: boolean;
  bgColor?: string;
}

export function TokenInput({ 
  label, 
  amount, 
  token, 
  balance = '0', 
  onAmountChange, 
  onTokenSelect,
  showChain = false,
  bgColor = '#131313'
}: TokenInputProps) {
  const handleBalanceClick = () => {
    const event = {
      target: { value: balance },
    } as React.ChangeEvent<HTMLInputElement>;
    onAmountChange(event);
  };

  return (
    <div className={`rounded-2xl p-4`} style={{ 
      backgroundColor: bgColor,
      ...(bgColor === '#131313' ? { border: '1px solid #303030' } : {})
    }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-[#5e5e5e]">{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Input 
            type="number" 
            value={amount}
            onChange={onAmountChange}
            className="border-0 bg-transparent text-3xl font-medium focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto w-[200px] text-[#c9c9c9]"
          />
          <span className="text-sm text-[#5e5e5e]">${parseFloat(amount || "0").toFixed(2)}</span>
        </div>
        <div className="flex flex-col items-end -mt-1">
          <Button
            variant="ghost"
            onClick={onTokenSelect}
            className="h-9 gap-2 font-semibold bg-[#2B2D33] hover:bg-[#404040] rounded-full text-[#c9c9c9]"
          >
            <div className="relative">
              <img 
                src={token.logo} 
                className="w-5 h-5 rounded-full" 
                alt={token.symbol} 
              />
              {showChain && (
                <img 
                  src={chainIcons[token.chain.toLowerCase()]}
                  alt={token.chain}
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#1A1B1F] p-0.5"
                />
              )}
            </div>
            {token.symbol}
            <ChevronDown className="w-4 h-4" />
          </Button>
          <button
            onClick={handleBalanceClick}
            className="text-sm text-[#5e5e5e] hover:text-[#7D8DB5] transition-colors cursor-pointer mt-1"
          >
            Balance: {balance} {token.symbol}
          </button>
        </div>
      </div>
    </div>
  );
}
