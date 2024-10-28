import { useState, useMemo, useEffect } from 'react';
import { ArrowDown } from 'lucide-react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import { TokenSelector } from './components/TokenSelector/TokenSelector';
import { SwapHeader } from './components/SwapInterface/SwapHeader';
import { TokenInput } from './components/SwapInterface/TokenInput';
import { TokenWithChain } from './types/token';
import { TOKEN_LIST } from './data/tokens';
import { useBridgeQuotes } from './hooks/use-bridge-quotes';
import { useBridgeTransaction } from './hooks/use-bridge-transaction';
import { QuoteRequest } from './types/bridge';
import { utils } from 'ethers';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { getChainId } from './utils/chains';

function App() {
  const [sellAmount, setSellAmount] = useState<string>("0");
  const [buyAmount, setBuyAmount] = useState<string>("0");
  const [isSourceTokenSelectorOpen, setIsSourceTokenSelectorOpen] = useState(false);
  const [isTargetTokenSelectorOpen, setIsTargetTokenSelectorOpen] = useState(false);
  const [hasClickedBridge, setHasClickedBridge] = useState(false);
  
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  
  // Initialize with default tokens on different chains
  const defaultSourceToken: TokenWithChain = {
    symbol: TOKEN_LIST.tokens[1].symbol,
    name: TOKEN_LIST.tokens[1].name,
    logo: TOKEN_LIST.tokens[1].logo,
    chain: 'Arbitrum',
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
    if (!sellAmount || sellAmount === "0" || !sourceToken || !targetToken) return null;
    
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
  const { quotes, loading: quotesLoading, error: quotesError } = useBridgeQuotes(quoteRequest);
  const { 
    executeBridge, 
    handleApproval,
    isLoading: transactionLoading, 
    error: transactionError, 
    hash,
    needsApproval 
  } = useBridgeTransaction();

  // Check if we need to switch networks
  const needsChainSwitch = useMemo(() => {
    if (!chainId || !sourceToken) return false;
    const requiredChainId = getChainId(sourceToken.chain);
    return chainId !== requiredChainId;
  }, [chainId, sourceToken]);

  // Use the best quote to set the buy amount
  useEffect(() => {
    if (quotes.length > 0) {
      const bestQuote = quotes[0]; // Quotes are sorted by best rate
      const formattedAmount = utils.formatUnits(
        bestQuote.expectedOutput,
        targetToken.decimals
      );
      setBuyAmount(formattedAmount);
    } else if (!quotesLoading && !quotesError) {
      setBuyAmount("0");
    }
  }, [quotes, targetToken.decimals, quotesLoading, quotesError]);

  const handleSellAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSellAmount(value);
    if (!value || value === "0") {
      setBuyAmount("0");
    }
  };

  const handleBuyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBuyAmount(value);
  };

  const handleButtonClick = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    if (needsChainSwitch) {
      const requiredChainId = getChainId(sourceToken.chain);
      if (requiredChainId) {
        switchChain({ chainId: requiredChainId });
      }
      return;
    }

    if (quotes.length === 0 || !address) return;

    try {
      setHasClickedBridge(true);
      
      if (needsApproval) {
        // Handle token approval
        const quote = quotes[0];
        const amountRequired = BigInt(quote.fromAmount.toString());
        await handleApproval(
          quote.fromToken.address as `0x${string}`,
          '0x00cD000000003f7F682BE4813200893d4e690000' as `0x${string}`,
          amountRequired
        );
      } else {
        // Execute bridge transaction
        await executeBridge(quotes[0], address);
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      setHasClickedBridge(false);
    }
  };

  // Reset hasClickedBridge when transaction is complete
  useEffect(() => {
    if (hash) {
      setHasClickedBridge(false);
    }
  }, [hash]);

  const getButtonText = () => {
    if (!isConnected) return 'Connect Wallet';
    if (quotesLoading) return 'Getting Best Route...';
    if (hasClickedBridge && transactionLoading) return 'Confirming Transaction...';
    if (needsChainSwitch) return `Switch to ${sourceToken.chain}`;
    if (needsApproval) return 'Approve';
    return 'Bridge';
  };

  return (
    <div className="min-h-screen bg-[#131313] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-[480px]">
        <SwapHeader />

        <Card className="bg-[#131313] border-[#131313] p-1">
          <TokenInput
            label="Sell"
            amount={sellAmount}
            token={sourceToken}
            balance={sourceToken.balance}
            onAmountChange={handleSellAmountChange}
            onTokenSelect={() => setIsSourceTokenSelectorOpen(true)}
            showChain={true}
            bgColor="#131313"
          />

          <div className="relative z-10 flex justify-center -my-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl bg-[#1b1b1b] border-2 border-[#131313] hover:bg-[#242424]"
            >
              <ArrowDown className="w-4 h-4 text-white" />
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
            bgColor="#1b1b1b"
          />

          <div className="px-4 py-2 text-sm text-[#5e5e5e] flex items-center justify-between">
            {quotesLoading ? (
              <span>Loading quotes...</span>
            ) : quotesError ? (
              <span className="text-red-500">{quotesError}</span>
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
              className="w-full h-14 text-base font-semibold bg-[#6849f3] hover:bg-[#553ebb] rounded-2xl"
              disabled={quotesLoading || transactionLoading || (!needsChainSwitch && quotes.length === 0)}
              onClick={handleButtonClick}
            >
              {getButtonText()}
            </Button>
            {transactionError && (
              <p className="mt-2 text-sm text-red-500">{transactionError.message}</p>
            )}
            {hash && (
              <p className="mt-2 text-sm text-green-500">
                Transaction submitted! Hash: {hash}
              </p>
            )}
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
