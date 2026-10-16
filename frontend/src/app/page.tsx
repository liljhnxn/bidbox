'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { BIDBOX_ABI, BIDBOX_CONTRACT_ADDRESS } from '@/config/contract';
import { botchainTestnet, publicClient } from '@/config/network';
import { Header } from '@/components/Header';
import { AuctionCard } from '@/components/AuctionCard';
import { PlaceBid } from '@/components/PlaceBid';
import { MyActivity } from '@/components/MyActivity';
import { CreatorControls } from '@/components/CreatorControls';
import { RefreshCw, ExternalLink, HelpCircle, Terminal, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function Home() {
  const { address } = useAccount();

  // Allow custom address override or fallback to configured address
  const [contractAddress, setContractAddress] = useState<string>(
    BIDBOX_CONTRACT_ADDRESS || ''
  );
  const [addressInput, setAddressInput] = useState<string>(
    BIDBOX_CONTRACT_ADDRESS || ''
  );

  const isValidAddress =
    contractAddress.startsWith('0x') && contractAddress.length === 42;

  // Read Auction Details from the smart contract
  const {
    data: auctionDetails,
    isLoading: isLoadingDetails,
    isRefetching,
    refetch: refetchDetails,
  } = useReadContract({
    address: (isValidAddress ? contractAddress : undefined) as `0x${string}`,
    abi: BIDBOX_ABI,
    functionName: 'getAuctionDetails',
    chainId: botchainTestnet.id,
    query: {
      enabled: isValidAddress,
      refetchInterval: 6000, // Refresh automatically every 6 seconds
    },
  });

  // Read User Refund balance
  const {
    data: userRefund,
    refetch: refetchRefund,
  } = useReadContract({
    address: (isValidAddress ? contractAddress : undefined) as `0x${string}`,
    abi: BIDBOX_ABI,
    functionName: 'refunds',
    args: address ? [address] : undefined,
    chainId: botchainTestnet.id,
    query: {
      enabled: isValidAddress && !!address,
      refetchInterval: 6000,
    },
  });

  const [directDetails, setDirectDetails] = useState<any>(null);
  const [directRefund, setDirectRefund] = useState<bigint>(BigInt(0));

  // Fast sync via server API route to bypass browser adblockers/CORS
  const syncContractDirectly = async () => {
    if (!isValidAddress) return;
    try {
      const url = `/api/auction?address=${contractAddress}${address ? `&user=${address}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDirectDetails([
          data.itemName,
          data.creator,
          BigInt(data.auctionEndTime),
          data.highestBidder,
          BigInt(data.highestBid),
          BigInt(data.totalBids),
          data.ended,
          data.cancelled,
          BigInt(data.timeLeft),
        ]);
        if (data.userRefund) {
          setDirectRefund(BigInt(data.userRefund));
        }
      }
    } catch (err) {
      console.error('Server sync error:', err);
    }
  };

  useEffect(() => {
    syncContractDirectly();
    const interval = setInterval(syncContractDirectly, 4000);
    return () => clearInterval(interval);
  }, [contractAddress, isValidAddress, address]);

  const handleRefresh = () => {
    refetchDetails();
    if (address) refetchRefund();
    syncContractDirectly();
  };

  useEffect(() => {
    if (BIDBOX_CONTRACT_ADDRESS) {
      setContractAddress(BIDBOX_CONTRACT_ADDRESS);
      setAddressInput(BIDBOX_CONTRACT_ADDRESS);
    }
  }, []);

  const handleInputChange = (val: string) => {
    setAddressInput(val);
    const clean = val.trim();
    if (clean.startsWith('0x') && clean.length === 42) {
      setContractAddress(clean);
    }
  };

  const handleUpdateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = addressInput.trim();
    if (clean.startsWith('0x') && clean.length === 42) {
      setContractAddress(clean);
      syncContractDirectly();
    }
  };

  // Combine wagmi reactive cache with direct RPC sync
  const activeDetails = auctionDetails || directDetails;

  const [
    itemName = '',
    creator = '',
    auctionEndTime = BigInt(0),
    highestBidder = '',
    highestBid = BigInt(0),
    totalBids = BigInt(0),
    ended = false,
    cancelled = false,
  ] = activeDetails || [];

  const activeRefund = userRefund !== undefined ? userRefund : directRefund;

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
          {/* Top Contract Config & Refresh Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-navy-900/60 border border-navy-700/70 text-xs">
            <form
              onSubmit={handleUpdateAddress}
              className="flex items-center space-x-2 flex-grow max-w-xl"
            >
              <span className="text-slate-400 font-medium shrink-0">Contract:</span>
              <input
                type="text"
                placeholder="0x... (Deployed BidBox Contract Address)"
                value={addressInput}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700/80 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 font-semibold transition-colors shrink-0"
              >
                Set
              </button>
            </form>

            <div className="flex items-center justify-between sm:justify-end space-x-3">
              {isValidAddress && (
                <a
                  href={`https://scan.bohr.life/address/${contractAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 text-slate-400 hover:text-purple-300 transition-colors"
                >
                  <span>BohrScan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={handleRefresh}
                disabled={isRefetching || isLoadingDetails}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white transition-colors"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-purple-400' : ''}`}
                />
                <span>{isRefetching ? 'Syncing...' : 'Sync'}</span>
              </button>
            </div>
          </div>

          {/* If No Valid Contract Address Configured Banner */}
          {!isValidAddress && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-navy-900 to-navy-850 border border-purple-500/30 text-slate-200 shadow-xl">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Terminal className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    Ready to Connect Your Deployed BidBox Auction
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                    Deploy your smart contract to Botchain Testnet using the command below, or paste your contract address above.
                  </p>
                  <div className="mt-2 p-3 rounded-xl bg-black/60 font-mono text-xs text-purple-300 border border-purple-900/50 flex items-center justify-between">
                    <code>npm run deploy:botchain</code>
                    <span className="text-[10px] text-slate-500">Chain ID 968</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Auction Showcase */}
          <AuctionCard
            itemName={itemName || 'BidBox Genesis Pass #002'}
            auctionEndTime={auctionEndTime}
            highestBidder={highestBidder}
            highestBid={highestBid}
            totalBids={totalBids}
            ended={ended}
            cancelled={cancelled}
            contractAddress={contractAddress}
          />

          {/* Bidding & User Activity Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PlaceBid
              contractAddress={contractAddress as `0x${string}`}
              highestBid={highestBid}
              highestBidder={highestBidder}
              ended={ended}
              cancelled={cancelled}
              isCreator={!!address && !!creator && address.toLowerCase() === creator.toLowerCase()}
              onSuccess={handleRefresh}
            />

            <div className="space-y-6">
              <MyActivity
                contractAddress={contractAddress as `0x${string}`}
                highestBidder={highestBidder}
                userRefund={activeRefund}
                onSuccess={handleRefresh}
              />

              {/* Botchain Rules & Security Card */}
              <div className="glass-panel rounded-3xl p-6 border border-navy-700/80 shadow-xl text-xs space-y-3">
                <div className="flex items-center space-x-2 text-slate-300 font-bold">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  <span>On-Chain Auction Guarantees</span>
                </div>
                <ul className="space-y-2 text-slate-400">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-300">Escrow Security:</strong> Bids are stored securely in the smart contract until the auction concludes.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-300">Safe Refunds:</strong> If you are outbid, 100% of your BOT is credited to your refundable balance for instant withdrawal.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-300">Reentrancy Protected:</strong> Built strictly following checks-effects-interactions and reentrancy guard standards.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Auction Creator Controls */}
          <CreatorControls
            contractAddress={contractAddress as `0x${string}`}
            creatorAddress={creator}
            totalBids={totalBids}
            highestBid={highestBid}
            auctionEndTime={auctionEndTime}
            ended={ended}
            cancelled={cancelled}
            onSuccess={handleRefresh}
          />
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-navy-800/80 bg-[#070A12]/90 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-300">BidBox</span>
            <span>&bull;</span>
            <span>Decentralized On-Chain Auction</span>
          </div>

          <div className="flex items-center space-x-6 text-slate-400">
            <a
              href="https://rpc.bohr.life"
              target="_blank"
              rel="noreferrer"
              className="hover:text-purple-300 transition-colors"
            >
              RPC: https://rpc.bohr.life
            </a>
            <a
              href="https://scan.bohr.life"
              target="_blank"
              rel="noreferrer"
              className="hover:text-purple-300 transition-colors"
            >
              BohrScan Explorer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
