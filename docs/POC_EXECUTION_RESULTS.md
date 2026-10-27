# Proof-of-Concept (PoC) Benchmark Execution & Test Report

> **Project**: AI-Based 2D to 3D NFT Creation & Cryptographic Provenance Platform  
> **Evaluation Phase**: School of Innovation (SoI) — Phase 2  
> **Execution Date**: 2026-10-27T09:53:49Z  
> **Blockchain Network**: **Local Development Chain (Hardhat EVM, Chain ID 31337) — Local-Chain PoC**  
> **Smart Contract**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`  
> **Raw Evidence Dossier**: [`docs/evidence/`](evidence/) (Contains `receipts_and_hashes.json`, `verification_audit.json`)  

---

> [!IMPORTANT]
> ### 1. Blockchain Network Classification & Zero-Cost Disclaimer
> **Mandatory Evaluation Clarification**:
> - **Network Type**: All on-chain transactions, gas metrics, and token mints reported in this document were executed on a **local Hardhat development node (Chain ID: 31337)** running locally at `http://127.0.0.1:8545`.
> - **Local-Chain PoC**: This is a **local-chain Proof of Concept**, NOT a public testnet experiment (such as Ethereum Sepolia, Holesky, or Goerli).
> - **Zero Financial Cost**: The local Hardhat development network incurs **zero real-world financial cost**. Simulated test accounts (funded with local test ETH) were utilized.
> - **Theoretical Economic Modeling**: The USD cost estimates reported below (e.g. ~$1.39 per mint, $13.92 cumulative total) are **theoretical economic projections** calculated assuming an illustrative benchmark exchange rate of **$3,000 / ETH**. These figures are provided solely to demonstrate smart contract gas efficiency and do **not** represent proof of actual fiat or cryptocurrency disbursement.

---

## 2. Quality Scorecard & Verification Summary

| Metric | Result | Target / Requirement | Status |
|---|---|---|---|
| **Total Test Files Evaluated** | `10 Original + 10 Altered` | 10 GLBs + 10 Altered | **COMPLIANT** |
| **Unchanged Files Verified** | `10 / 10 (100%)` | 100% | **PASSED** |
| **Altered Files Detected** | `10 / 10 (100%)` | 100% | **PASSED** |
| **Local vs On-Chain Hash Agreement** | `10 / 10 (100%)` | 100% | **PASSED** |
| **False Mismatches** | `0` | 0 | **ZERO DEFECT** |
| **Failures & Retests** | `0 Failures, 0 Retests` | 0 | **STABLE** |
| **Overall Accuracy** | `100.0%` | 100% | **EXCELLENT** |

---

## 3. Local-Record versus Local-Chain On-Chain Hash-Record Comparison

This table compares the **Local Signed Provenance Certificate Payload** (`model_sha256`) against the **On-Chain Record Stored in the Smart Contract** (`ArtProvenanceNFT.getProvenanceRecord(tokenId)`):

| Asset ID | Token ID | Model File Size | Local Certificate Signed SHA-256 | Local-Chain On-Chain Stored SHA-256 | Agreement | Status |
|---|---|---|---|---|---|---|
| `asset_01` | `#1` | 484,692 B | `ecc112cd26066971...` | `ecc112cd26066971...` | **EXACT MATCH** | **VERIFIED** |
| `asset_02` | `#2` | 478,140 B | `1054e2d4d55dc6ad...` | `1054e2d4d55dc6ad...` | **EXACT MATCH** | **VERIFIED** |
| `asset_03` | `#3` | 483,064 B | `cda7f01fd7d48b2c...` | `cda7f01fd7d48b2c...` | **EXACT MATCH** | **VERIFIED** |
| `asset_04` | `#4` | 488,000 B | `27eef55e5ce530bd...` | `27eef55e5ce530bd...` | **EXACT MATCH** | **VERIFIED** |
| `asset_05` | `#5` | 484,944 B | `876b56a62f6ca57a...` | `876b56a62f6ca57a...` | **EXACT MATCH** | **VERIFIED** |
| `asset_06` | `#6` | 481,844 B | `9e389e26c6a7c92e...` | `9e389e26c6a7c92e...` | **EXACT MATCH** | **VERIFIED** |
| `asset_07` | `#7` | 478,100 B | `f2358a6c6b85fe5e...` | `f2358a6c6b85fe5e...` | **EXACT MATCH** | **VERIFIED** |
| `asset_08` | `#8` | 489,940 B | `e9ba86ebb3809a7a...` | `e9ba86ebb3809a7a...` | **EXACT MATCH** | **VERIFIED** |
| `asset_09` | `#9` | 483,276 B | `1b09c0950852c336...` | `1b09c0950852c336...` | **EXACT MATCH** | **VERIFIED** |
| `asset_10` | `#10` | 480,444 B | `f83526545e775ad0...` | `f83526545e775ad0...` | **EXACT MATCH** | **VERIFIED** |

