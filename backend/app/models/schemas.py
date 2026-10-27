from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field

class AssetMetadataUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    creator_name: Optional[str] = None
    tags: Optional[List[str]] = None

class Generate3DRequest(BaseModel):
    mode: str = Field(default="demo", description="'demo' for procedural generator, 'api' for AI cloud adapter")
    mesh_style: str = Field(default="textured_relief", description="Style of procedural generation: 'textured_relief', 'voxel_extrusion', or 'prism_sculpture'")
    depth_scale: float = Field(default=0.35, ge=0.05, le=1.5, description="Relief extrusion height scale")

class AssetResponse(BaseModel):
    asset_id: str
    title: str
    description: str
    creator_name: str
    tags: List[str] = []
    
    # Image details
    image_filename: str
    image_url: str
    image_format: str
    image_size_bytes: int
    
    # 3D Model details
    model_filename: Optional[str] = None
    model_url: Optional[str] = None
    model_format: Optional[str] = None
    model_size_bytes: Optional[int] = None
    model_sha256: Optional[str] = None
    
    # Generation metadata
    generation_method: Optional[str] = None
    generation_status: str = "pending"
    generation_error: Optional[str] = None
    
    # Provenance & Blockchain status
    certificate_id: Optional[str] = None
    nft_token_id: Optional[int] = None
    nft_tx_hash: Optional[str] = None
    nft_contract_address: Optional[str] = None
    
    created_at: str
    updated_at: str

class CanonicalCertificatePayload(BaseModel):
    certificate_id: str
    asset_id: str
    asset_title: str
    creator_display_name: str
    model_filename: str
    model_format: str
    model_sha256: str
    issue_timestamp: str  # ISO-8601 UTC
    certificate_version: str = "1.0"
    signature_algorithm: str = "Ed25519"
    public_key_id: str

class SignedCertificate(BaseModel):
    certificate_id: str
    payload: CanonicalCertificatePayload
    signature_hex: str
    public_key_pem: str
    is_development_key: bool = True
    trust_note: str = (
        "Notice: This certificate uses a local development Ed25519 key for demonstration purposes. "
        "A valid cryptographic signature proves the certificate contents have not been altered "
        "since issuance by the holder of this private key, but does not verify real-world legal identity."
    )

class VerifyCertificateRequest(BaseModel):
    certificate: Dict[str, Any]

class VerifyCertificateResult(BaseModel):
    is_valid_signature: bool
    status: str  # 'VALID', 'TAMPERED', 'MALFORMED', 'KEY_MISMATCH'
    message: str
    certificate_id: Optional[str] = None
    asset_id: Optional[str] = None
    model_sha256: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None
    tampered_fields: List[str] = []
    public_key_id: Optional[str] = None

class VerifyAssetIntegrityResult(BaseModel):
    certificate_signature_valid: bool
    asset_hash_matches: bool
    expected_hash: str
    calculated_hash: str
    overall_valid: bool
    status: str  # 'VERIFIED_AUTHENTIC', 'ASSET_MODIFIED', 'SIGNATURE_INVALID', 'VERIFICATION_FAILED'
    message: str
    byte_discrepancy_details: Optional[str] = None

class MintNFTRequest(BaseModel):
    asset_id: str
    recipient_address: str
    nft_name: Optional[str] = None
    nft_description: Optional[str] = None
    token_uri: Optional[str] = None

class MintNFTResult(BaseModel):
    success: bool
    status: str
    transaction_hash: Optional[str] = None
    token_id: Optional[int] = None
    contract_address: Optional[str] = None
    recipient: str
    token_uri: Optional[str] = None
    block_number: Optional[int] = None
    error: Optional[str] = None

class SystemHealth(BaseModel):
    status: str
    version: str
    key_configured: bool
    key_id: str
    is_dev_key: bool
    blockchain_available: bool
    blockchain_rpc: str
    chain_id: Optional[int] = None
    contract_address: Optional[str] = None
    total_assets: int
    total_certificates: int
