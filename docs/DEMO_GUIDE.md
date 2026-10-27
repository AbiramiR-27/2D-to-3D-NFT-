# School of Innovation (SoI) Phase 2: Live Demonstration Guide

This guide walks you through delivering a 5 to 10 minute presentation and live demonstration of the platform to professors and evaluators.

---

## 1. Setup Before the Presentation

Open three terminal windows:

### Terminal 1: Hardhat Blockchain Node (Optional but recommended)
```powershell
cd D:\soi\blockchain
npx hardhat node
```
*Note: In another terminal, deploy the contract to the local node:*
```powershell
cd D:\soi\blockchain
npx hardhat run scripts/deploy.js --network localhost
```

### Terminal 2: FastAPI Backend
```powershell
cd D:\soi\backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Verify: Open `http://127.0.0.1:8000/docs` in your browser.*

### Terminal 3: Vite React Frontend
```powershell
cd D:\soi\frontend
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 2. Step-by-Step Demonstration Flow

### Part 1: Project Introduction & Problem Framing (1 min)
1. **Open the Overview Tab (`/`)**:
   - Explain the core problem: 2D digital creators lack 3D assets and reliable provenance.
   - Introduce **Concept I02 (Conventional Signed Certificate)** as the primary integrity anchor.
   - Point out that **blockchain minting is optional**, eliminating gas friction while enabling decentralized ownership.

### Part 2: Step 1 & 2: 2D Upload & 3D Generation (2 mins)
1. Navigate to **Upload & Generate**:
   - Click one of the quick evaluation presets: **"Preset 1: Cyber Shield"**.
   - Show file details (PNG format, dimensions, size check under 15MB limit).
   - Review generation settings: Explain the difference between **Procedural Demo Generator** and **Cloud AI Adapter**.
   - Adjust the **Relief Height slider** (e.g. 0.35x).
   - Click **Generate 3D Asset**.
   - Show the real generation status log. Notice that the backend calculates pixel luminance, generates side skirt walls and base plane, and packages the result into a binary `.glb` with UV mapping.

### Part 3: Step 3 & 4: 3D Studio & Metadata (2 mins)
1. Click **Proceed to 3D Studio**:
   - Demonstrate the interactive Three.js viewport:
     - **Left-click + drag**: Rotate model in 3D.
     - **Right-click + drag**: Pan.
     - **Scroll**: Zoom in/out.
     - **Click Wireframe button**: Toggle wireframe mode to show triangle geometry.
     - **Click Sun icon**: Switch lighting presets (Studio, Bright, Dramatic).
     - **Click Reset icon**: Return camera to default position.
   - Point to the model stats footer (vertex count, faces count, bounding dimensions).
   - Point to the **SHA-256 Model Checksum** box: Explain that this exact hash represents the binary model bytes.

### Part 4: Step 5: Signed Provenance Certificate (Primary Feature) (2 mins)
1. Click **Proceed to Signed Certificate**:
   - Click **Generate & Sign Certificate Now**.
   - Review the issued certificate card:
     - Certificate ID (`cert_...`).
     - Creator display name and asset title.
     - Model SHA-256 checksum.
     - Canonical Ed25519 digital signature hex string.
     - Public verification key ID.
   - Click **Download Certificate (.JSON)** and **Download Public Key (.PEM)**.
   - Expand the **Raw Canonical JSON Payload** accordion to show deterministic serialization (RFC 8785).
   - Explain the trust model: The digital signature ensures tamper-proof integrity and author statement authenticity without requiring third-party cloud services.

### Part 5: Step 6: Dual Verification Studio & Tamper Demonstration (2 mins)
1. Click **Proceed to Verification Studio**:
   - Show **Option B: Dual-Proof Asset Integrity Verification**.
   - Click **Auto-Populate Files for Verification**.
   - Click **Run Asset Integrity Verification**.
   - **Result**: Show green **PASSED** banner confirming 100% byte-for-byte match.
   - **THE "WOW" MOMENT (Tamper Demonstration)**:
     - Click **"Simulate Model Tampering (Test 3)"**.
     - The backend intentionally alters **just 1 byte** at offset 50 of the model.
     - Click **Run Asset Integrity Verification** again.
     - **Result**: Show the red **FAILED: INTEGRITY COMPROMISED** banner! Show expected vs calculated SHA-256 hashes side-by-side, proving that even a single flipped bit is caught immediately!

### Part 6: Step 7: Optional Blockchain NFT Minting (1 min)
1. Navigate to **NFT Minting**:
   - Show the network indicator (Connected to Hardhat node or offline fallback).
   - Show the standard ERC-721 token metadata referencing the certificate ID and model hash.
   - Click **"Direct 1-Click Local Node Mint"** (or connect MetaMask).
   - Show the real on-chain transaction receipt:
     - Real Transaction Hash.
     - Emitted Token ID (e.g. `#1`).
     - Verified contract address.

### Part 7: Step 8: POC Test Suite Runner (1 min)
1. Navigate to **POC Test Suite**:
   - Click **"Run All 10 Test Scenarios"**.
   - Watch the live evaluator console execute tests 1 through 10 in real time with timing diagnostics.
   - Conclude by showing the 10/10 score.
