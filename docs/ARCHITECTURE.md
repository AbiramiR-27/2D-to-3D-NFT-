# System Architecture & Technical Specification

## AI-Based 2D to 3D NFT Creation & Cryptographic Provenance Platform
**School of Innovation (SoI) — Phase 2 Project Proof of Concept (POC)**

---

## 1. Executive Summary & Concept Choice

Digital artists frequently produce 2D concepts but lack 3D modeling expertise. Furthermore, digital assets distributed across networks are vulnerable to unauthorized alteration, loss of attribution, and copyright ambiguity.

### Selected Concept: I02 — Conventional Signed Certificate
- **Primary Mechanism**: An asymmetric cryptographic signature (Ed25519) on a canonical JSON payload that binds creator metadata to the **exact byte SHA-256 hash** of the final 3D model.
- **Independence**: Certificate issuance and verification operate **100% offline without gas fees or cloud lock-in**.
- **Optional Blockchain Anchor**: An ERC-721 smart contract allows creators to optionally anchor the tokenURI, model hash, and certificate ID on an Ethereum network (Local Hardhat or Sepolia testnet). Blockchain is an enhancement, not a prerequisite for ordinary certificate verification.

---

## 2. High-Level Component Architecture

```
+-----------------------------------------------------------------------------------+
|                                  USER / BROWSER                                   |
+-----------------------------------------------------------------------------------+
|  * 2D Artwork Upload & Preset Picker                                              |
|  * Three.js Interactive 3D Viewer (Orbit, Wireframe, Lighting, GLB Download)      |
|  * Signed Certificate Inspector & Public Key Exporter                             |
|  * Dual Verification Studio (Option A: Sig Verify | Option B: Full File Check)    |
|  * Optional Web3 NFT Minting (MetaMask / 1-Click Local Node)                      |
|  * POC Automated Test Runner Console (Scenarios 1-10)                             |
+-----------------------------------------------------------------------------------+
                                   │ HTTP (REST) / RPC
                                   ▼
+-----------------------------------------------------------------------------------+
|                              FASTAPI BACKEND SERVICE                              |
+-----------------------------------------------------------------------------------+
|  [API Routes]                                                                     |
|    - /api/assets (Upload, 3D Generation, GLB Stream, Tamper Helper)               |
|    - /api/certificates (Canonical Ed25519 Sign, Dual Verification, Public Key)    |
|    - /api/blockchain (Status, Metadata URI, Local Mint Proxy)                     |
|                                                                                   |
|  [Core Services]                                                                  |
|    - Demo3DGenerator: Procedural Luminance Heightmap & UV GLB Mesher              |
|    - API3DGenerator: Cloud AI Adapter Interface (Meshy / Tripo3D)                 |
|    - ProvenanceService: RFC 8785 Canonical Serialization & SHA-256 Hashing       |
|    - KeyManager: Ed25519 Asymmetric Key Generation & Verification                 |
|    - LocalStore: Persistent SQLite Repository (No External DB Needed)             |
+-----------------------------------------------------------------------------------+
                                   │ Ethers / Web3.py
                                   ▼
+-----------------------------------------------------------------------------------+
|                         BLOCKCHAIN LAYER (ERC-721 NFT)                            |
+-----------------------------------------------------------------------------------+
|  * Smart Contract: ArtProvenanceNFT.sol (OpenZeppelin ERC721URIStorage)           |
|  * Hardhat Local Node (Chain ID: 31337) / Sepolia Testnet                         |
|  * On-chain Provenance Records: (assetId, modelHash, certificateId, timestamp)    |
+-----------------------------------------------------------------------------------+
```

---

## 3. Cryptographic Provenance Specification

### 3.1. SHA-256 Asset Checksum
The backend reads the **exact byte stream** of the compiled `.glb` file and hashes it using `hashlib.sha256()`:
$$\text{model\_sha256} = \text{SHA256}(\text{GLB File Bytes})$$

### 3.2. Canonical Certificate Payload (RFC 8785 Aligned)
Deterministic serialization prevents signature mismatch caused by whitespace or key ordering:
```json
{
  "asset_id": "asset_a1b2c3d4e5",
  "asset_title": "Cyber Shield Emblem",
  "certificate_id": "cert_9876543210ab",
  "certificate_version": "1.0",
  "creator_display_name": "Aria Stark",
  "issue_timestamp": "2026-10-26T09:30:00Z",
  "model_filename": "asset_a1b2c3d4e5.glb",
  "model_format": "glb",
  "model_sha256": "20ebc17320173d177f5ffed38e6fb04d0312e9d691d549bbc72f4d7a526e673a",
  "public_key_id": "urn:soi:key:ed25519:dev-01",
  "signature_algorithm": "Ed25519"
}
```

### 3.3. Asymmetric Digital Signature (Ed25519)
- **Private Key**: Kept strictly server-side in `backend/keys/dev_ed25519_private.pem` (never exposed to frontend or repository).
- **Public Key**: Distributed in SubjectPublicKeyInfo PEM format via `GET /api/certificates/public-key`.
- **Trust Model**: The public key is authenticated out-of-band (e.g. university/platform registry). Verification rejects any untrusted certificate claiming to self-certify with an arbitrary foreign key.

---

## 4. 3D Model Generation Architecture

1. **Procedural Demo Generator (`Demo3DGenerator`)**:
   - Converts 2D pixel luminance into a normalized 2D heightmap.
   - Builds a 3D vertex mesh: top relief surface, side skirts, and flat back base plane, forming a watertight solid.
   - Calculates UV texture coordinates projecting the 2D artwork onto the 3D surface.
   - Generates surface normals and compiles to binary GLTF (`.glb`) via `trimesh`.
   - **Label**: `"Procedural demo model (Luminance Relief Solid)"`.

2. **Cloud AI 3D Adapter (`API3DGenerator`)**:
   - Interface for real deep-learning image-to-3D APIs (Meshy / Tripo3D).
   - Reads credentials strictly from environment variables (`MESHY_API_KEY`).
   - If missing, provides clear diagnostic error and transparently guides user to procedural mode without fake loading screens.

---

## 5. Blockchain Smart Contract Architecture

The contract `ArtProvenanceNFT.sol` extends OpenZeppelin's `ERC721URIStorage` and `Ownable`:
- **`mintAssetNFT(recipient, uri, assetId, modelHash, certificateId)`**:
  - Enforces non-zero recipient.
  - Enforces exactly 64-character SHA-256 hexadecimal string.
  - Stores immutable `ProvenanceRecord` mapped to `tokenId`.
  - Emits `AssetNFTMinted` event.
- **`getProvenanceRecord(tokenId)`**: Reads on-chain provenance records for any minted token.
- **`getTokenIdByModelHash(modelHash)`**: Verifies whether a given model has already been minted.
