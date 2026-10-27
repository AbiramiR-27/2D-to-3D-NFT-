import React from 'react';
import {
  Upload,
  Box,
  Award,
  ShieldCheck,
  Coins,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { SystemHealth } from '../types';

interface HomePageProps {
  onStart: () => void;
  systemHealth: SystemHealth | null;
}

export const HomePage: React.FC<HomePageProps> = ({ onStart, systemHealth }) => {
  const steps = [
    {
      num: '01',
      title: 'Upload 2D Artwork',
      desc: 'Upload raster artwork (PNG, JPG, WEBP) with automatic validation, dimension parsing, and size checks.',
      icon: Upload,
    },
    {
      num: '02',
      title: 'Procedural 3D Generation',
      desc: 'Derive a watertight, textured 3D relief GLB model from image luminance or invoke an external AI adapter.',
      icon: Box,
    },
    {
      num: '03',
      title: 'Interactive 3D Studio',
      desc: 'Inspect, orbit, zoom, toggle wireframe, evaluate bounding dimensions, and download the compiled GLB model.',
      icon: Layers,
    },
    {
      num: '04',
      title: 'Signed Provenance Certificate',
      desc: 'Calculate exact SHA-256 hash of model file bytes and issue a canonically signed Ed25519 digital certificate.',
      icon: Award,
    },
    {
      num: '05',
      title: 'Dual Verification Studio',
      desc: 'Verify certificate signature validity or perform bit-for-bit integrity comparison between model and certificate.',
      icon: ShieldCheck,
    },
    {
      num: '06',
      title: 'Optional Blockchain NFT Minting',
      desc: 'Anchor asset metadata, certificate reference, and model hash onto an ERC-721 smart contract.',
      icon: Coins,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-4">
            <span>School of Innovation (SoI) — Phase 2 Proof of Concept</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            AI-Based 2D to 3D NFT Creation & Cryptographic Provenance Platform
          </h1>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            A demonstrable end-to-end workflow designed for digital creators. Convert 2D artwork into 3D digital assets,
            preview interactive models, generate cryptographically signed provenance certificates (Concept I02),
            verify asset integrity, and optionally mint an ERC-721 NFT on a blockchain network.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onStart}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
            >
              Start Creating Asset
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-medium transition-colors"
            >
              OpenAPI Swagger Docs
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>
        </div>

        {/* Quick System Metrics */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Selected Concept</span>
            <span className="text-sm font-semibold text-slate-800">I02 — Signed Certificate</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Signature Standard</span>
            <span className="text-sm font-semibold text-slate-800">Ed25519 (Asymmetric)</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Integrity Hashing</span>
            <span className="text-sm font-semibold text-slate-800">SHA-256 File Bytes</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Blockchain Standard</span>
            <span className="text-sm font-semibold text-slate-800">ERC-721 (Solidity/Hardhat)</span>
          </div>
        </div>
      </div>

      {/* Concept Architecture Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Signed Certificate First</h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            The primary provenance mechanism is an asymmetric digital signature on a canonical metadata payload.
            Verification operates completely offline without gas fees or blockchain dependencies.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <FileCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Byte-Level Integrity</h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Every 3D model is hashed byte-for-byte. If the 3D GLB file is altered by even one bit, the cryptographic
            hash check detects the discrepancy immediately.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <Coins className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Optional Smart Contract</h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Creators can optionally mint an ERC-721 NFT on a local Hardhat network or testnet, recording the model hash
            and certificate ID directly into blockchain storage.
          </p>
        </div>
      </div>

      {/* Workflow Step Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Demonstration Workflow</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.num}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    Step {st.num}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-slate-900">{st.title}</h4>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{st.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
