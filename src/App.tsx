import { useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TokenSelector } from '@/components/TokenSelector/TokenSelector';
import { SwapHeader } from '@/components/SwapInterface/SwapHeader';
import { TokenInput } from '@/components/SwapInterface/TokenInput';
import { Token } from '@/types/token';
import { tokens } from '@/data/tokens';

function App() {
  const [sellAmount, setSellAmount] = useState<string>("50");
  const [buyAmount, setBuyAmount] = useState<string>("49.9915");
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token>(tokens[1]); // USDC

  const handleSellAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSellAmount(value);
    setBuyAmount((parseFloat(value) * 0.99983).toFixed(4));
  };

  const handleBuyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBuyAmount(value);
    setSellAmount((parseFloat(value) / 0.99983).toFixed(4));
  };

  return (
    <div className="min-h-screen bg-[#0D111C] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-[480px]">
        <SwapHeader />

        <Card className="bg-[#0D111C] border-[#2B2D33] p-1">
          <TokenInput
            label="Sell"
            amount={sellAmount}
            token={selectedToken}
            balance={selectedToken.balance}
            onAmountChange={handleSellAmountChange}
            onTokenSelect={() => setIsTokenSelectorOpen(true)}
          />

          <div className="flex justify-center -my-2.5 relative z-10">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl bg-[#131A2A] border border-[#2B2D33] hover:bg-[#1C2537]"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>

          <TokenInput
            label="Buy"
            amount={buyAmount}
            token={selectedToken}
            balance="0.004"
            onAmountChange={handleBuyAmountChange}
            onTokenSelect={() => setIsTokenSelectorOpen(true)}
          />

          <div className="px-4 py-2 text-sm text-[#5D6785] flex items-center justify-between">
            <span>1 {selectedToken.symbol} = 1.00017 {selectedToken.symbol} ($1.00)</span>
            <span className="flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#5D6785]">
                <path d="M12 4L12 20M12 4L18 10M12 4L6 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              $0.02
            </span>
          </div>

          <Button className="w-full h-14 text-base font-semibold bg-[#FF00B8] hover:bg-[#E100A4] rounded-2xl">
            Review
          </Button>
        </Card>

        <TokenSelector
          isOpen={isTokenSelectorOpen}
          onClose={() => setIsTokenSelectorOpen(false)}
          onSelect={setSelectedToken}
        />
      </div>
    </div>
  );
}

export default App;