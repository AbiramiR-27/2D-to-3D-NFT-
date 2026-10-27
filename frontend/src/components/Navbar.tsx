import React from 'react';
import {
  Boxes,
  Upload,
  Eye,
  Award,
  ShieldCheck,
  Coins,
  History,
  CheckSquare,
  KeyRound,
  Link,
  Layers,
} from 'lucide-react';
import { SystemHealth } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  systemHealth: SystemHealth | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, systemHealth }) => {
  const navItems = [
    { id: 'home', label: 'Overview', icon: Boxes },
    { id: 'create', label: 'Upload & Generate', icon: Upload },
    { id: 'studio', label: '3D Studio', icon: Eye },
    { id: 'certificate', label: 'Signed Certificate', icon: Award },
    { id: 'verify', label: 'Verify Provenance', icon: ShieldCheck },
    { id: 'mint', label: 'NFT Minting', icon: Coins },
    { id: 'history', label: 'Asset History', icon: History },
    { id: 'tests', label: 'POC Test Suite', icon: CheckSquare },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Project Context */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('home')}>
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm sm:text-base leading-tight">
                  2D-to-3D Provenance Platform
                </span>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border border-indigo-200/60">
                  SoI Phase 2
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Concept I02 — Conventional Signed Certificate & Optional NFT Minting
              </p>
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            {/* Cryptographic Key Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200" title="Asymmetric Ed25519 Cryptographic Signing Key">
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>Ed25519 Dev Key</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>

            {/* Blockchain Node Status */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs ${
              systemHealth?.blockchain_available
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`} title={systemHealth?.blockchain_available ? "Local Hardhat node active" : "Blockchain node offline (Optional)"}>
              <Link className="w-3.5 h-3.5" />
              <span>{systemHealth?.blockchain_available ? 'Hardhat Node (31337)' : 'Blockchain (Optional)'}</span>
              <span className={`w-2 h-2 rounded-full ${systemHealth?.blockchain_available ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
