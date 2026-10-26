'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { BIDBOX_ABI } from '@/config/contract';
import { botchainMainnet, publicClient } from '@/config/network';
import { Settings, XCircle, CheckCircle, DollarSign, Loader2, AlertCircle, ExternalLink } from 'lucide-react';

interface CreatorControlsProps {
  contractAddress: `0x${string}`;
  creatorAddress: string;
  totalBids: bigint;
  highestBid: bigint;
  auctionEndTime: bigint;
  ended: boolean;
  cancelled: boolean;
  onSuccess: () => void;
}

export function CreatorControls({
  contractAddress,
  creatorAddress,
  totalBids,
  highestBid,
  auctionEndTime,
  ended,
  cancelled,
  onSuccess,
}: CreatorControlsProps) {
  const { address, isConnected } = useAccount();

  const isCreator =
    isConnected &&
    address &&
    creatorAddress &&
    address.toLowerCase() === creatorAddress.toLowerCase();

  const nowSeconds = Math.floor(Date.now() / 1000);
  const isDurationExpired = nowSeconds >= Number(auctionEndTime);
  const hasBids = Number(totalBids) > 0;

  // Permissions according to contract rules:
  // - Cancel only before first bid and if not ended/cancelled
  const canCancel = !hasBids && !ended && !cancelled;
  // - End only after duration expired and if not already ended/cancelled
  const canEnd = isDurationExpired && !ended && !cancelled;
  // - Withdraw proceeds only after auction ended with a winning bid (>0) and not cancelled
  const canWithdrawProceeds = ended && !cancelled && highestBid > BigInt(0);

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

  const handleCancelAuction = () => {
    if (!canCancel || !contractAddress) return;
    resetWrite();
    writeContract({
      address: contractAddress,
      abi: BIDBOX_ABI,
      functionName: 'cancelAuction',
      chainId: botchainMainnet.id,
    });
  };

  const handleEndAuction = () => {
    if (!canEnd || !contractAddress) return;
    resetWrite();
    writeContract({
      address: contractAddress,
      abi: BIDBOX_ABI,
      functionName: 'endAuction',
      chainId: botchainMainnet.id,
    });
  };

  const handleWithdrawProceeds = () => {
    if (!canWithdrawProceeds || !contractAddress) return;
    resetWrite();
    writeContract({
      address: contractAddress,
      abi: BIDBOX_ABI,
      functionName: 'withdrawProceeds',
      chainId: botchainMainnet.id,
    });
  };

  useEffect(() => {
    if (isConfirmed) {
      onSuccess();
    }
  }, [isConfirmed, onSuccess]);

  // Only render if connected wallet is the creator
  if (!isCreator) {
    return null;
  }

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-purple-500/30 shadow-2xl bg-gradient-to-br from-navy-900/90 via-navy-850 to-purple-950/20">
      <div className="flex items-center justify-between pb-4 border-b border-navy-700">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <Settings className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Auction Creator Controls</h3>
            <p className="text-xs text-purple-300/80">
              Only visible to the verified contract creator ({creatorAddress.substring(0, 6)}...
              {creatorAddress.substring(creatorAddress.length - 4)})
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cancel Auction Button */}
        <div className="p-4 rounded-2xl bg-navy-900/90 border border-navy-700/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-rose-400 mb-1">
              <XCircle className="w-4 h-4" />
              <span>Cancel Auction</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Permitted only before the very first bid is placed.
            </p>
          </div>

          <div className="mt-4">
            <button
              onClick={handleCancelAuction}
              disabled={!canCancel || isWritePending || isConfirming}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                canCancel
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 hover:shadow-lg hover:shadow-rose-500/20'
                  : 'bg-navy-800 text-slate-500 cursor-not-allowed border border-navy-700/50'
              }`}
            >
              {canCancel ? (
                <span>Cancel Auction</span>
              ) : hasBids ? (
                <span>Locked (Bids Placed)</span>
              ) : cancelled ? (
                <span>Already Cancelled</span>
              ) : (
                <span>Cannot Cancel</span>
              )}
            </button>
          </div>
        </div>

        {/* End Auction Button */}
        <div className="p-4 rounded-2xl bg-navy-900/90 border border-navy-700/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span>End Auction</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Finalizes the auction once duration expires.
            </p>
          </div>

          <div className="mt-4">
            <button
              onClick={handleEndAuction}
              disabled={!canEnd || isWritePending || isConfirming}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                canEnd
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/20'
                  : 'bg-navy-800 text-slate-500 cursor-not-allowed border border-navy-700/50'
              }`}
            >
              {canEnd ? (
                <span>End Auction Now</span>
              ) : ended ? (
                <span>Already Ended</span>
              ) : cancelled ? (
                <span>Cancelled</span>
              ) : (
                <span>Time Remaining</span>
              )}
            </button>
          </div>
        </div>

        {/* Withdraw Proceeds Button */}
        <div className="p-4 rounded-2xl bg-navy-900/90 border border-navy-700/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 mb-1">
              <DollarSign className="w-4 h-4" />
              <span>Withdraw Proceeds</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Available after auction concludes ({formatEther(highestBid)} BOT).
            </p>
          </div>

          <div className="mt-4">
            <button
              onClick={handleWithdrawProceeds}
              disabled={!canWithdrawProceeds || isWritePending || isConfirming}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                canWithdrawProceeds
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/20'
                  : 'bg-navy-800 text-slate-500 cursor-not-allowed border border-navy-700/50'
              }`}
            >
              {canWithdrawProceeds ? (
                <span>Withdraw {formatEther(highestBid)} BOT</span>
              ) : !ended ? (
                <span>Auction Active</span>
              ) : highestBid === BigInt(0) ? (
                <span>No Funds / Claimed</span>
              ) : (
                <span>Unavailable</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Action Progress and Feedback */}
      {(isWritePending || isConfirming) && (
        <div className="mt-4 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>
            {isWritePending
              ? 'Please confirm creator action in your wallet...'
              : 'Broadcasting creator action to Botchain Mainnet...'}
          </span>
        </div>
      )}

      {isConfirmed && hash && (
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Action executed successfully!</span>
          </div>
          <a
            href={`https://scan.botchain.ai/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
            className="text-purple-300 underline font-mono inline-flex items-center space-x-1"
          >
            <span>Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {(writeError || receiptError) && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{writeError?.message || receiptError?.message || 'Action failed.'}</span>
        </div>
      )}
    </div>
  );
}