---

## 4. Tamper Detection & Integrity Verification Table

Each altered file was created by modifying a single byte in the binary GLB payload at varying byte offsets (from offset 74 to offset 164). The cryptographic verification engine detected 100% of the altered copies:

| File Pair | Original File SHA-256 | Altered File SHA-256 (1-Byte Modification) | Original File Verification | Altered File Detection | Tamper Offset |
|---|---|---|---|---|---|
| `asset_01` | `ecc112cd26066971...` | `98c694fbdff403e1...` | `PASSED (VERIFIED_AUTHENTIC)` | `DETECTED (ASSET_MODIFIED)` | Byte Offset 74 |
| `asset_02` | `1054e2d4d55dc6ad...` | `3fb4b2f09d73eb4b...` | `PASSED (VERIFIED_AUTHENTIC)` | `DETECTED (ASSET_MODIFIED)` | Byte Offset 84 |
| `asset_03` | `cda7f01fd7d48b2c...` | `ab4f10cee9e9b2f8...` | `PASSED (VERIFIED_AUTHENTIC)` | `DETECTED (ASSET_MODIFIED)` | Byte Offset 94 |
| `asset_04` | `27eef55e5ce530bd...` | `701439908e79134c...` | `PASSED (VERIFIED_AUTHENTIC)` | `DETECTED (ASSET_MODIFIED)` | Byte Offset 104 |
| `asset_05` | `876b56a62f6ca57a...` | `fa4d7ec97383608b...` | `PASSED (VERIFIED_AUTHENTIC)` | `DETECTED (ASSET_MODIFIED)` | Byte Offset 114 |
| `asset_06` | `9e389e26c6a7c92e...` | `ceecbb9e12806d68...` | `PASSED (VERIFIED_AUTHENTIC)` | `DETECTED (ASSET_MODIFIED)` | Byte Offset 124 |
| `asset_07` | `f2358a6c6b85fe5e...` | `503eb37c9cb2b1bf...` | `PASSED (VERIFIED_AUTHENTIC)` | `DETECTED (ASSET_MODIFIED)` | Byte Offset 134 |
| `asset_08` | `e9ba86ebb3809a7a...` | `467241e7d1be17e7...` | `PASSED (VERIFIED_AUTHENTIC)` | `DETECTED (ASSET_MODIFIED)` | Byte Offset 144 |
| `asset_09` | `1b09c0950852c336...` | `9a83574c9718387c...` | `PASSED (VERIFIED_AUTHENTIC)` | `DETECTED (ASSET_MODIFIED)` | Byte Offset 154 |
| `asset_10` | `f83526545e775ad0...` | `a3408e92c82a25c5...` | `PASSED (VERIFIED_AUTHENTIC)` | `DETECTED (ASSET_MODIFIED)` | Byte Offset 164 |

---

## 5. Measured Timings and Gas Metrics (Direct From Raw Logs)

### 5.1. Verification Latency Benchmark (Measured with `time.perf_counter`)

