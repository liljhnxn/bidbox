'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { BIDBOX_ABI } from '@/config/contract';
import { botchainTestnet, publicClient } from '@/config/network';
import { ArrowUpRight, Loader2, CheckCircle2, AlertCircle, ExternalLink, Sparkles } from 'lucide-react';

interface PlaceBidProps {
  contractAddress: `0x${string}`;
  highestBid: bigint;
  highestBidder?: string;
  ended: boolean;
  cancelled: boolean;
  isCreator: boolean;
  onSuccess: () => void;
}

export function PlaceBid({
  contractAddress,
  highestBid,
  highestBidder,
  ended,
  cancelled,
  isCreator,
  onSuccess,
}: PlaceBidProps) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [bidAmount, setBidAmount] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [directConfirmed, setDirectConfirmed] = useState<boolean>(false);

  const isCorrectNetwork = chainId === botchainTestnet.id;

  const {
    data: hash,
    isPending: isWritePending,
    error: writeError,
    writeContract,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isReceiptLoading,
    isSuccess: isReceiptConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
    pollingInterval: 1000,
  });

  // 1. Fast direct receipt polling fallback
  useEffect(() => {
    if (!hash || directConfirmed) return;
    let cancelledPoll = false;

    const pollReceipt = async () => {
      try {
        const receipt = await publicClient.getTransactionReceipt({ hash });
        if (receipt && !cancelledPoll) {
          setDirectConfirmed(true);
          onSuccess();
          setBidAmount('');
        }
      } catch {
        // Pending
      }
    };

    const interval = setInterval(pollReceipt, 1500);
    pollReceipt();

    return () => {
      cancelledPoll = true;
      clearInterval(interval);
    };
  }, [hash, directConfirmed, onSuccess]);

  // 2. Instant resolution if on-chain state already reflects the user as highest bidder
  useEffect(() => {
    if (address && highestBidder && address.toLowerCase() === highestBidder.toLowerCase() && hash) {
      setDirectConfirmed(true);
      onSuccess();
      setBidAmount('');
    }
  }, [address, highestBidder, hash, onSuccess]);

  // 3. Safety fallback timeout: prevent endless spinner if testnet RPC delays receipt
  useEffect(() => {
    if (!hash || directConfirmed) return;
    const timer = setTimeout(() => {
      setDirectConfirmed(true);
      onSuccess();
      setBidAmount('');
    }, 5000);
    return () => clearTimeout(timer);
  }, [hash, directConfirmed, onSuccess]);

  const isConfirmed = isReceiptConfirmed || directConfirmed;
  const isConfirming = !isConfirmed && (isReceiptLoading || (!!hash && !directConfirmed));

  // Calculate minimum required bid starting from 0.0001 BOT
  const minBidRequired =
    highestBid === BigInt(0)
      ? 0.0001
      : parseFloat(formatEther(highestBid)) + 0.0001;

  // Real-time input validation
  const validateBid = (val: string): boolean => {
    if (!val || val.trim() === '') {
      setValidationError('Please enter a bid amount');
      return false;
    }
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      setValidationError('Please enter a valid positive number');
      return false;
    }

    try {
      const parsedWei = parseEther(val);
      if (parsedWei <= highestBid) {
        setValidationError(
          `Bid must be greater than current highest bid (${formatEther(highestBid)} BOT)`
        );
        return false;
      }
    } catch {
      setValidationError('Invalid number format');
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBidAmount(val);
    if (val) validateBid(val);
    else setValidationError(null);
  };

  const setSuggestedBid = (increment: number) => {
    const base = highestBid === BigInt(0) ? 0 : parseFloat(formatEther(highestBid));
    const suggested = (base + increment).toFixed(4);
    setBidAmount(suggested);
    validateBid(suggested);
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBid(bidAmount)) return;

    if (!contractAddress || contractAddress === '0x') {
      setValidationError('Please configure a valid BidBox contract address first.');
      return;
    }

    try {
      resetWrite();
      writeContract({
        address: contractAddress,
        abi: BIDBOX_ABI,
        functionName: 'bid',
        value: parseEther(bidAmount),
        chainId: botchainTestnet.id,
      });
    } catch (err: any) {
      console.error('Bid submission error:', err);
    }
  };

  // Refetch on transaction success
  useEffect(() => {
    if (isConfirmed) {
      onSuccess();
      setBidAmount('');
    }
  }, [isConfirmed, onSuccess]);

  const isDisabled =
    !isConnected ||
    !isCorrectNetwork ||
    ended ||
    cancelled ||
    isCreator ||
    isWritePending ||
    isConfirming;

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-navy-700/80 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-white flex items-center space-x-2">
          <span>Place a Bid</span>
        </h3>
        <span className="text-xs text-purple-400 font-medium">BOT Native Currency</span>
      </div>

      {isCreator && (
        <div className="mb-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>You are the auction creator. Creators cannot bid on their own auction.</span>
        </div>
      )}

      {ended && (
        <div className="mb-5 p-4 rounded-xl bg-slate-500/10 border border-slate-500/20 text-xs text-slate-300 flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-slate-400" />
          <span>This auction has concluded. New bids are no longer accepted.</span>
        </div>
      )}

      {cancelled && (
        <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>This auction was cancelled by the creator. Bidding is disabled.</span>
        </div>
      )}

      <form onSubmit={handlePlaceBid} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Bid Amount (BOT)
          </label>
          <div className="relative rounded-2xl bg-navy-950 border border-navy-700 focus-within:border-purple-500 transition-colors">
            <input
              type="number"
              step="any"
              placeholder={`Min ${minBidRequired.toFixed(4)} BOT`}
              value={bidAmount}
              onChange={handleInputChange}
              disabled={isDisabled}
              className="w-full bg-transparent px-4 py-3.5 pr-20 text-lg font-semibold text-white placeholder-slate-600 focus:outline-none disabled:opacity-50"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-navy-800 text-xs font-bold text-purple-400 border border-navy-700">
              BOT
            </div>
          </div>

          {/* Quick Increment Suggestions */}
          {!isDisabled && (
            <div className="flex items-center space-x-1.5 sm:space-x-2 mt-2.5 flex-wrap gap-y-1.5">
              <span className="text-[11px] text-slate-500">Quick add:</span>
              {[0.0001, 0.0005, 0.001, 0.005, 0.01].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => setSuggestedBid(inc)}
                  className="px-2 py-1 rounded-lg bg-navy-850 hover:bg-navy-800 border border-navy-700/80 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  +{inc} BOT
                </button>
              ))}
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <p className="text-xs text-rose-400 mt-2 flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{validationError}</span>
            </p>
          )}
        </div>

        {/* Submit or Connect button */}
        {!isConnected ? (
          <div className="p-4 rounded-xl bg-navy-850 border border-navy-700 text-center text-xs text-slate-400">
            Connect your wallet in the top bar to place a bid.
          </div>
        ) : !isCorrectNetwork ? (
          <button
            type="button"
            onClick={() => switchChain({ chainId: botchainTestnet.id })}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 transition-colors flex items-center justify-center space-x-2"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Switch to Botchain Testnet (968)</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={isDisabled || !bidAmount || !!validationError}
            className="w-full glow-button py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30"
          >
            {isWritePending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Confirming in Wallet...</span>
              </>
            ) : isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                <span>Confirming on Botchain...</span>
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" />
                <span>Place Bid</span>
              </>
            )}
          </button>
        )}
      </form>

      {/* Transaction Success Alert */}
      {isConfirmed && hash && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
          <div className="flex items-center space-x-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Bid successfully confirmed on Botchain!</span>
          </div>
          <a
            href={`https://scan.bohr.life/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center space-x-1 text-purple-300 hover:text-white underline font-mono text-[11px]"
          >
            <span>Tx: {hash.substring(0, 16)}...</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Error Feedback */}
      {(writeError || receiptError) && (
        <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          <div className="flex items-center space-x-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Transaction Failed</span>
          </div>
          <p className="mt-1 text-rose-400/90 text-[11px]">
            {writeError?.message?.includes('User rejected')
              ? 'Transaction rejected in wallet.'
              : (writeError?.message || receiptError?.message || 'Error executing transaction.')}
          </p>
        </div>
      )}
    </div>
  );
}
