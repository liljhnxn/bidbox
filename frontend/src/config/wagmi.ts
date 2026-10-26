import { http, createConfig } from 'wagmi';
import { injected } from '@wagmi/core';
import { botchainMainnet } from './network';

export const config = createConfig({
  chains: [botchainMainnet],
  connectors: [
    injected(),
  ],
  transports: {
    [botchainMainnet.id]: http('https://rpc.botchain.ai'),
  },
  ssr: true,
});

