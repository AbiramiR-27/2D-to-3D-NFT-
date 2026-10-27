# PoC Evidence & Verification Audit Dossier

> **Project**: AI-Based 2D to 3D NFT Creation & Cryptographic Provenance Platform  
> **Evaluation**: School of Innovation (SoI) — Phase 2  
> **Blockchain Classification**: **Local Development Chain PoC** (Hardhat EVM, Chain ID 31337)  
> **Timestamp**: `2026-10-27T09:53:49Z`  
> **Smart Contract**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`  

---

## 1. Blockchain Network Classification (Mandatory Clarification)

> [!IMPORTANT]
> **Network Classification Note**:
> The transactions and token mints reported herein were executed against a **local Hardhat development node (Chain ID: 31337)** running on `http://127.0.0.1:8545`. 
> - This is a **local-chain Proof of Concept**, NOT a public testnet experiment (such as Ethereum Sepolia or Holesky).
> - While the EVM execution, state transition logic, gas consumption, event emission, and ABI encoding are 100% compliant with standard Ethereum specifications, no public testnet faucet funds were consumed.
> - The USD fee estimates (e.g. ~$1.39 per mint, $13.92 total) are **theoretical economic projections** assuming an exchange rate of **$3,000/ETH**, provided solely to model real-world gas economics. They do **not** represent actual monetary payments.

---

## 2. Raw Evidence Verification Scorecard

- **Unchanged Files Verified**: `10 / 10 (100%)`
- **Altered Files Detected**: `10 / 10 (100%)`
- **Local Certificate vs On-Chain Hash Agreement**: `10 / 10 (100%)`
- **False Mismatches**: `0`
- **Failures / Retests**: `0`

---

## 3. Evidence Index & Artifact References

| Artifact | File Path | Description |
|---|---|---|
| **Raw Receipts & Hashes** | [`receipts_and_hashes.json`](receipts_and_hashes.json) | Transaction hashes, gas used, effective gas prices, block numbers, and SHA-256 hashes |
| **Verification Audit Log** | [`verification_audit.json`](verification_audit.json) | Complete latency logs, tamper detection offsets, and pass/fail statuses |
| **Benchmark Summary JSON** | [`../../test_dataset/benchmark_summary.json`](../../test_dataset/benchmark_summary.json) | Consolidated JSON dataset for all 10 assets |
| **Synthetic 3D Models** | [`../../test_dataset/`](../../test_dataset/) | 10 baseline GLBs (`asset_01.glb` to `asset_10.glb`) |
| **Altered 3D Models** | [`../../test_dataset/`](../../test_dataset/) | 10 altered GLBs (`asset_01_altered.glb` to `asset_10_altered.glb`) |
| **Signed Certificates** | [`../../test_dataset/`](../../test_dataset/) | 10 Ed25519-signed JSON certificates (`asset_01_certificate.json` to `asset_10_certificate.json`) |

---

## 4. On-Chain Transaction Receipts Summary

| Asset | Token ID | Local-Chain Tx Hash | Block | Gas Consumed | Gas Price | Modeled Fee (ETH) | Modeled USD (@ $3k/ETH) |
|---|---|---|---|---|---|---|---|
| `asset_01` | `#1` | `41200542feea0ae3...` | `2` | `333,359` | `1.7714 Gwei` | `0.00059052` | `$1.7716` |
| `asset_02` | `#2` | `c4fd397aad535c6a...` | `3` | `316,259` | `1.6761 Gwei` | `0.00053007` | `$1.5902` |
| `asset_03` | `#3` | `f5c8ecbdf2da9609...` | `4` | `316,259` | `1.5924 Gwei` | `0.00050363` | `$1.5109` |
| `asset_04` | `#4` | `c64fcc54c7cfee02...` | `5` | `316,259` | `1.5192 Gwei` | `0.00048045` | `$1.4413` |
| `asset_05` | `#5` | `1e3329504509a65f...` | `6` | `316,259` | `1.455 Gwei` | `0.00046014` | `$1.3804` |
| `asset_06` | `#6` | `ab085f2b98f50a10...` | `7` | `316,259` | `1.3987 Gwei` | `0.00044235` | `$1.3271` |
| `asset_07` | `#7` | `4ea5d5f89a244f56...` | `8` | `316,259` | `1.3494 Gwei` | `0.00042675` | `$1.2802` |
| `asset_08` | `#8` | `a7cf6d6461a991ae...` | `9` | `316,259` | `1.3062 Gwei` | `0.00041309` | `$1.2393` |
| `asset_09` | `#9` | `bc4ce5cd31965240...` | `10` | `316,259` | `1.2683 Gwei` | `0.00040111` | `$1.2033` |
| `asset_10` | `#10` | `025f9adca0d5ee09...` | `11` | `316,259` | `1.2351 Gwei` | `0.00039062` | `$1.1719` |

- **Total Gas Consumed**: `3,179,690 units`
- **Average Gas Per Mint**: `317,969 units`
- **Total Modeled Fee**: `0.00463873 ETH` (~`$13.92 USD`)
