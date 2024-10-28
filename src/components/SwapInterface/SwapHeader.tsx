// components/SwapInterface/SwapHeader.tsx
import { Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function SwapHeader() {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex gap-4 text-sm">
        <button className="bg-[#2B2D33] px-3 py-1.5 rounded-full font-semibold">Swap</button>
        <button className="text-[#5e5e5e] px-3 py-1.5">Trade Perps</button>
      </div>
      <div className="flex items-center gap-2">
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  'style': {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <Button 
                        onClick={openConnectModal}
                        className="bg-[#FF00B8] hover:bg-[#E100A4] h-8 text-sm font-semibold rounded-full"
                      >
                        Connect
                      </Button>
                    );
                  }

                  return (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={openChainModal}
                        className="h-8 text-sm bg-[#131313] hover:bg-[#2B2D33] text-white rounded-full"
                      >
                        {chain.name}
                      </Button>
                      <Button
                        onClick={openAccountModal}
                        className="h-8 text-sm bg-[#131313] hover:bg-[#2B2D33] text-white rounded-full"
                      >
                        {account.displayName}
                      </Button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
        <Button variant="ghost" size="icon" className="text-[#5e5e5e] hover:text-white">
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}