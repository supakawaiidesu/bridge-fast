// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'wagmi';
import App from './App';
import './index.css';

const config = getDefaultConfig({
  appName: 'Swap Interface',
  projectId: 'YOUR_PROJECT_ID', // Get a project ID from https://cloud.walletconnect.com
  chains: [mainnet, polygon, optimism, arbitrum, base],
  transports: {
    [mainnet.id]: http('https://rpc.ankr.com/eth/757fd7b22f376e3de558f4314e5ec7acfed5b77c6ec675900d6ca9a97708f9ee'),
    [polygon.id]: http('https://rpc.ankr.com/polygon/757fd7b22f376e3de558f4314e5ec7acfed5b77c6ec675900d6ca9a97708f9ee'),
    [optimism.id]: http('https://rpc.ankr.com/optimism/757fd7b22f376e3de558f4314e5ec7acfed5b77c6ec675900d6ca9a97708f9ee'),
    [arbitrum.id]: http('https://rpc.ankr.com/arbitrum/757fd7b22f376e3de558f4314e5ec7acfed5b77c6ec675900d6ca9a97708f9ee'),
    [base.id]: http('https://rpc.ankr.com/base/757fd7b22f376e3de558f4314e5ec7acfed5b77c6ec675900d6ca9a97708f9ee'),
  },
  ssr: true // Enable if you're using SSR
});

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
