'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { BIDBOX_ABI } from '@/config/contract';
import { botchainTestnet, publicClient } from '@/config/network';
import { Award, ArrowDownLeft, Loader2, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';

interface MyActivityProps {
  contractAddress: `0x${string}`;
  highestBidder: string;
  userRefund: bigint;
  onSuccess: () => void;
}

export function MyActivity({
  contractAddress,
  highestBidder,
  userRefund,
  onSuccess,
}: MyActivityProps) {
  const { address, isConnected } = useAccount();

  const isHighestBidder =
    isConnected &&
    address &&
    highestBidder &&
    address.toLowerCase() === highestBidder.toLowerCase();

  const hasRefund = userRefund > BigInt(0);
  const formattedRefund = formatEther(userRefund);

  const {
    data: hash,
    isPending: isWritePending,
    error: writeError,
    writeContract,
    reset: resetWrite,
  } = useWriteContract();

  const [directConfirmed, setDirectConfirmed] = useState<boolean>(false);

  const {
    isLoading: isReceiptLoading,
    isSuccess: isReceiptConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
    pollingInterval: 1000,
  });

  useEffect(() => {
    if (!hash || directConfirmed) return;
    let isCancelled = false;

    const pollReceipt = async () => {
      try {
        const receipt = await publicClient.getTransactionReceipt({ hash });
        if (receipt && !isCancelled) {
          setDirectConfirmed(true);
          onSuccess();
        }
      } catch {
        // Pending
      }
    };

    const interval = setInterval(pollReceipt, 1500);
    pollReceipt();

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [hash, directConfirmed, onSuccess]);

  const isConfirmed = isReceiptConfirmed || directConfirmed;
  const isConfirming = !isConfirmed && (isReceiptLoading || (!!hash && !directConfirmed));

  const handleWithdraw = () => {
    if (!contractAddress) return;
    setDirectConfirmed(false);
    resetWrite();
    writeContract({
      address: contractAddress,
      abi: BIDBOX_ABI,
      functionName: 'withdrawRefund',
      chainId: botchainTestnet.id,
    });
  };

  useEffect(() => {
    if (isConfirmed) {
      onSuccess();
    }
  }, [isConfirmed, onSuccess]);

  if (!isConnected) {
    return (
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-navy-700/80 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-2">My Activity</h3>
        <p className="text-sm text-slate-400">
          Connect your wallet to see your bidding status and claim outbid refunds.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-navy-700/80 shadow-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-white flex items-center space-x-2">
          <span>My Activity</span>
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Highest Bidder Status Card */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isHighestBidder
              ? 'bg-gradient-to-br from-purple-900/30 via-navy-850 to-navy-850 border-purple-500/40 shadow-lg shadow-purple-500/10'
              : 'bg-navy-850/80 border-navy-700/70'
          }`}
        >
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-2">
            <Award
              className={`w-4 h-4 ${isHighestBidder ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`}
            />
            <span>Bidding Position</span>
          </div>

          <div className="text-lg font-bold text-white">
            {isHighestBidder ? (
              <span className="text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 inline" />
                <span>You are the Highest Bidder!</span>
              </span>
            ) : (
              <span className="text-slate-400">Not currently in the lead</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {isHighestBidder
              ? 'Your bid is currently winning this auction lot.'
              : 'Place a higher bid to take the lead.'}
          </p>
        </div>

        {/* Refundable Balance Card */}
        <div className="p-5 rounded-2xl bg-navy-850/80 border border-navy-700/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className="flex items-center space-x-1.5">
                <ArrowDownLeft className="w-4 h-4 text-cyan-400" />
                <span>Refundable Balance</span>
              </span>
              <span className="text-[11px] text-slate-500">Pull over push</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white">
                {hasRefund ? formattedRefund : '0.00'}
              </span>
              <span className="text-sm font-bold text-cyan-400">BOT</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {hasRefund
                ? 'Outbid funds safely escrowed. Ready for withdrawal.'
                : 'No pending refunds available.'}
            </p>
          </div>

          {/* Withdraw Button */}
          <div className="mt-4">
            <button
              onClick={handleWithdraw}
              disabled={!hasRefund || isWritePending || isConfirming}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                hasRefund
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-navy-800 text-slate-500 cursor-not-allowed border border-navy-700'
              }`}
            >
              {isWritePending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Confirming in Wallet...</span>
                </>
              ) : isConfirming ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Withdrawing Refund...</span>
                </>
              ) : (
                <>
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Withdraw Refund ({hasRefund ? formattedRefund : '0'} BOT)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Message */}
      {isConfirmed && hash && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
          <div className="flex items-center space-x-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Refund successfully withdrawn to your wallet!</span>
          </div>
          <a
            href={`https://scan.bohr.life/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center space-x-1 text-purple-300 hover:text-white underline font-mono text-[11px]"
          >
            <span>View Tx on BohrScan</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Error Message */}
      {(writeError || receiptError) && (
        <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          <div className="flex items-center space-x-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Withdrawal Failed</span>
          </div>
          <p className="mt-1 text-rose-400/90 text-[11px]">
            {writeError?.message?.includes('User rejected')
              ? 'Transaction rejected by user.'
              : (writeError?.message || receiptError?.message || 'Error withdrawing refund.')}
          </p>
        </div>
      )}
    </div>
  );
}
