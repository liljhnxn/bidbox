import { defineChain, createPublicClient, http } from 'viem';

export const botchainMainnet = defineChain({
  id: 677,
  name: 'Botchain Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.botchain.ai'],
    },
    public: {
      http: ['https://rpc.botchain.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Botchain Scan',
      url: 'https://scan.botchain.ai',
    },
  },
  testnet: false,
});

// Primary active chain
export const botchain = botchainMainnet;

export const publicClient = createPublicClient({
  chain: botchainMainnet,
  transport: http('https://rpc.botchain.ai'),
});
