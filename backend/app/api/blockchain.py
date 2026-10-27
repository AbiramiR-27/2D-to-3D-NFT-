import logging
from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.config import settings
from app.services.nft_service import nft_service
from app.models.schemas import MintNFTRequest, MintNFTResult
from app.storage.local_store import local_store

router = APIRouter(prefix="/blockchain", tags=["Blockchain NFT Minting"])
logger = logging.getLogger("api.blockchain")

class RecordMintRequest(BaseModel):
    asset_id: str
    transaction_hash: str
    token_id: int
    contract_address: str
    recipient: str

@router.get("/status")
def get_blockchain_status():
    """Returns local or remote blockchain connection status."""
    is_connected = nft_service.is_blockchain_available()
    deployed_info = nft_service.get_deployed_contract_info()
    return {
        "is_available": is_connected,
        "rpc_url": settings.BLOCKCHAIN_RPC_URL,
        "target_chain_id": settings.CHAIN_ID,
        "contract_deployed": deployed_info is not None,
        "contract_address": deployed_info.get("address") if deployed_info else None,
        "message": (
            "Blockchain node connected and responsive."
            if is_connected
            else "Blockchain node is currently offline or unreachable. "
                 "Run 'npx hardhat node' in the blockchain directory for local demonstration. "
                 "Note: Provenance certificate generation and verification operate independently of blockchain availability."
        )
    }

@router.get("/contract-info")
def get_contract_info():
    """Returns ABI and deployment address for frontend ethers.js interaction."""
    deployed_info = nft_service.get_deployed_contract_info()
    if not deployed_info:
        raise HTTPException(
            status_code=404,
            detail="Contract deployment info not found. Please deploy the contract first via 'npm run deploy'."
        )
    return deployed_info

@router.get("/nft-metadata/{asset_id}")
def get_nft_metadata(asset_id: str):
    """
    Standard ERC-721 token metadata JSON endpoint referenced by tokenURI.
    Contains asset attributes, cryptographic model hash, and certificate references.
    """
    try:
        metadata = nft_service.generate_token_metadata(asset_id)
        return metadata
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/mint-local", response_model=MintNFTResult)
def mint_nft_local(req: MintNFTRequest):
    """
    Step 5: Optional NFT Minting.
    Executes a real transaction against the running Hardhat local node using account #0.
    """
    try:
        result = nft_service.mint_nft_local(
            asset_id=req.asset_id,
            recipient_address=req.recipient_address
        )
        return MintNFTResult(**result)
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Mint error: {e}")
        raise HTTPException(status_code=500, detail=f"Blockchain transaction failed: {str(e)}")

@router.post("/record-mint")
def record_frontend_mint(req: RecordMintRequest):
    """
    Records a successful mint executed by the user via MetaMask in the frontend.
    """
    asset = local_store.get_asset(req.asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found.")

    local_store.update_asset(req.asset_id, {
        "nft_token_id": req.token_id,
        "nft_tx_hash": req.transaction_hash,
        "nft_contract_address": req.contract_address,
    })
    return {"status": "SUCCESS", "message": "Asset record updated with on-chain NFT transaction."}