| Evaluation Operation | Average Latency | Minimum Latency | Maximum Latency | Observation |
|---|---|---|---|---|
| **Original Model Verification** | **`9.44 ms`** | `7.38 ms` (`asset_09`) | `12.28 ms` (`asset_10`) | Instantaneous client/server validation |
| **Altered Model Verification** | **`8.28 ms`** | `5.54 ms` (`asset_09`) | `10.51 ms` (`asset_10`) | Immediate hash discrepancy detection |
| **On-Chain Minting Execution** | **`32.51 ms`** | `27.09 ms` (`asset_04`) | `40.59 ms` (`asset_01`) | Sub-50ms local node block inclusion |

### 5.2. Local-Chain Smart Contract Gas & Simulated Fee Analysis

- **Total Cumulative Gas Consumed**: `3,179,690 gas units`
- **Average Gas Consumed Per Mint**: `317,969 gas units`
  - *Initial Mint (`Token #1`)*: `333,359 gas units` (includes first-time storage slot allocations)
  - *Subsequent Mints (`Tokens #2-#10`)*: `316,259 gas units` (steady-state ERC-721 minting)
- **Total Simulated Fee**: `0.00463873 ETH`
- **Average Simulated Fee Per Mint**: `0.00046387 ETH`
- **Theoretical Projected USD Cost (@ $3,000/ETH)**: `$13.9162 USD` (Average ~$1.39/mint)

| Asset | Token ID | Local-Chain Tx Hash | Block # | Gas Used | Gas Price | Modeled Fee (ETH) | Modeled USD (@ $3k) |
|---|---|---|---|---|---|---|---|
| `asset_01` | `#1` | `41200542feea0ae30b88...` | 2 | 333,359 | 1.7714 Gwei | 0.00059052 ETH | $1.7716 |
| `asset_02` | `#2` | `c4fd397aad535c6a277d...` | 3 | 316,259 | 1.6761 Gwei | 0.00053007 ETH | $1.5902 |
| `asset_03` | `#3` | `f5c8ecbdf2da96096431...` | 4 | 316,259 | 1.5924 Gwei | 0.00050363 ETH | $1.5109 |
| `asset_04` | `#4` | `c64fcc54c7cfee0225e8...` | 5 | 316,259 | 1.5192 Gwei | 0.00048045 ETH | $1.4414 |
| `asset_05` | `#5` | `1e3329504509a65fd31f...` | 6 | 316,259 | 1.4550 Gwei | 0.00046014 ETH | $1.3804 |
| `asset_06` | `#6` | `ab085f2b98f50a103013...` | 7 | 316,259 | 1.3987 Gwei | 0.00044235 ETH | $1.3271 |
| `asset_07` | `#7` | `4ea5d5f89a244f565ce0...` | 8 | 316,259 | 1.3494 Gwei | 0.00042675 ETH | $1.2803 |
| `asset_08` | `#8` | `a7cf6d6461a991ae5354...` | 9 | 316,259 | 1.3062 Gwei | 0.00041309 ETH | $1.2393 |
| `asset_09` | `#9` | `bc4ce5cd31965240c3ba...` | 10 | 316,259 | 1.2683 Gwei | 0.00040111 ETH | $1.2033 |
| `asset_10` | `#10` | `025f9adca0d5ee09a3e2...` | 11 | 316,259 | 1.2351 Gwei | 0.00039062 ETH | $1.1719 |

---

## 6. Location of Evidence Files

All underlying raw logs, cryptographic signatures, JSON payloads, and receipts have been systematically preserved in the evidence repository:

1. **Receipts and Hashes**: [`docs/evidence/receipts_and_hashes.json`](evidence/receipts_and_hashes.json)
2. **Verification Audit Log**: [`docs/evidence/verification_audit.json`](evidence/verification_audit.json)
3. **Consolidated Benchmark Summary**: [`test_dataset/benchmark_summary.json`](../test_dataset/benchmark_summary.json)
4. **Baseline Synthetic 3D GLBs**: [`test_dataset/`](../test_dataset/) (`asset_01.glb` through `asset_10.glb`)
5. **Altered 3D GLBs**: [`test_dataset/`](../test_dataset/) (`asset_01_altered.glb` through `asset_10_altered.glb`)
6. **Signed Provenance Certificates**: [`test_dataset/`](../test_dataset/) (`asset_01_certificate.json` through `asset_10_certificate.json`)