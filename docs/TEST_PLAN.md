# Proof of Concept (POC) Test Plan & Execution Report

## Overview
This document specifies the validation plan for the 10 core Proof-of-Concept evaluation scenarios defined in Prompt Section 7. All tests have been implemented and validated using automated test runners (**pytest** for backend and **Hardhat** for blockchain), as well as interactive browser demonstrations.

---

## Summary of Executed Test Scenarios

| Test # | Scenario Description | Test Method | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| **Test 1** | **Valid certificate** | Pytest & Web UI | Ed25519 signature valid against canonical payload | Signature verified cryptographically | **PASSED** |
| **Test 2** | **Untampered model** | Pytest & Web UI | Model SHA-256 matches signed certificate hash | Exact match (0 byte discrepancy) | **PASSED** |
| **Test 3** | **Modified model** | Pytest & Web UI | 1-byte alteration detected; hash mismatch | Discrepancy caught immediately | **PASSED** |
| **Test 4** | **Modified certificate** | Pytest & Web UI | Altering creator name fails signature check | Signature verification rejected | **PASSED** |
| **Test 5** | **Missing/malformed cert** | Pytest & Web UI | Validation error with helpful diagnostic message | Error code 400 & status 'MALFORMED' | **PASSED** |
| **Test 6** | **3D generation failure** | Pytest & Web UI | Missing API key throws transparent diagnostic error | Clear ValueError; guidance to demo generator | **PASSED** |
| **Test 7** | **Blockchain unavailable** | Pytest & Web UI | Cert issuance & verification work 100% offline | Full decoupling confirmed | **PASSED** |
| **Test 8** | **Successful local NFT mint** | Hardhat & Web3 | Smart contract emits token, stores hash & cert ID | Token #1 minted on Hardhat node | **PASSED** |
| **Test 9** | **Unauthorized/invalid mint** | Hardhat & Web3 | Rejection of zero address, empty URI, bad hash | EVM revert with exact revert strings | **PASSED** |
| **Test 10** | **Repeatability check** | Pytest & Web UI | 5/5 verification loops produce identical results | 100% deterministic consistency | **PASSED** |

> [!TIP]
> For the complete 10-file benchmark dataset, local-record vs testnet-record comparison, verification timings, and gas fee analysis, see [POC_EXECUTION_RESULTS.md](POC_EXECUTION_RESULTS.md).

---

## Automated Test Commands

### 1. Backend Cryptographic & Functional Test Suite (Pytest)
```bash
cd backend
python -m pytest app/tests/test_poc_scenarios.py -v
```
**Output Summary**:
```
collected 10 items
app/tests/test_poc_scenarios.py::test_health_endpoint PASSED             [ 10%]
app/tests/test_poc_scenarios.py::test_1_valid_certificate PASSED         [ 20%]
app/tests/test_poc_scenarios.py::test_2_untampered_model PASSED          [ 30%]
app/tests/test_poc_scenarios.py::test_3_modified_model PASSED            [ 40%]
app/tests/test_poc_scenarios.py::test_4_modified_certificate PASSED      [ 50%]
app/tests/test_poc_scenarios.py::test_5_missing_or_malformed_certificate PASSED [ 60%]
app/tests/test_poc_scenarios.py::test_6_3d_generation_failure PASSED     [ 70%]
app/tests/test_poc_scenarios.py::test_7_blockchain_unavailable PASSED    [ 80%]
app/tests/test_poc_scenarios.py::test_8_and_9_mint_validation PASSED     [ 90%]
app/tests/test_poc_scenarios.py::test_10_repeatability PASSED            [100%]
======================= 10 passed in 27.88s =======================
```

### 2. Smart Contract ERC-721 Test Suite (Hardhat)
```bash
cd blockchain
npx hardhat test
```
**Output Summary**:
```
  ArtProvenanceNFT Contract Tests
    √ should deploy with proper name and symbol
    √ Test 8 - Successful local NFT mint and event emission
    √ Test 9 - Unauthorized or invalid mint request rejections
    √ should allow transferring minted NFT between accounts

  4 passing (903ms)
```

### 3. Interactive Browser Test Suite
Launch the platform and navigate to the **POC Test Suite** tab in the web application. Click **"Run All 10 Test Scenarios"** to execute live API calls with real-time pass/fail indicators and timing metrics.
