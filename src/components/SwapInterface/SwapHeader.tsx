import { Settings } from 'lucide-react';
import { Button } from "../../components/ui/button";
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function SwapHeader() {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex gap-4 text-sm">
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openChainModal,
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
                    return null;
                  }

                  return (
                    <Button
                      onClick={openChainModal}
                      className="h-8 text-sm bg-[#131313] hover:bg-[#2B2D33] text-white rounded-full"
                    >
                      {chain.name}
                    </Button>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
      <div className="flex items-center gap-2">
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
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
                    <Button
                      onClick={openAccountModal}
                      className="h-8 text-sm bg-[#131313] hover:bg-[#2B2D33] text-white rounded-full"
                    >
                      {account.displayName}
                    </Button>
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
