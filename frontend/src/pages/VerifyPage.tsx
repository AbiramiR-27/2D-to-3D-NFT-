import React, { useState } from 'react';
import {
  ShieldCheck,
  FileCheck,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode,
  Hash,
  Award,
  Lock,
  RefreshCw,
  Bug,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import { VerifyCertificateResult, VerifyAssetIntegrityResult, Asset } from '../types';

interface VerifyPageProps {
  currentAsset: Asset | null;
}

export const VerifyPage: React.FC<VerifyPageProps> = ({ currentAsset }) => {
  const [activeMode, setActiveMode] = useState<'cert_only' | 'full_integrity'>('full_integrity');

  // Option A states
  const [certFileA, setCertFileA] = useState<File | null>(null);
  const [isVerifyingA, setIsVerifyingA] = useState<boolean>(false);
  const [resultA, setResultA] = useState<VerifyCertificateResult | null>(null);
  const [errorA, setErrorA] = useState<string | null>(null);

  // Option B states
  const [certFileB, setCertFileB] = useState<File | null>(null);
  const [modelFileB, setModelFileB] = useState<File | null>(null);
  const [isVerifyingB, setIsVerifyingB] = useState<boolean>(false);
  const [resultB, setResultB] = useState<VerifyAssetIntegrityResult | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);

  // Tamper test simulation state
  const [tamperMsg, setTamperMsg] = useState<string | null>(null);
  const [isTampering, setIsTampering] = useState<boolean>(false);

  // Handlers for Option A
  const handleVerifyOptionA = async () => {
    if (!certFileA) {
      setErrorA('Please select a certificate JSON file to verify.');
      return;
    }
    setIsVerifyingA(true);
    setErrorA(null);
    setResultA(null);
    try {
      const text = await certFileA.text();
      const parsed = JSON.parse(text);
      const res = await api.verifyCertificate(parsed);
      setResultA(res);
    } catch (e: any) {
      setErrorA(`Verification failed: ${e.message}`);
    } finally {
      setIsVerifyingA(false);
    }
  };

  // Handlers for Option B
  const handleVerifyOptionB = async () => {
    if (!certFileB || !modelFileB) {
      setErrorB('Please select both the certificate JSON file and the 3D model file (.glb).');
      return;
    }
    setIsVerifyingB(true);
    setErrorB(null);
    setResultB(null);
    try {
      const res = await api.verifyAssetIntegrity(certFileB, modelFileB);
      setResultB(res);
    } catch (e: any) {
      setErrorB(`Asset integrity check failed: ${e.message}`);
    } finally {
      setIsVerifyingB(false);
    }
  };

  // Quick auto-load current asset for Option B
  const handleAutoLoadCurrentAsset = async () => {
    if (!currentAsset || !currentAsset.certificate_id) return;
    try {
      // Fetch cert
      const certData = await api.getCertificate(currentAsset.certificate_id);
      const certBlob = new Blob([JSON.stringify(certData, null, 2)], { type: 'application/json' });
      const cFile = new File([certBlob], `${currentAsset.certificate_id}.json`, { type: 'application/json' });
      setCertFileB(cFile);
      setCertFileA(cFile);

      // Fetch model
      const modelRes = await fetch(`/api/assets/${currentAsset.asset_id}/model`);
      const modelBlob = await modelRes.blob();
      const mFile = new File([modelBlob], currentAsset.model_filename || 'model.glb', { type: 'model/gltf-binary' });
      setModelFileB(mFile);
    } catch (e) {
      console.error(e);
    }
  };

  // Tamper test simulation handler
  const handleSimulateTampering = async () => {
    if (!currentAsset) return;
    setIsTampering(true);
    setTamperMsg(null);
    try {
      const res = await api.tamperTest(currentAsset.asset_id);
      setTamperMsg(res.message);
      // Automatically re-fetch tampered model into Option B to immediately test
      await handleAutoLoadCurrentAsset();
    } catch (e: any) {
      setTamperMsg(`Failed to tamper: ${e.message}`);
    } finally {
      setIsTampering(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Step 5: Cryptographic Provenance Verification Studio</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Perform digital signature validation or bit-for-bit file integrity analysis on 3D assets and signed certificates.
        </p>
      </div>

      {/* Auto-load helper banner if active asset exists */}
      {currentAsset && currentAsset.certificate_id && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="font-semibold text-indigo-950">Active Asset Certificate Ready: </span>
              <span className="font-mono text-indigo-800">{currentAsset.title} ({currentAsset.certificate_id})</span>
            </div>
          </div>
          <button
            onClick={handleAutoLoadCurrentAsset}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold whitespace-nowrap transition-colors shadow-2xs"
          >
            Auto-Populate Files for Verification
          </button>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 text-xs font-semibold">
        <button
          onClick={() => setActiveMode('full_integrity')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeMode === 'full_integrity'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Option B: Verify Asset Integrity (Certificate + 3D Model GLB)
        </button>

        <button
          onClick={() => setActiveMode('cert_only')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeMode === 'cert_only'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Option A: Verify Certificate Signature (JSON Only)
        </button>
      </div>

      {/* OPTION B: FULL ASSET INTEGRITY VERIFICATION */}
      {activeMode === 'full_integrity' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Option B: Dual-Proof Asset Integrity & Signature Verification
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Validates that the digital signature is authentic AND computes the SHA-256 hash of the 3D model bytes
              to guarantee that not a single byte of the 3D asset has been altered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Certificate File Picker */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">1. Signed Certificate (.JSON)</label>
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => setCertFileB(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
              />
              {certFileB && (
                <span className="text-[11px] text-emerald-700 font-mono block">
                  ✓ Selected: {certFileB.name} ({(certFileB.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>

            {/* 3D Model File Picker */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">2. 3D Model Asset (.GLB)</label>
              <input
                type="file"
                accept=".glb,model/gltf-binary"
                onChange={(e) => setModelFileB(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
              />
              {modelFileB && (
                <span className="text-[11px] text-emerald-700 font-mono block">
                  ✓ Selected: {modelFileB.name} ({(modelFileB.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={handleVerifyOptionB}
              disabled={isVerifyingB || !certFileB || !modelFileB}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
                isVerifyingB || !certFileB || !modelFileB
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
              }`}
            >
              {isVerifyingB ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Calculating Hashes & Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Run Asset Integrity Verification
                </>
              )}
            </button>

            {/* Tamper Demonstration Button (Test Scenario 3) */}
            {currentAsset && (
              <button
                type="button"
                onClick={handleSimulateTampering}
                disabled={isTampering}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors"
                title="Intentionally modifies 1 byte in the model file to demonstrate tamper detection live"
              >
                <Bug className="w-3.5 h-3.5 text-amber-700" />
                {isTampering ? 'Modifying byte...' : 'Simulate Model Tampering (Test 3)'}
              </button>
            )}
          </div>

          {tamperMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{tamperMsg}</span>
            </div>
          )}

          {errorB && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
              {errorB}
            </div>
          )}

          {/* Result Card for Option B */}
          {resultB && (
            <div className={`p-5 rounded-xl border ${
              resultB.overall_valid
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-red-50/70 border-red-300'
            } space-y-4`}>
              <div className="flex items-start gap-3">
                {resultB.overall_valid ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className={`text-base font-bold ${resultB.overall_valid ? 'text-emerald-950' : 'text-red-950'}`}>
                    {resultB.overall_valid ? 'VERIFICATION PASSED: ASSET IS AUTHENTIC' : 'VERIFICATION FAILED: INTEGRITY COMPROMISED'}
                  </h4>
                  <p className={`text-xs mt-1 ${resultB.overall_valid ? 'text-emerald-800' : 'text-red-800'}`}>
                    {resultB.message}
                  </p>
                </div>
              </div>

              {/* Status Checks Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/80 p-3 rounded-lg border border-slate-200/80">
                <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="text-slate-600">Ed25519 Certificate Signature:</span>
                  <span className={`font-semibold flex items-center gap-1 ${
                    resultB.certificate_signature_valid ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {resultB.certificate_signature_valid ? '✓ VALID' : '✗ INVALID'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="text-slate-600">3D Asset Byte-Level Hash:</span>
                  <span className={`font-semibold flex items-center gap-1 ${
                    resultB.asset_hash_matches ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {resultB.asset_hash_matches ? '✓ EXACT MATCH' : '✗ HASH MISMATCH'}
                  </span>
                </div>
              </div>

              {/* Hash Comparison Details */}
              <div className="space-y-1.5 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[11px] font-sans">Expected Model Hash (from Signed Certificate):</span>
                  <div className="p-2 bg-slate-100 rounded text-[11px] text-slate-800 break-all select-all border border-slate-200">
                    {resultB.expected_hash}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px] font-sans">Computed Model Hash (from Uploaded File Bytes):</span>
                  <div className={`p-2 rounded text-[11px] break-all select-all border ${
                    resultB.asset_hash_matches
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-red-100 text-red-900 border-red-300'
                  }`}>
                    {resultB.calculated_hash}
                  </div>
                </div>
              </div>

              {resultB.byte_discrepancy_details && (
                <div className="text-[11px] text-slate-600 italic">
                  Note: {resultB.byte_discrepancy_details}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* OPTION A: CERTIFICATE SIGNATURE VERIFICATION ONLY */}
      {activeMode === 'cert_only' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Option A: Certificate Signature & Canonical Payload Verification
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload a standalone certificate JSON file. Verifies cryptographic signature against the trusted public key
              and ensures no canonical metadata fields have been tampered with.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 max-w-xl">
            <label className="block text-xs font-semibold text-slate-700">Select Certificate File (.JSON)</label>
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => setCertFileA(e.target.files?.[0] || null)}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
            />
            {certFileA && (
              <span className="text-[11px] text-emerald-700 font-mono block">
                ✓ Selected: {certFileA.name}
              </span>
            )}
          </div>

          <button
            onClick={handleVerifyOptionA}
            disabled={isVerifyingA || !certFileA}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
              isVerifyingA || !certFileA
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
            }`}
          >
            {isVerifyingA ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Verifying Signature...
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                Verify Certificate Signature
              </>
            )}
          </button>

          {errorA && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
              {errorA}
            </div>
          )}

          {/* Result Card for Option A */}
          {resultA && (
            <div className={`p-5 rounded-xl border ${
              resultA.is_valid_signature
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-red-50/70 border-red-300'
            } space-y-3`}>
              <div className="flex items-start gap-3">
                {resultA.is_valid_signature ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className={`text-base font-bold ${resultA.is_valid_signature ? 'text-emerald-950' : 'text-red-950'}`}>
                    {resultA.is_valid_signature ? 'CERTIFICATE SIGNATURE IS VALID' : `CERTIFICATE INVALID: ${resultA.status}`}
                  </h4>
                  <p className={`text-xs mt-1 ${resultA.is_valid_signature ? 'text-emerald-800' : 'text-red-800'}`}>
                    {resultA.message}
                  </p>
                </div>
              </div>

              {resultA.payload && (
                <div className="mt-3 p-3 bg-white/80 rounded-lg border border-slate-200/80 text-xs space-y-2">
                  <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1">
                    Verified Signed Payload Contents
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Certificate ID</span>
                      <span className="font-mono text-slate-800">{resultA.certificate_id}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Asset ID</span>
                      <span className="font-mono text-slate-800">{resultA.asset_id}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Asset Title</span>
                      <span className="font-medium text-slate-800">{resultA.payload.asset_title}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Creator Display Name</span>
                      <span className="font-medium text-slate-800">{resultA.payload.creator_display_name}</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-400 block text-[11px]">Signed Model SHA-256 Hash</span>
                    <span className="font-mono text-[11px] text-slate-800 break-all select-all block bg-slate-50 p-1.5 rounded border border-slate-200">
                      {resultA.model_sha256}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
