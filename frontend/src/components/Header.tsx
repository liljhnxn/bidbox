'use client';

import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useBalance } from 'wagmi';
import { botchainMainnet } from '@/config/network';
import { formatEther } from 'viem';
import Image from 'next/image';
import { Wallet, LogOut, ChevronDown, CheckCircle2, AlertTriangle, ShieldCheck, ExternalLink, Globe } from 'lucide-react';

export function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const { data: balanceData } = useBalance({
    address: address,
    chainId: botchainMainnet.id,
  });

  const isCorrectNetwork = chainId === botchainMainnet.id;

  const shortenAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-navy-700/60 bg-[#070A12]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand & Tagline */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 shadow-lg shadow-purple-500/25 border border-purple-400/30">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-purple-200">
                BidBox
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 uppercase tracking-wider">
                Botchain
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-normal">
              Place your bid. Win the item.
            </p>
          </div>
        </div>

        {/* Network Indicator & Wallet Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Botchain Network Indicator */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-navy-700 bg-navy-900/60 text-xs">
            {isConnected ? (
              isCorrectNetwork ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-300 font-medium">Botchain Mainnet (677)</span>
                </>
              ) : (
                <button
                  onClick={() => switchChain({ chainId: botchainMainnet.id })}
                  className="flex items-center space-x-1.5 text-amber-400 hover:text-amber-300 transition-colors font-medium"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Switch to Botchain</span>
                </button>
              )
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span className="text-slate-400">Botchain (677)</span>
              </>
            )}
          </div>

          {/* BOT Chain Website Link with Logo in Front */}
          <a
            href="https://botchain.ai"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200 hover:text-white transition-all text-xs font-semibold shadow-sm group"
          >
            <Image
              src="/botchain-logo.png"
              alt="BOT Chain Logo"
              width={18}
              height={18}
              className="w-4.5 h-4.5 rounded object-contain shrink-0 group-hover:scale-110 transition-transform"
            />
            <span>BOT Chain Website</span>
            <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
          </a>

          {/* BOT Chain Explorer Link with Logo in Front */}
          <a
            href="https://scan.botchain.ai"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 hover:text-white transition-all text-xs font-semibold shadow-sm group"
          >
            <Image
              src="/botchain-logo.png"
              alt="BOT Chain Logo"
              width={18}
              height={18}
              className="w-4.5 h-4.5 rounded object-contain shrink-0 group-hover:scale-110 transition-transform"
            />
            <span>BOT Chain Explorer</span>
            <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
          </a>

          {/* Wallet Connection */}
          {!isConnected ? (
            <button
              onClick={() => setShowConnectModal(true)}
              disabled={isConnecting}
              className="glow-button px-4 sm:px-5 py-2.5 rounded-xl font-medium text-sm text-white flex items-center space-x-2 shadow-lg shadow-purple-600/30"
            >
              <Wallet className="w-4 h-4" />
              <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center space-x-2.5 px-3.5 py-2 rounded-xl bg-navy-850 hover:bg-navy-800 border border-navy-700/80 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-200">
                    {shortenAddress(address!)}
                  </div>
                  {balanceData && (
                    <div className="text-[11px] text-purple-400 font-medium">
                      {parseFloat(formatEther(balanceData.value)).toFixed(4)} BOT
                    </div>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Account Dropdown */}
              {showAccountDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-navy-900 border border-navy-700 p-2 shadow-2xl z-50">
                  <div className="px-3 py-2 border-b border-navy-800 text-xs">
                    <p className="text-slate-400">Connected Wallet</p>
                    <p className="font-mono text-slate-200 truncate mt-0.5">{address}</p>
                  </div>
                  <a
                    href={`https://scan.botchain.ai/address/${address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-2 w-full px-3 py-2 text-xs text-slate-300 hover:bg-navy-800 rounded-lg transition-colors mt-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>View on Botchain Scan</span>
                  </a>
                  <button
                    onClick={() => {
                      disconnect();
                      setShowAccountDropdown(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Connect Wallet Modal */}
      {showConnectModal && !isConnected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-navy-900 border border-navy-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-navy-800">
              <h3 className="text-lg font-semibold text-white">Connect a Wallet</h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-3 mb-5">
              Connect your Web3 wallet to place bids and participate in on-chain auctions on Botchain Mainnet.
            </p>

            <div className="space-y-2.5">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => {
                    connect({ connector });
                    setShowConnectModal(false);
                  }}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-navy-850 hover:bg-navy-800 border border-navy-700 hover:border-purple-500/50 transition-all text-sm font-medium text-slate-200"
                >
                  <span className="flex items-center space-x-3">
                    <Wallet className="w-4 h-4 text-purple-400" />
                    <span>{connector.name}</span>
                  </span>
                  <span className="text-xs text-slate-500">Connect &rarr;</span>
                </button>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-navy-800/80 text-[11px] text-center text-slate-500">
              Botchain Mainnet (Chain ID: 677)
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
