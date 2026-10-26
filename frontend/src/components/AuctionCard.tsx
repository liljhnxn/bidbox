'use client';

import React, { useEffect, useState } from 'react';
import { formatEther } from 'viem';
import Image from 'next/image';
import { Clock, Tag, User, Layers, Sparkles, ExternalLink, Flame } from 'lucide-react';

interface AuctionCardProps {
  itemName: string;
  auctionEndTime: bigint;
  highestBidder: string;
  highestBid: bigint;
  totalBids: bigint;
  ended: boolean;
  cancelled: boolean;
  contractAddress: string;
}

export function AuctionCard({
  itemName,
  auctionEndTime,
  highestBidder,
  highestBid,
  totalBids,
  ended,
  cancelled,
  contractAddress,
}: AuctionCardProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false });

  // Live countdown timer
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const end = Number(auctionEndTime);

      if (end === 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: false });
        return;
      }

      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [auctionEndTime]);

  // Determine status
  let statusBadge = {
    label: Number(auctionEndTime) === 0 ? 'Syncing...' : 'Active',
    bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    dot: 'bg-emerald-400',
  };

  if (cancelled) {
    statusBadge = {
      label: 'Cancelled',
      bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
      dot: 'bg-rose-400',
    };
  } else if (ended || (Number(auctionEndTime) > 0 && timeLeft.isExpired)) {
    statusBadge = {
      label: 'Ended',
      bg: 'bg-slate-500/15 border-slate-500/30 text-slate-300',
      dot: 'bg-slate-400',
    };
  }

  const hasBids = Number(totalBids) > 0;
  const isZeroAddress =
    !highestBidder || highestBidder === '0x0000000000000000000000000000000000000000';

  const shortenAddress = (addr: string) => {
    if (!addr || isZeroAddress) return 'No bids yet';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const highestBidFormatted = formatEther(highestBid);

  return (
    <div className="relative rounded-3xl glass-panel p-6 sm:p-8 overflow-hidden border border-navy-700/80 shadow-2xl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar: Status and Contract Explorer Link */}
      <div className="flex items-center justify-between pb-6 border-b border-navy-800">
        <div className="flex items-center space-x-2.5">
          <span
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.bg}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusBadge.dot} animate-pulse`} />
            <span>{statusBadge.label}</span>
          </span>
          <span className="text-xs font-medium text-slate-400 flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Single Item Auction</span>
          </span>
        </div>

        {contractAddress && (
          <a
            href={`https://scan.botchain.ai/address/${contractAddress}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-xs text-purple-300 hover:text-white transition-all font-medium group"
          >
            <Image
              src="/botchain-logo.png"
              alt="BOT Chain"
              width={14}
              height={14}
              className="w-3.5 h-3.5 rounded object-contain shrink-0 group-hover:scale-110 transition-transform"
            />
            <span>Mainnet Explorer</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        )}
      </div>

      {/* Main Item Showcase */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <Tag className="w-3.5 h-3.5" />
            <span>Auction Lot</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {itemName || 'Genesis Botchain Pass #001'}
          </h2>
          <p className="text-sm text-slate-400 mt-1 flex items-center space-x-2">
            <span>Exclusive digital asset live on Botchain Mainnet</span>
          </p>
        </div>

        {/* Total Bids Pill */}
        <div className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl bg-navy-850 border border-navy-700/80 self-start md:self-auto">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-sm">
            <Flame className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Total Bids</div>
            <div className="text-base font-bold text-white">
              {totalBids ? totalBids.toString() : '0'} bids placed
            </div>
          </div>
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Current Highest Bid */}
        <div className="p-5 rounded-2xl bg-navy-850/80 border border-navy-700/70 hover:border-purple-500/30 transition-colors">
          <div className="text-xs font-medium text-slate-400 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Current Highest Bid</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-200">
              {hasBids ? highestBidFormatted : '0.00'}
            </span>
            <span className="text-sm font-bold text-amber-400">BOT</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {hasBids ? 'Leading on-chain offer' : 'Be the first to place a bid'}
          </div>
        </div>

        {/* Highest Bidder */}
        <div className="p-5 rounded-2xl bg-navy-850/80 border border-navy-700/70 hover:border-purple-500/30 transition-colors">
          <div className="text-xs font-medium text-slate-400 flex items-center space-x-1.5">
            <User className="w-4 h-4 text-purple-400" />
            <span>Highest Bidder</span>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-bold font-mono text-slate-200 truncate">
            {isZeroAddress ? (
              <span className="text-slate-500 font-sans text-base">None yet</span>
            ) : (
              <a
                href={`https://scan.botchain.ai/address/${highestBidder}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-purple-300 hover:underline inline-flex items-center space-x-1"
              >
                <span>{shortenAddress(highestBidder)}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 inline" />
              </a>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isZeroAddress ? 'Waiting for opening bid' : 'Verified wallet address'}
          </div>
        </div>

        {/* Time Remaining */}
        <div className="p-5 rounded-2xl bg-navy-850/80 border border-navy-700/70 hover:border-purple-500/30 transition-colors sm:col-span-2 lg:col-span-1">
          <div className="text-xs font-medium text-slate-400 flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Time Remaining</span>
          </div>
          <div className="mt-2 flex items-center space-x-2 font-mono">
            {Number(auctionEndTime) === 0 ? (
              <span className="text-sm font-medium text-slate-400 font-sans animate-pulse">Syncing timer...</span>
            ) : cancelled ? (
              <span className="text-lg font-bold text-rose-400 font-sans">Cancelled</span>
            ) : ended || timeLeft.isExpired ? (
              <span className="text-lg font-bold text-slate-400 font-sans">Auction Closed</span>
            ) : (
              <div className="flex items-center space-x-2 text-xl sm:text-2xl font-black text-white">
                <span className="px-2 py-0.5 rounded bg-navy-800 text-blue-400">
                  {String(timeLeft.hours).padStart(2, '0')}h
                </span>
                <span>:</span>
                <span className="px-2 py-0.5 rounded bg-navy-800 text-blue-400">
                  {String(timeLeft.minutes).padStart(2, '0')}m
                </span>
                <span>:</span>
                <span className="px-2 py-0.5 rounded bg-navy-800 text-blue-400">
                  {String(timeLeft.seconds).padStart(2, '0')}s
                </span>
              </div>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {cancelled || ended || timeLeft.isExpired
              ? 'Auction finalized'
              : 'Closes at contract expiration'}
          </div>
        </div>
      </div>
    </div>
  );
}
