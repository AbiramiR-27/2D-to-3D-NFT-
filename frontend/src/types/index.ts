export interface Asset {
  asset_id: string;
  title: string;
  description: string;
  creator_name: string;
  tags: string[];
  image_filename: string;
  image_url: string;
  image_format: string;
  image_size_bytes: number;
  model_filename?: string;
  model_url?: string;
  model_format?: string;
  model_size_bytes?: number;
  model_sha256?: string;
  generation_method?: string;
  generation_status: 'pending' | 'generating' | 'completed' | 'failed';
  generation_error?: string;
  certificate_id?: string;
  nft_token_id?: number;
  nft_tx_hash?: string;
  nft_contract_address?: string;
  created_at: string;
  updated_at: string;
}

export interface CanonicalCertificatePayload {
  certificate_id: string;
  asset_id: string;
  asset_title: string;
  creator_display_name: string;
  model_filename: string;
  model_format: string;
  model_sha256: string;
  issue_timestamp: string;
  certificate_version: string;
  signature_algorithm: string;
  public_key_id: string;
}

export interface SignedCertificate {
  certificate_id: string;
  payload: CanonicalCertificatePayload;
  signature_hex: string;
  public_key_pem: string;
  is_development_key: boolean;
  trust_note: string;
}

export interface VerifyCertificateResult {
  is_valid_signature: boolean;
  status: 'VALID' | 'TAMPERED' | 'MALFORMED' | 'KEY_MISMATCH' | 'ERROR';
  message: string;
  certificate_id?: string;
  asset_id?: string;
  model_sha256?: string;
  payload?: CanonicalCertificatePayload;
  tampered_fields?: string[];
  public_key_id?: string;
}

export interface VerifyAssetIntegrityResult {
  certificate_signature_valid: boolean;
  asset_hash_matches: boolean;
  expected_hash: string;
  calculated_hash: string;
  overall_valid: boolean;
  status: 'VERIFIED_AUTHENTIC' | 'ASSET_MODIFIED' | 'SIGNATURE_INVALID' | 'VERIFICATION_FAILED';
  message: string;
  byte_discrepancy_details?: string;
}

export interface SystemHealth {
  status: string;
  version: string;
  key_configured: boolean;
  key_id: string;
  is_dev_key: boolean;
  blockchain_available: boolean;
  blockchain_rpc: string;
  chain_id?: number;
  contract_address?: string;
  total_assets: number;
  total_certificates: number;
}

export interface BlockchainStatus {
  is_available: boolean;
  rpc_url: string;
  target_chain_id: number;
  contract_deployed: boolean;
  contract_address?: string;
  message: string;
}

export interface MintNFTResult {
  success: boolean;
  status: string;
  transaction_hash?: string;
  token_id?: number;
  contract_address?: string;
  recipient: string;
  token_uri?: string;
  block_number?: number;
  error?: string;
}
