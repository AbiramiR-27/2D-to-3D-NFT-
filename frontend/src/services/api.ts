import {
  Asset,
  SignedCertificate,
  VerifyCertificateResult,
  VerifyAssetIntegrityResult,
  SystemHealth,
  BlockchainStatus,
  MintNFTResult,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Health
  async getHealth(): Promise<SystemHealth> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch system health');
    return res.json();
  },

  // Assets
  async uploadAsset(formData: FormData): Promise<Asset> {
    const res = await fetch(`${API_BASE}/assets/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async listAssets(): Promise<Asset[]> {
    const res = await fetch(`${API_BASE}/assets`);
    if (!res.ok) throw new Error('Failed to fetch assets');
    return res.json();
  },

  async getAsset(assetId: string): Promise<Asset> {
    const res = await fetch(`${API_BASE}/assets/${assetId}`);
    if (!res.ok) throw new Error(`Failed to fetch asset ${assetId}`);
    return res.json();
  },

  async updateAssetMetadata(
    assetId: string,
    metadata: { title?: string; description?: string; creator_name?: string; tags?: string[] }
  ): Promise<Asset> {
    const res = await fetch(`${API_BASE}/assets/${assetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    });
    if (!res.ok) throw new Error('Failed to update asset metadata');
    return res.json();
  },

  async generate3D(assetId: string, options: { mode?: string; mesh_style?: string; depth_scale?: number }): Promise<Asset> {
    const res = await fetch(`${API_BASE}/assets/${assetId}/generate-3d`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: '3D Generation failed' }));
      throw new Error(err.detail || '3D Generation failed');
    }
    return res.json();
  },

  async tamperTest(assetId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/assets/${assetId}/tamper-test`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Tamper test failed' }));
      throw new Error(err.detail || 'Tamper test failed');
    }
    return res.json();
  },

  // Certificates
  async generateCertificate(assetId: string): Promise<SignedCertificate> {
    const res = await fetch(`${API_BASE}/certificates/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: assetId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Certificate generation failed' }));
      throw new Error(err.detail || 'Certificate generation failed');
    }
    return res.json();
  },

  async getCertificate(certificateId: string): Promise<SignedCertificate> {
    const res = await fetch(`${API_BASE}/certificates/${certificateId}`);
    if (!res.ok) throw new Error('Failed to fetch certificate');
    return res.json();
  },

  async getPublicKey(): Promise<{ key_id: string; algorithm: string; public_key_pem: string; is_development_key: boolean; security_advisory: string }> {
    const res = await fetch(`${API_BASE}/certificates/public-key`);
    if (!res.ok) throw new Error('Failed to fetch public key');
    return res.json();
  },

  async verifyCertificate(certificate: any): Promise<VerifyCertificateResult> {
    const res = await fetch(`${API_BASE}/certificates/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ certificate }),
    });
    if (!res.ok) throw new Error('Failed to verify certificate');
    return res.json();
  },

  async verifyAssetIntegrity(certificateFile: File, modelFile: File, trustedPublicKey?: string): Promise<VerifyAssetIntegrityResult> {
    const formData = new FormData();
    formData.append('certificate_file', certificateFile);
    formData.append('model_file', modelFile);
    if (trustedPublicKey) {
      formData.append('trusted_public_key', trustedPublicKey);
    }

    const res = await fetch(`${API_BASE}/certificates/verify-asset`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Integrity verification failed' }));
      throw new Error(err.detail || 'Integrity verification failed');
    }
    return res.json();
  },

  // Blockchain
  async getBlockchainStatus(): Promise<BlockchainStatus> {
    const res = await fetch(`${API_BASE}/blockchain/status`);
    if (!res.ok) throw new Error('Failed to fetch blockchain status');
    return res.json();
  },

  async getContractInfo(): Promise<{ address: string; abi: any[]; network: string; chainId: number }> {
    const res = await fetch(`${API_BASE}/blockchain/contract-info`);
    if (!res.ok) throw new Error('Failed to fetch contract info');
    return res.json();
  },

  async mintNFTLocal(assetId: string, recipientAddress: string): Promise<MintNFTResult> {
    const res = await fetch(`${API_BASE}/blockchain/mint-local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: assetId, recipient_address: recipientAddress }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Minting failed' }));
      throw new Error(err.detail || 'Minting failed');
    }
    return res.json();
  },

  async recordMint(data: { asset_id: string; transaction_hash: string; token_id: number; contract_address: string; recipient: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/blockchain/record-mint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
