# AI-Based 2D to 3D NFT Creation & Blockchain Minting Platform

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black.svg)](https://threejs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22-yellow.svg)](https://hardhat.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5.0-red.svg)](https://openzeppelin.com/)

> **School of Innovation (SoI) — Phase 3 Project Proof of Concept (POC)**  
> **Selected Concept**: `I02 — Conventional Signed Certificate`  
> **Blockchain Network**: **Local Development Chain (Hardhat EVM, Chain ID 31337) — Local-Chain PoC**  

> [!IMPORTANT]
> **Blockchain Network Specification**:
> This Proof of Concept was executed and benchmarked on a **local Hardhat development chain (Chain ID: 31337)**, rather than a public testnet. Blockchain minting is an optional feature, with local-record signing (Concept I02) being the primary provenance mechanism. All on-chain transactions incurred zero real-world cost; USD fee estimates reported in benchmarks are theoretical projections modeled at $3,000/ETH.

---

## 1. Project Overview

Digital artists and creators frequently start with 2D concepts but lack the specialized 3D modeling skills or computing infrastructure required to build 3D assets. Furthermore, preserving provenance and detecting unauthorized modifications across digital networks is a critical challenge.

This platform provides an end-to-end demonstrable Proof of Concept that:
1. **Uploads 2D Artwork**: Supports PNG, JPG, JPEG, and WEBP with client & server-side validation.
2. **Generates 3D Representations**: Features a modular adapter supporting both an **offline Procedural Demo 3D Generator** (luminance relief solid GLB) and a clean adapter for **Cloud AI 3D APIs** (e.g., Meshy / Tripo3D).
3. **Interactive 3D Studio**: Real-time Three.js viewer with rotation, panning, zooming, wireframe mode, lighting presets, camera reset, and GLB download.
4. **Conventional Signed Provenance Certificate (Primary Feature)**: Computes the exact byte SHA-256 hash of the 3D model, builds a deterministic canonical JSON payload (RFC 8785), and signs it using an asymmetric **Ed25519** private key.
5. **Dual Verification Studio**:
   - **Option A**: Validates certificate structure and digital signature against the trusted public key.
   - **Option B**: Compares the 3D model file bytes against the signed hash; detects single-byte alterations instantly.
6. **Optional Blockchain NFT Minting**: ERC-721 smart contract (`ArtProvenanceNFT.sol`) linking asset metadata, certificate ID, and model SHA-256 on a local Hardhat node or Ethereum testnet.

---

## 2. Technology Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Three.js (WebGL GLTFLoader & OrbitControls), Lucide React, Ethers.js v6.
- **Backend**: Python 3.12, FastAPI, Pydantic v2, Pillow, NumPy, Trimesh, Cryptography (Ed25519), SQLite, Pytest.
- **Blockchain**: Solidity 0.8.24 (Cancun EVM, viaIR), Hardhat 2.22, OpenZeppelin Contracts 5.0 (`ERC721URIStorage`, `Ownable`).

---

## 3. Project Directory Structure

```text
d:/soi/
├── backend/
│   ├── app/
│   │   ├── api/            # REST API routers (assets, certificates, blockchain)
│   │   ├── models/         # Pydantic schemas
│   │   ├── security/       # Ed25519 asymmetric key manager & canonical signing
│   │   ├── services/       # 3D generator (procedural & AI), provenance, NFT service
│   │   ├── storage/        # Persistent SQLite store
│   │   ├── tests/          # Pytest suite covering all 10 POC test scenarios
│   │   ├── config.py       # Centralized app configuration
│   │   └── main.py         # FastAPI application entrypoint
│   ├── data/               # Persistent database, uploaded images, GLB models
│   ├── keys/               # Development Ed25519 private & public PEM keys
│   └── requirements.txt    # Python dependencies
├── blockchain/
│   ├── contracts/          # ArtProvenanceNFT.sol (OpenZeppelin ERC-721)
│   ├── scripts/            # deploy.js (deploys and syncs address/ABI)
│   ├── test/               # ArtProvenanceNFT.test.js (minting, validation, events)
│   ├── hardhat.config.js   # Hardhat config with Cancun EVM & viaIR
│   └── package.json        # Smart contract dependencies
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Viewer3D (Three.js WebGL viewer)
│   │   ├── pages/          # Home, Create, Studio3D, Certificate, Verify, Mint, History, Tests
│   │   ├── services/       # Typed API client
│   │   └── types/          # TypeScript interfaces
│   ├── vite.config.ts      # Vite config with API proxy to :8000
│   └── package.json        # Frontend dependencies
├── sample_assets/          # Baseline 2D images, sample GLB model, sample certificate
├── docs/                   # ARCHITECTURE.md, TEST_PLAN.md, DEMO_GUIDE.md
├── .env.example            # Environment configuration template
├── .gitignore              # Standard exclusions
└── README.md               # Complete platform guide
```

---

## 4. Quick Start & Setup Guide

### 4.1. Prerequisites
- **Node.js**: v18+ (tested on v24.18.0)
- **Python**: v3.10+ (tested on v3.12.7)
- **Git**

### 4.2. Clone & Environment Setup
```powershell
cd D:\soi
Copy-Item .env.example .env
```

### 4.3. Backend Setup
```powershell
cd D:\soi\backend
python -m pip install -r requirements.txt
```

Start the FastAPI backend server:
```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger documentation is available at: **`http://127.0.0.1:8000/docs`**

### 4.4. Blockchain Setup (Hardhat)
In a second terminal:
```powershell
cd D:\soi\blockchain
npm install
```

Run smart contract automated tests:
```powershell
npx hardhat test
```

Deploy the contract locally:
```powershell
# Option A: In-memory deployment test
npx hardhat run scripts/deploy.js

# Option B: Run persistent local node (Recommended for Web3 minting)
npx hardhat node
# In another terminal window:
npx hardhat run scripts/deploy.js --network localhost
```

### 4.5. Frontend Setup
In a third terminal:
```powershell
cd D:\soi\frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 5. Automated Testing

### 5.1. Backend Functional & Cryptographic Tests (10/10 Scenarios)
The backend test suite rigorously validates all 10 evaluation scenarios:
```powershell
cd D:\soi\backend
python -m pytest app/tests/test_poc_scenarios.py -v
```

### 5.2. Smart Contract Unit Tests (4/4 Tests)
```powershell
cd D:\soi\blockchain
npx hardhat test
```

### 5.3. In-Browser Live Test Console
Navigate to the **POC Test Suite** tab in the web interface and click **"Run All 10 Test Scenarios"** to trigger live API calls with diagnostic execution timings.

---

## 6. Proof of Concept Test Scenarios Summary

| Test # | Description | Expected Result | Implementation |
|---|---|---|---|
| **Test 1** | Valid certificate | Signature valid against public key | Verified via `cryptography.hazmat` Ed25519 |
| **Test 2** | Untampered model | Model SHA-256 matches signed hash | Verified byte-level equality |
| **Test 3** | Modified model | 1-byte alteration causes mismatch | Byte flip at offset 50 detected immediately |
| **Test 4** | Modified certificate | Tampering signed field fails signature | Ed25519 signature verification fails |
| **Test 5** | Malformed certificate | Validation error with helpful message | Pydantic schema validation returns 400 |
| **Test 6** | 3D generation failure | Transparent error when API key missing | Clear diagnostic fallback to procedural mode |
| **Test 7** | Blockchain unavailable | Cert issuance & verification unaffected | Provenance service has 0 blockchain dependencies |
| **Test 8** | Local NFT mint | Token minted with valid ID & tx hash | ArtProvenanceNFT emits `AssetNFTMinted` |
| **Test 9** | Unauthorized/invalid mint | Rejection of zero address or bad hash | Contract validation reverts with descriptive message |
| **Test 10** | Repeatability | Repeated tests produce identical results | Deterministic canonical JSON (RFC 8785) |

---

## 7. What Requires External APIs vs What Works Offline

| Component | Status | Details |
|---|---|---|
| **2D Image Upload & Validation** | **100% Offline** | Handled locally via Pillow and HTML5 File API |
| **Procedural 3D GLB Mesh Generation** | **100% Offline** | Generates authentic relief solids via NumPy & Trimesh |
| **Three.js Interactive Viewer** | **100% Offline** | WebGL client-side rendering with orbit controls |
| **Ed25519 Signed Certificate** | **100% Offline** | Deterministic canonical signing via Python `cryptography` |
| **Dual Integrity Verification** | **100% Offline** | Byte-level SHA-256 digest computation & signature check |
| **Local Hardhat Blockchain Minting** | **100% Offline** | Executes against local Hardhat node on port 8545 |
| **Cloud AI 3D Reconstruction** | *Requires API Key* | Modular adapter for Meshy / Tripo3D via `.env` |
| **Public Testnet Minting** | *Requires Network* | Optional Sepolia testnet deployment |

---

## 8. Security Considerations

1. **Private Signing Key Protection**: The Ed25519 private key is strictly managed on the backend and is never sent to the browser or checked into source control.
2. **Canonical JSON Serialization**: Adheres to RFC 8785 principles (deterministic key sorting, compact delimiters) to guarantee signature reproducibility.
3. **Public Key Trust Model**: The application warns against blindly trusting arbitrary keys presented inside unverified certificates.
4. **Smart Contract Security**: Uses battle-tested OpenZeppelin contracts and validates recipient addresses and 64-character hex hash lengths before state modification.

---

## 9. Current Limitations & Future Work

- **POC Limitations**:
  - The demo 3D generator produces a relief extrusion mesh, not a 360-degree neural reconstruction.
  - Development signing keys are stored locally; production requires a Hardware Security Module (HSM) or KMS.
  - File URLs resolve locally; production would pin assets and certificates to IPFS / Filecoin.
- **Future Enhancements**:
  - Direct integration with open-weights neural reconstruction models (e.g., TripoSR, Shap-E).
  - W3C Verifiable Credentials (VC) and Decentralized Identifiers (DID) compliance.
  - Batch certificate verification and ERC-1155 multi-token edition support.

---

## 10. College SoI Phase 2 Evaluator Demonstration

For step-by-step presentation scripts and evaluator talking points, refer to [`docs/DEMO_GUIDE.md`](docs/DEMO_GUIDE.md).
For technical specifications, refer to [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
For testing logs, refer to [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md).
For the 10-asset benchmark report and raw evidence receipts, refer to [`docs/POC_EXECUTION_RESULTS.md`](docs/POC_EXECUTION_RESULTS.md) and [`docs/evidence/`](docs/evidence/).
