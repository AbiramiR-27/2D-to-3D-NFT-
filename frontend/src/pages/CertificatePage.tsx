import React, { useState, useEffect } from 'react';
import {
  Award,
  Download,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  FileCode,
  Lock,
  ArrowRight,
  Info,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Asset, SignedCertificate } from '../types';
import { api } from '../services/api';

interface CertificatePageProps {
  currentAsset: Asset | null;
  onNavigateToVerify: () => void;
  onAssetUpdated: (asset: Asset) => void;
}

export const CertificatePage: React.FC<CertificatePageProps> = ({
  currentAsset,
  onNavigateToVerify,
  onAssetUpdated,
}) => {
  const [certificate, setCertificate] = useState<SignedCertificate | null>(null);
  const [publicKeyInfo, setPublicKeyInfo] = useState<{
    key_id: string;
    algorithm: string;
    public_key_pem: string;
    is_development_key: boolean;
    security_advisory: string;
  } | null>(null);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedSig, setCopiedSig] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load server public key info
    api.getPublicKey().then(setPublicKeyInfo).catch(console.error);

    // If current asset already has a certificate ID, fetch it
    if (currentAsset?.certificate_id) {
      api.getCertificate(currentAsset.certificate_id).then(setCertificate).catch(console.error);
    }
  }, [currentAsset]);

  const handleGenerateCertificate = async () => {
    if (!currentAsset) return;
    setIsGenerating(true);
    setError(null);
    try {
      const cert = await api.generateCertificate(currentAsset.asset_id);
      setCertificate(cert);
      // Reload updated asset
      const updated = await api.getAsset(currentAsset.asset_id);
      onAssetUpdated(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to generate certificate');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCertificateJson = () => {
    if (!certificate) return;
    const blob = new Blob([JSON.stringify(certificate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${certificate.certificate_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPublicKeyPem = () => {
    if (!publicKeyInfo) return;
    const blob = new Blob([publicKeyInfo.public_key_pem], { type: 'application/x-pem-file' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${publicKeyInfo.key_id.replace(/:/g, '_')}_public.pem`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  if (!currentAsset) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-4">
          <Award className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">No Asset Selected</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Please generate or select an asset with a compiled 3D model to issue a signed provenance certificate.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Concept Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Primary Feature: Conventional Signed Provenance Certificate (Concept I02)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              Ed25519 Cryptographic Signatures
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Binds creator attribution, asset metadata, and the byte-exact SHA-256 model checksum under an asymmetric digital signature.
          </p>
        </div>

        {certificate && (
          <button
            onClick={onNavigateToVerify}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            Proceed to Verification Studio
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Issuance Action Card if not yet generated */}
      {!certificate && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">Issue Cryptographic Certificate for This Asset</h3>
            <p className="text-xs text-slate-500 mt-1">
              The backend will inspect the exact file bytes of <span className="font-mono text-slate-700">{currentAsset.model_filename}</span>,
              compute its SHA-256 hash, build the canonical JSON payload, and sign it using the backend's Ed25519 private key.
            </p>
          </div>

          {error && (
            <div className="max-w-md mx-auto p-3 bg-red-50 text-red-800 border border-red-200 rounded text-xs text-left">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerateCertificate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Computing Hash & Signing...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Generate & Sign Certificate Now
              </>
            )}
          </button>
        </div>
      )}

      {/* Certificate Display Area */}
      {certificate && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Signed Certificate Visual Card (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              {/* Certificate Header Banner */}
              <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-400" />
                    <span className="font-bold text-sm tracking-wide uppercase">Certificate of Digital Provenance</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Identifier: <span className="font-mono text-indigo-300">{certificate.certificate_id}</span>
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Signed & Valid
                </span>
              </div>

              {/* Certificate Contents */}
              <div className="p-5 space-y-4 text-xs">
                {/* Creator & Asset Info */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Asset Title</span>
                    <span className="font-semibold text-slate-900 text-sm">{certificate.payload.asset_title}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Creator Display Name</span>
                    <span className="font-semibold text-slate-900 text-sm">{certificate.payload.creator_display_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Source Model File</span>
                    <span className="font-mono text-slate-700">{certificate.payload.model_filename} ({certificate.payload.model_format.toUpperCase()})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Issue Timestamp (UTC)</span>
                    <span className="text-slate-700">{new Date(certificate.payload.issue_timestamp).toUTCString()}</span>
                  </div>
                </div>

                {/* Model SHA-256 Hash Box */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-500 font-medium">Signed 3D Model SHA-256 Hash</span>
                    <button
                      onClick={() => copyToClipboard(certificate.payload.model_sha256, setCopiedHash)}
                      className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 text-[11px]"
                    >
                      {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copiedHash ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 break-all select-all">
                    {certificate.payload.model_sha256}
                  </div>
                </div>

                {/* Digital Signature Hex Box */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-500 font-medium">
                      Ed25519 Digital Signature ({certificate.signature_hex.length / 2} bytes)
                    </span>
                    <button
                      onClick={() => copyToClipboard(certificate.signature_hex, setCopiedSig)}
                      className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 text-[11px]"
                    >
                      {copiedSig ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copiedSig ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100 font-mono text-[11px] text-indigo-900 break-all select-all">
                    {certificate.signature_hex}
                  </div>
                </div>

                {/* Public Key Identification */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>Signer Public Key ID: <span className="font-mono text-slate-700">{certificate.payload.public_key_id}</span></span>
                  <span>Version: {certificate.payload.certificate_version}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2">
                <button
                  onClick={downloadCertificateJson}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Certificate (.JSON)
                </button>
                <button
                  onClick={downloadPublicKeyPem}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-medium transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Download Public Key (.PEM)
                </button>
              </div>
            </div>

            {/* Canonical Payload Inspection */}
            <details className="bg-white rounded-xl border border-slate-200 p-4 text-xs">
              <summary className="font-semibold text-slate-800 cursor-pointer flex items-center justify-between">
                <span>View Raw Canonical JSON Payload</span>
                <span className="text-slate-400 font-normal text-[11px]">RFC 8785 Deterministic Representation</span>
              </summary>
              <pre className="mt-3 p-3 bg-slate-900 text-indigo-300 rounded-lg overflow-x-auto font-mono text-[11px] leading-relaxed">
                {JSON.stringify(certificate.payload, null, 2)}
              </pre>
            </details>
          </div>

          {/* Right Column: Public Key Trust Model & Security Advisories (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Trust Model Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Verification Trust Model
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                A valid cryptographic signature demonstrates that:
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>The canonical statement has not been altered by even one character since issuance.</li>
                <li>The signed model hash matches the exact file bytes produced during 3D generation.</li>
                <li>The signature verifies against the selected public verification key.</li>
              </ul>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                <span className="font-semibold block flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-amber-600" />
                  Academic / POC Limitation Notice
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  A cryptographic certificate demonstrates data integrity and signature validity.
                  It does not, by itself, legally verify the real-world identity of the creator or resolve copyright ownership.
                </p>
              </div>
            </div>

            {/* Public Key Display Card */}
            {publicKeyInfo && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Signer Public Verification Key
                  </span>
                  <button
                    onClick={() => copyToClipboard(publicKeyInfo.public_key_pem, setCopiedKey)}
                    className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 text-xs"
                  >
                    {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedKey ? 'Copied' : 'Copy PEM'}
                  </button>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Algorithm: {publicKeyInfo.algorithm} • ID: {publicKeyInfo.key_id}
                </div>
                <pre className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[10px] text-slate-700 overflow-x-auto leading-tight select-all">
                  {publicKeyInfo.public_key_pem.trim()}
                </pre>
                <p className="text-[11px] text-slate-400">
                  {publicKeyInfo.security_advisory}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
