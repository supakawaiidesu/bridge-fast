import { useState, useMemo, useEffect } from 'react';
import { ArrowDown } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TokenSelector } from "@/components/TokenSelector/TokenSelector";
import { SwapHeader } from "@/components/SwapInterface/SwapHeader";
import { TokenInput } from "@/components/SwapInterface/TokenInput";
import { TokenWithChain } from "@/types/token";
import { TOKEN_LIST } from './data/tokens';
import { useBridgeQuotes } from './hooks/use-bridge-quotes';
import { QuoteRequest } from './types/bridge';
import { utils } from 'ethers';

function App() {
  const [sellAmount, setSellAmount] = useState<string>("50");
  const [buyAmount, setBuyAmount] = useState<string>("49.9915");
  const [isSourceTokenSelectorOpen, setIsSourceTokenSelectorOpen] = useState(false);
  const [isTargetTokenSelectorOpen, setIsTargetTokenSelectorOpen] = useState(false);
  
  // Initialize with default tokens on different chains
  const defaultSourceToken: TokenWithChain = {
    symbol: TOKEN_LIST.tokens[1].symbol,
    name: TOKEN_LIST.tokens[1].name,
    logo: TOKEN_LIST.tokens[1].logo,
    chain: 'Ethereum',
    address: TOKEN_LIST.tokens[1].addresses.ethereum,
    decimals: TOKEN_LIST.tokens[1].decimals,
    balance: '0',
    value: '$0.00'
  };
  
  const defaultTargetToken: TokenWithChain = {
    symbol: TOKEN_LIST.tokens[1].symbol,
    name: TOKEN_LIST.tokens[1].name,
    logo: TOKEN_LIST.tokens[1].logo,
    chain: 'Optimism',
    address: TOKEN_LIST.tokens[1].addresses.optimism,
    decimals: TOKEN_LIST.tokens[1].decimals,
    balance: '0',
    value: '$0.00'
  };
  
  const [sourceToken, setSourceToken] = useState<TokenWithChain>(defaultSourceToken);
  const [targetToken, setTargetToken] = useState<TokenWithChain>(defaultTargetToken);

  // Create quote request for the bridge
  const quoteRequest = useMemo<QuoteRequest | null>(() => {
    if (!sellAmount || !sourceToken || !targetToken) return null;
    
    try {
      // Convert amount to proper decimal format
      const parsedAmount = utils.parseUnits(sellAmount, sourceToken.decimals).toString();
      
      return {
        fromToken: sourceToken,
        toToken: targetToken,
        amount: parsedAmount
      };
    } catch (err) {
      console.error('Failed to create quote request:', err);
      return null;
    }
  }, [sellAmount, sourceToken, targetToken]);

  // Get quotes from bridges
  const { quotes, loading, error } = useBridgeQuotes(quoteRequest);

  // Use the best quote to set the buy amount
  useEffect(() => {
    if (quotes.length > 0) {
      const bestQuote = quotes[0]; // Quotes are sorted by best rate
      const formattedAmount = utils.formatUnits(
        bestQuote.expectedOutput,
        targetToken.decimals
      );
      setBuyAmount(formattedAmount);
    }
  }, [quotes, targetToken.decimals]);

  const handleSellAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSellAmount(value);
  };

  const handleBuyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBuyAmount(value);
  };

  return (
    <div className="min-h-screen bg-[#0D111C] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-[480px]">
        <SwapHeader />

        <Card className="bg-[#0D111C] border-[#2B2D33] p-1">
          <TokenInput
            label="Sell"
            amount={sellAmount}
            token={sourceToken}
            balance={sourceToken.balance}
            onAmountChange={handleSellAmountChange}
            onTokenSelect={() => setIsSourceTokenSelectorOpen(true)}
            showChain={true}
          />

          <div className="flex justify-center -my-2.5 relative z-10">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl bg-[#131A2A] border border-[#2B2D33] hover:bg-[#1C2537]"
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
          </div>

          <TokenInput
            label="Buy"
            amount={buyAmount}
            token={targetToken}
            balance={targetToken.balance}
            onAmountChange={handleBuyAmountChange}
            onTokenSelect={() => setIsTargetTokenSelectorOpen(true)}
            showChain={true}
          />

          <div className="px-4 py-2 text-sm text-[#5D6785] flex items-center justify-between">
            {loading ? (
              <span>Loading quotes...</span>
            ) : error ? (
              <span className="text-red-500">{error}</span>
            ) : quotes.length > 0 ? (
              <>
                <span>
                  Best rate via {quotes[0].bridgeName}
                </span>
                <span className="flex items-center gap-1">
                  Fee: {utils.formatUnits(quotes[0].feeAmount, sourceToken.decimals)} {sourceToken.symbol}
                </span>
              </>
            ) : (
              <span>No quotes available</span>
            )}
          </div>

          <div className="p-4">
            <Button 
              className="w-full h-14 text-base font-semibold bg-[#FF00B8] hover:bg-[#E100A4] rounded-2xl"
              disabled={loading || quotes.length === 0}
            >
              {loading ? 'Getting Best Route...' : 'Review Bridge'}
            </Button>
          </div>
        </Card>

        <TokenSelector
          isOpen={isSourceTokenSelectorOpen}
          onClose={() => setIsSourceTokenSelectorOpen(false)}
          onSelect={(token) => setSourceToken(token as TokenWithChain)}
          currentChain={sourceToken.chain}
        />

        <TokenSelector
          isOpen={isTargetTokenSelectorOpen}
          onClose={() => setIsTargetTokenSelectorOpen(false)}
          onSelect={(token) => setTargetToken(token as TokenWithChain)}
          currentChain={targetToken.chain}
        />
      </div>
    </div>
  );
}

export default App;
