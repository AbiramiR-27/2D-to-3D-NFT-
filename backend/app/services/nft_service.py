import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional

from web3 import Web3

from app.config import settings
from app.storage.local_store import local_store

logger = logging.getLogger("nft.service")

class NFTService:
    """
    Manages ERC-721 NFT metadata generation and interaction with the ArtProvenanceNFT smart contract.
    Designed to work seamlessly both with frontend web3 wallets (MetaMask)
    and automated local Hardhat node execution.
    """
    def __init__(self):
        self.store = local_store
        self._w3: Optional[Web3] = None
        self._deployed_data: Optional[Dict[str, Any]] = None
        self._load_deployment_info()

    def _load_deployment_info(self):
        """Loads deployment metadata containing contract address and ABI."""
        deployed_path = settings.DATA_DIR / "deployed_contract.json"
        if deployed_path.exists():
            try:
                with open(deployed_path, "r", encoding="utf-8") as f:
                    self._deployed_data = json.load(f)
                    logger.info(f"Loaded deployed contract info at address {self._deployed_data.get('address')}")
            except Exception as e:
                logger.warning(f"Could not parse deployed_contract.json: {e}")

    def get_deployed_contract_info(self) -> Optional[Dict[str, Any]]:
        self._load_deployment_info()
        return self._deployed_data

    def get_web3_instance(self) -> Optional[Web3]:
        try:
            w3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL, request_kwargs={"timeout": 3}))
            if w3.is_connected():
                return w3
        except Exception:
            pass
        return None

    def is_blockchain_available(self) -> bool:
        w3 = self.get_web3_instance()
        return w3 is not None and w3.is_connected()

    def generate_token_metadata(self, asset_id: str, base_url: str = "http://127.0.0.1:8000") -> Dict[str, Any]:
        """
        Constructs standard ERC-721 JSON metadata linking asset, model hash, and signed certificate.
        """
        asset = self.store.get_asset(asset_id)
        if not asset:
            raise ValueError(f"Asset '{asset_id}' not found.")

        cert_id = asset.get("certificate_id")
        cert_data = self.store.get_certificate(cert_id) if cert_id else None

        metadata = {
            "name": asset.get("title", f"3D Artwork #{asset_id[:8]}"),
            "description": asset.get("description", "A 2D-to-3D digital asset with cryptographic provenance certificate."),
            "image": f"{base_url}/api/assets/{asset_id}/image",
            "animation_url": f"{base_url}/api/assets/{asset_id}/model",
            "external_url": f"{base_url}/assets/{asset_id}",
            "properties": {
                "asset_id": asset_id,
                "creator_display_name": asset.get("creator_name", "Anonymous"),
                "model_sha256": asset.get("model_sha256", ""),
                "model_format": asset.get("model_format", "glb"),
                "model_size_bytes": asset.get("model_size_bytes", 0),
                "certificate_id": cert_id,
                "certificate_url": f"{base_url}/api/certificates/{cert_id}" if cert_id else None,
                "provenance_standard": "Concept I02 - Signed Provenance Certificate",
                "signature_algorithm": "Ed25519",
                "creation_timestamp": asset.get("created_at"),
            },
            "attributes": [
                {"trait_type": "Generation Type", "value": asset.get("generation_method", "Procedural")},
                {"trait_type": "Provenance Certified", "value": "Yes" if cert_id else "No"},
                {"trait_type": "Model Hash", "value": asset.get("model_sha256", "N/A")[:16] + "..."},
            ]
        }
        return metadata

    def mint_nft_local(
        self,
        asset_id: str,
        recipient_address: str,
        base_url: str = "http://127.0.0.1:8000"
    ) -> Dict[str, Any]:
        """
        Directly executes an on-chain transaction against a local Hardhat node
        using deployer account (Account #0) if connected.
        """
        w3 = self.get_web3_instance()
        if not w3:
            raise ConnectionError(
                f"Cannot connect to blockchain at {settings.BLOCKCHAIN_RPC_URL}. "
                "Ensure local Hardhat node is running ('npx hardhat node')."
            )

        self._load_deployment_info()
        if not self._deployed_data or not self._deployed_data.get("address"):
            raise ValueError("Smart contract is not deployed. Please run 'npm run deploy' in blockchain folder.")

        contract_address = self._deployed_data["address"]
        contract_abi = self._deployed_data["abi"]

        asset = self.store.get_asset(asset_id)
        if not asset:
            raise ValueError(f"Asset '{asset_id}' not found.")

        if not asset.get("model_sha256"):
            raise ValueError("Asset does not have a 3D model SHA-256 hash yet.")

        if not asset.get("certificate_id"):
            raise ValueError("Asset must have a signed provenance certificate before NFT minting.")

        token_uri = f"{base_url}/api/blockchain/nft-metadata/{asset_id}"
        model_hash = asset["model_sha256"]
        cert_id = asset["certificate_id"]

        contract = w3.eth.contract(address=contract_address, abi=contract_abi)

        # Select signer: Hardhat node account #0
        accounts = w3.eth.accounts
        if not accounts:
            raise RuntimeError("No accounts available in connected Ethereum node.")
        signer = accounts[0]

        # Execute transaction
        tx_hash = contract.functions.mintAssetNFT(
            Web3.to_checksum_address(recipient_address),
            token_uri,
            asset_id,
            model_hash,
            cert_id
        ).transact({"from": signer, "gas": 500000})

        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        # Parse minted event for tokenId
        events = contract.events.AssetNFTMinted().process_receipt(receipt)
        token_id = events[0]["args"]["tokenId"] if events else 1

        tx_hex = tx_hash.hex()
        # Update local asset record
        self.store.update_asset(asset_id, {
            "nft_token_id": token_id,
            "nft_tx_hash": tx_hex,
            "nft_contract_address": contract_address
        })

        return {
            "success": True,
            "status": "MINTED",
            "transaction_hash": tx_hex,
            "token_id": token_id,
            "contract_address": contract_address,
            "recipient": recipient_address,
            "token_uri": token_uri,
            "block_number": receipt.blockNumber
        }

nft_service = NFTService()
