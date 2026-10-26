'use client';

import React from 'react';
import Image from 'next/image';
import { ExternalLink, Globe, Search, Cpu, ShieldCheck, Activity, Layers } from 'lucide-react';
import { BIDBOX_CONTRACT_ADDRESS } from '@/config/contract';

export function BotChainEcosystem() {
  return (
    <section className="mt-20 border-t border-navy-800/80 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Ecosystem Section Header */}
        <div className="rounded-3xl bg-gradient-to-b from-navy-850/90 via-navy-900/80 to-[#0A0E1A]/90 border border-purple-500/20 p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Ambient Glow Effects */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-navy-700/60">
            {/* Logo and Name */}
            <div className="flex items-center space-x-5">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#0B0F19] to-navy-800 p-2 border border-cyan-500/30 shadow-lg shadow-cyan-500/20 shrink-0 flex items-center justify-center">
                <Image
                  src="/botchain-logo.svg"
                  alt="BOT Chain Logo"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                />
              </div>

              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                    BOT Chain
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold tracking-wide uppercase">
                      Mainnet Live
                    </span>
                  </h3>
                </div>
                <p className="text-sm text-slate-400 mt-1 max-w-xl">
                  Decentralized high-throughput autonomous blockchain infrastructure built for AI, DeFi, and on-chain protocols.
                </p>
              </div>
            </div>

            {/* Official Required Links with Logo at Front */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              {/* BOT Chain Website Link */}
              <a
                href="https://botchain.ai"
                target="_blank"
                rel="noreferrer"
                id="botchain-website-link"
                className="flex items-center space-x-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/40 text-emerald-200 hover:text-white transition-all font-semibold text-sm shadow-lg shadow-emerald-500/10 group"
              >
                <Image
                  src="/botchain-logo.png"
                  alt="BOT Chain"
                  width={22}
                  height={22}
                  className="w-5.5 h-5.5 rounded-md object-contain shrink-0 group-hover:scale-110 transition-transform"
                />
                <span>BOT Chain Website</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </a>

              {/* BOT Chain Explorer Link */}
              <a
                href="https://scan.botchain.ai"
                target="_blank"
                rel="noreferrer"
                id="botchain-explorer-link"
                className="flex items-center space-x-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/30 hover:to-indigo-600/30 border border-purple-500/40 text-purple-200 hover:text-white transition-all font-semibold text-sm shadow-lg shadow-purple-500/10 group"
              >
                <Image
                  src="/botchain-logo.png"
                  alt="BOT Chain Explorer"
                  width={22}
                  height={22}
                  className="w-5.5 h-5.5 rounded-md object-contain shrink-0 group-hover:scale-110 transition-transform"
                />
                <span>BOT Chain Explorer</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </a>
            </div>
          </div>

          {/* Ecosystem Highlights Grid */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-navy-950/60 border border-navy-800 flex flex-col justify-between">
              <span className="text-xs text-slate-400 flex items-center space-x-1.5 font-medium">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Chain ID</span>
              </span>
              <span className="text-lg font-bold text-slate-100 mt-2 font-mono">677</span>
              <span className="text-[11px] text-slate-500">BOT Chain Mainnet</span>
            </div>

            <div className="p-4 rounded-2xl bg-navy-950/60 border border-navy-800 flex flex-col justify-between">
              <span className="text-xs text-slate-400 flex items-center space-x-1.5 font-medium">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span>Native Currency</span>
              </span>
              <span className="text-lg font-bold text-slate-100 mt-2 font-mono">BOT</span>
              <span className="text-[11px] text-slate-500">18 Decimals</span>
            </div>

            <div className="p-4 rounded-2xl bg-navy-950/60 border border-navy-800 flex flex-col justify-between">
              <span className="text-xs text-slate-400 flex items-center space-x-1.5 font-medium">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Total Supply</span>
              </span>
              <span className="text-lg font-bold text-slate-100 mt-2 font-mono">150 Million</span>
              <span className="text-[11px] text-slate-500">150,000,000 BOT</span>
            </div>

            <div className="p-4 rounded-2xl bg-navy-950/60 border border-navy-800 flex flex-col justify-between">
              <span className="text-xs text-slate-400 flex items-center space-x-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>RPC Gateway</span>
              </span>
              <a
                href="https://rpc.botchain.ai"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-purple-300 hover:underline mt-2 truncate"
              >
                rpc.botchain.ai
              </a>
              <span className="text-[11px] text-emerald-400">Operational</span>
            </div>
          </div>
        </div>

        {/* Global Footer Bar */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center space-x-3">
            <Image
              src="/botchain-logo.svg"
              alt="BOT Chain"
              width={22}
              height={22}
              className="w-5.5 h-5.5"
            />
            <span className="font-semibold text-slate-300">BidBox</span>
            <span>&bull;</span>
            <span>Powered by BOT Chain</span>
            <span>&bull;</span>
            <span className="text-slate-400">Chain ID 677</span>
          </div>

          <div className="flex flex-wrap items-center space-x-5 text-slate-400">
            <a
              href="https://botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-300 transition-colors flex items-center space-x-1.5"
            >
              <Image
                src="/botchain-logo.png"
                alt="BOT Chain Logo"
                width={16}
                height={16}
                className="w-4 h-4 rounded object-contain shrink-0"
              />
              <span>BOT Chain Website</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://scan.botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="hover:text-purple-300 transition-colors flex items-center space-x-1.5"
            >
              <Image
                src="/botchain-logo.png"
                alt="BOT Chain Logo"
                width={16}
                height={16}
                className="w-4 h-4 rounded object-contain shrink-0"
              />
              <span>BOT Chain Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={`https://scan.botchain.ai/address/${BIDBOX_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-300 transition-colors font-mono text-[11px] flex items-center space-x-1.5"
            >
              <Image
                src="/botchain-logo.png"
                alt="BOT Chain Logo"
                width={14}
                height={14}
                className="w-3.5 h-3.5 rounded object-contain shrink-0"
              />
              <span>Contract: {BIDBOX_CONTRACT_ADDRESS.substring(0, 6)}...{BIDBOX_CONTRACT_ADDRESS.substring(38)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
