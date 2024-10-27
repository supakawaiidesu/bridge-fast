import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown } from 'lucide-react';
import { Token } from '@/types/token';

interface TokenInputProps {
  label: string;
  amount: string;
  token: Token;
  balance: string;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTokenSelect: () => void;
}

export function TokenInput({ 
  label, 
  amount, 
  token, 
  balance, 
  onAmountChange, 
  onTokenSelect 
}: TokenInputProps) {
  return (
    <div className="bg-[#131A2A] rounded-2xl p-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-[#5D6785]">{label}</span>
        <span className="text-sm text-[#5D6785]">Balance: {balance} {token.symbol}</span>
      </div>
      <div className="flex justify-between items-center">
        <Input 
          type="number" 
          value={amount}
          onChange={onAmountChange}
          className="border-0 bg-transparent text-3xl font-medium focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto w-[200px]"
        />
        <Button
          variant="ghost"
          onClick={onTokenSelect}
          className="h-9 gap-2 font-semibold bg-[#2B2D33] hover:bg-[#404040] rounded-full"
        >
          <img src={token.logo} className="w-5 h-5" alt={token.symbol} />
          {token.symbol}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      <span className="text-sm text-[#5D6785]">${parseFloat(amount || "0").toFixed(2)}</span>
    </div>
  );
}