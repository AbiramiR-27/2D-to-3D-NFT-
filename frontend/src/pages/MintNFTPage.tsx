import React, { useState, useEffect } from 'react';
import {
  Coins,
  Wallet,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  ShieldAlert,
  Layers,
  ArrowRight,
  Hash,
} from 'lucide-react';
import { ethers } from 'ethers';
import { Asset, BlockchainStatus, MintNFTResult } from '../types';
import { api } from '../services/api';

interface MintNFTPageProps {
  currentAsset: Asset | null;
  onAssetUpdated: (asset: Asset) => void;
}

export const MintNFTPage: React.FC<MintNFTPageProps> = ({ currentAsset, onAssetUpdated }) => {
  const [bcStatus, setBcStatus] = useState<BlockchainStatus | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [recipientInput, setRecipientInput] = useState<string>('');
  const [isConnectingWallet, setIsConnectingWallet] = useState<boolean>(false);
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [mintResult, setMintResult] = useState<MintNFTResult | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
  const [copiedTx, setCopiedTx] = useState<boolean>(false);

  useEffect(() => {
    api.getBlockchainStatus().then(setBcStatus).catch(console.error);
    if (currentAsset?.nft_tx_hash) {
      setMintResult({
        success: true,
        status: 'MINTED',
        transaction_hash: currentAsset.nft_tx_hash,
        token_id: currentAsset.nft_token_id,
        contract_address: currentAsset.nft_contract_address,
        recipient: walletAddress || 'Registered Wallet',
      });
    }
  }, [currentAsset]);

  // Connect MetaMask
  const connectMetaMask = async () => {
    if (typeof (window as any).ethereum === 'undefined') {
      setMintError('MetaMask extension is not detected in your browser. You can still use the 1-Click Local Hardhat Node Mint below.');
      return;
    }
    setIsConnectingWallet(true);
    setMintError(null);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setRecipientInput(accounts[0]);
      }
    } catch (e: any) {
      setMintError(`Failed to connect wallet: ${e.message}`);
    } finally {
      setIsConnectingWallet(false);
    }
  };

  // Direct Mint via Local Hardhat Node
  const handleMintLocal = async () => {
    if (!currentAsset) return;
    const dest = recipientInput.trim() || walletAddress || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Hardhat account #1 default
    setIsMinting(true);
    setMintError(null);
    try {
      const res = await api.mintNFTLocal(currentAsset.asset_id, dest);
      setMintResult(res);
      const updated = await api.getAsset(currentAsset.asset_id);
      onAssetUpdated(updated);
    } catch (e: any) {
      setMintError(e.message || 'Minting transaction failed');
    } finally {
      setIsMinting(false);
    }
  };

  // MetaMask Browser Direct Mint
  const handleMintWithMetaMask = async () => {
    if (!currentAsset || typeof (window as any).ethereum === 'undefined') {
      return handleMintLocal();
    }
    setIsMinting(true);
    setMintError(null);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contractInfo = await api.getContractInfo();

      const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, signer);
      const tokenUri = `${window.location.origin}/api/blockchain/nft-metadata/${currentAsset.asset_id}`;
      const dest = recipientInput.trim() || await signer.getAddress();

      const tx = await contract.mintAssetNFT(
        dest,
        tokenUri,
        currentAsset.asset_id,
        currentAsset.model_sha256,
        currentAsset.certificate_id
      );
      const receipt = await tx.wait();

      // Find event
      let tokenId = 1;
      try {
        const event = receipt.logs.find((log: any) => {
          try {
            return contract.interface.parseLog(log)?.name === 'AssetNFTMinted';
          } catch {
            return false;
          }
        });
        if (event) {
          const parsed = contract.interface.parseLog(event);
          tokenId = Number(parsed?.args?.tokenId);
        }
      } catch (e) {
        console.warn(e);
      }

      await api.recordMint({
        asset_id: currentAsset.asset_id,
        transaction_hash: receipt.hash,
        token_id: tokenId,
        contract_address: contractInfo.address,
        recipient: dest,
      });

      setMintResult({
        success: true,
        status: 'MINTED',
        transaction_hash: receipt.hash,
        token_id: tokenId,
        contract_address: contractInfo.address,
        recipient: dest,
        token_uri: tokenUri,
      });

      const updated = await api.getAsset(currentAsset.asset_id);
      onAssetUpdated(updated);
    } catch (e: any) {
      setMintError(e.message || 'MetaMask transaction rejected or failed.');
    } finally {
      setIsMinting(false);
    }
  };

  if (!currentAsset) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-4">
          <Coins className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">No Asset Selected</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Please select an asset with a generated 3D model and signed certificate before minting an NFT.
        </p>
      </div>
    );
  }

  const hasCertificate = Boolean(currentAsset.certificate_id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Step 6: Optional Blockchain NFT Minting Module</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
            Optional Feature
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Mint an ERC-721 Non-Fungible Token linking the asset's metadata, byte SHA-256 model hash, and signed provenance certificate.
        </p>
      </div>

      {/* Network & Node Status Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className={`w-3 h-3 rounded-full ${bcStatus?.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <div>
            <span className="font-semibold text-slate-800">
              {bcStatus?.is_available ? 'Connected to Blockchain Node' : 'Blockchain Node Not Detected'}
            </span>
            <span className="text-slate-500 block text-[11px]">
              RPC: {bcStatus?.rpc_url || 'http://127.0.0.1:8545'} • Chain ID: {bcStatus?.target_chain_id || 31337}
            </span>
          </div>
        </div>

        {bcStatus?.contract_address && (
          <div className="text-right">
            <span className="text-slate-400 block text-[10px]">Deployed Smart Contract</span>
            <span className="font-mono text-indigo-600 font-medium text-[11px] select-all">
              {bcStatus.contract_address}
            </span>
          </div>
        )}
      </div>

      {/* Pre-requisite Check: Must Have Certificate */}
      {!hasCertificate && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-950">Signed Certificate Required for NFT Minting</h4>
            <p className="mt-0.5 leading-relaxed text-amber-800">
              According to the provenance architecture (Concept I02), an asset must first possess a cryptographically
              signed certificate before on-chain minting so that the certificate ID and verified model hash can be anchored into the NFT.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Minting Form & Wallet Connection (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Destination Wallet & Network Controls
            </h3>

            {/* Wallet Connection */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">MetaMask Status</span>
                <span className="font-medium text-slate-800 text-xs">
                  {walletAddress ? (
                    <span className="font-mono text-indigo-700">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</span>
                  ) : (
                    'Not Connected'
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={connectMetaMask}
                disabled={isConnectingWallet}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Wallet className="w-3.5 h-3.5" />
                {walletAddress ? 'Switch Wallet' : 'Connect MetaMask'}
              </button>
            </div>

            {/* Recipient Address Field */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">Recipient Ethereum Address</label>
              <input
                type="text"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                placeholder="0x... (Defaults to Hardhat Dev Account #1 if blank)"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-400 block">
                The ERC-721 token ownership will be assigned directly to this destination address.
              </span>
            </div>

            {mintError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{mintError}</span>
              </div>
            )}

            {/* Mint Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={walletAddress ? handleMintWithMetaMask : handleMintLocal}
                disabled={!hasCertificate || isMinting}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  !hasCertificate || isMinting
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                }`}
              >
                {isMinting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Submitting Blockchain Transaction...
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4" />
                    {walletAddress ? 'Mint NFT via MetaMask' : 'Mint NFT via Local Hardhat Node'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleMintLocal}
                disabled={!hasCertificate || isMinting}
                className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors"
              >
                Direct 1-Click Local Node Mint (No MetaMask Required)
              </button>
            </div>
          </div>

          {/* Transaction Result Card */}
          {mintResult && (
            <div className="p-5 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">NFT Minted Successfully!</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Real on-chain ERC-721 token emitted with immutable provenance binding.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white/90 rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Token ID:</span>
                  <span className="font-mono font-bold text-slate-900">#{mintResult.token_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contract Address:</span>
                  <span className="font-mono text-slate-700 text-[11px] select-all truncate max-w-[200px]">
                    {mintResult.contract_address}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Transaction Hash:</span>
                  <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200 mt-0.5">
                    <span className="font-mono text-[10px] text-indigo-700 break-all select-all">
                      {mintResult.transaction_hash}
                    </span>
                    <button
                      onClick={() => {
                        if (mintResult.transaction_hash) {
                          navigator.clipboard.writeText(mintResult.transaction_hash);
                          setCopiedTx(true);
                          setTimeout(() => setCopiedTx(false), 2000);
                        }
                      }}
                      className="text-slate-500 hover:text-slate-800 ml-2"
                    >
                      {copiedTx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: ERC-721 Metadata Preview (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              ERC-721 Metadata Payload
            </h3>
            <p className="text-xs text-slate-500">
              The smart contract stores a <span className="font-mono font-medium text-slate-700">tokenURI</span> referencing this exact JSON metadata schema.
            </p>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">NFT Name</span>
                <span className="font-semibold text-slate-800">{currentAsset.title}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Asset ID</span>
                <span className="font-mono text-slate-700">{currentAsset.asset_id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Certificate Reference</span>
                <span className="font-mono text-indigo-700 font-medium">
                  {currentAsset.certificate_id || 'Certificate Pending'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">On-Chain Model SHA-256</span>
                <span className="font-mono text-[10px] text-slate-700 break-all select-all block bg-white p-1 rounded border border-slate-200">
                  {currentAsset.model_sha256}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-100 rounded-lg text-[11px] text-slate-500 space-y-1">
              <span className="font-semibold text-slate-700 block">Decentralized Storage Note:</span>
              <p className="leading-tight">
                For this local POC, references resolve via backend endpoints. In production, models and certificates are pinned to IPFS / Arweave.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
