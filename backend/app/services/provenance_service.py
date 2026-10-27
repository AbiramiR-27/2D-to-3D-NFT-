import hashlib
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import uuid

from app.security.keys import key_manager
from app.models.schemas import (
    CanonicalCertificatePayload,
    SignedCertificate,
    VerifyCertificateResult,
    VerifyAssetIntegrityResult,
)
from app.storage.local_store import local_store

logger = logging.getLogger("provenance.service")

class ProvenanceService:
    """
    Implements Concept I02 — Conventional Signed Provenance Certificate.
    Signs canonical JSON metadata binding the exact SHA-256 hash of 3D asset model bytes to the creator,
    and provides deterministic signature and integrity verification.
    """
    def __init__(self):
        self.key_manager = key_manager
        self.store = local_store

    @staticmethod
    def calculate_file_sha256(file_path: Path) -> str:
        """Computes SHA-256 digest of exact file bytes."""
        hasher = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        return hasher.hexdigest().lower()

    @staticmethod
    def calculate_bytes_sha256(data: bytes) -> str:
        """Computes SHA-256 digest of arbitrary byte array."""
        return hashlib.sha256(data).hexdigest().lower()

    def generate_certificate_for_asset(self, asset_id: str) -> SignedCertificate:
        """
        Generates and signs a provenance certificate for an existing finalized 3D asset.
        """
        asset = self.store.get_asset(asset_id)
        if not asset:
            raise ValueError(f"Asset with ID '{asset_id}' does not exist.")

        if not asset.get("model_path") or not Path(asset["model_path"]).exists():
            raise ValueError(f"3D Model for asset '{asset_id}' has not been generated or file is missing.")

        model_path = Path(asset["model_path"])
        
        # 1. Read exact bytes & calculate SHA-256
        model_sha256 = self.calculate_file_sha256(model_path)
        
        # If asset record didn't have hash or it differed, update it
        if asset.get("model_sha256") != model_sha256:
            self.store.update_asset(asset_id, {"model_sha256": model_sha256})

        # 2. Build Certificate ID & Canonical Payload
        cert_id = f"cert_{uuid.uuid4().hex[:12]}"
        now_utc = datetime.now(timezone.utc).isoformat()

        payload = CanonicalCertificatePayload(
            certificate_id=cert_id,
            asset_id=asset["asset_id"],
            asset_title=asset.get("title", "Untitled Artwork"),
            creator_display_name=asset.get("creator_name", "Anonymous Creator"),
            model_filename=asset.get("model_filename", model_path.name),
            model_format=asset.get("model_format", "glb"),
            model_sha256=model_sha256,
            issue_timestamp=now_utc,
            certificate_version="1.0",
            signature_algorithm="Ed25519",
            public_key_id=self.key_manager.key_id,
        )

        payload_dict = payload.model_dump()

        # 3. Cryptographically sign canonical payload representation
        signature_hex = self.key_manager.sign_payload(payload_dict)
        public_key_pem = self.key_manager.get_public_key_pem()

        # 4. Persist certificate
        self.store.save_certificate(
            certificate_id=cert_id,
            asset_id=asset_id,
            payload=payload_dict,
            signature_hex=signature_hex,
            public_key_pem=public_key_pem
        )

        logger.info(f"Generated signed provenance certificate '{cert_id}' for asset '{asset_id}'")

        return SignedCertificate(
            certificate_id=cert_id,
            payload=payload,
            signature_hex=signature_hex,
            public_key_pem=public_key_pem,
            is_development_key=True
        )

    def verify_certificate_payload(
        self,
        cert_dict: Dict[str, Any],
        trusted_public_key_pem: Optional[str] = None
    ) -> VerifyCertificateResult:
        """
        Option A: Verify certificate signature and structure.
        Uses trusted_public_key_pem if supplied, else uses the backend's known public key.
        """
        try:
            # 1. Structural validation
            if not isinstance(cert_dict, dict):
                return VerifyCertificateResult(
                    is_valid_signature=False,
                    status="MALFORMED",
                    message="Certificate is not a valid JSON object."
                )

            payload = cert_dict.get("payload")
            signature_hex = cert_dict.get("signature_hex")

            if not payload or not isinstance(payload, dict):
                return VerifyCertificateResult(
                    is_valid_signature=False,
                    status="MALFORMED",
                    message="Missing or malformed 'payload' object in certificate."
                )

            if not signature_hex or not isinstance(signature_hex, str):
                return VerifyCertificateResult(
                    is_valid_signature=False,
                    status="MALFORMED",
                    message="Missing or invalid 'signature_hex' field in certificate."
                )

            # Check essential canonical payload fields
            required_fields = [
                "certificate_id", "asset_id", "asset_title", "creator_display_name",
                "model_filename", "model_format", "model_sha256", "issue_timestamp",
                "certificate_version", "signature_algorithm", "public_key_id"
            ]
            missing_fields = [f for f in required_fields if f not in payload]
            if missing_fields:
                return VerifyCertificateResult(
                    is_valid_signature=False,
                    status="MALFORMED",
                    message=f"Certificate payload is missing required fields: {', '.join(missing_fields)}"
                )

            # Key resolution:
            # Security rule: Do not blindly trust public key provided in an untrusted certificate file.
            # We compare with server's trusted public key or explicit trusted key input.
            server_key_pem = self.key_manager.get_public_key_pem()
            key_to_use = trusted_public_key_pem or server_key_pem

            is_valid = self.key_manager.verify_signature(
                payload=payload,
                signature_hex=signature_hex,
                trusted_public_key_pem=key_to_use
            )

            if is_valid:
                return VerifyCertificateResult(
                    is_valid_signature=True,
                    status="VALID",
                    message="Certificate signature is cryptographically VALID. Provenance payload is intact and authentic.",
                    certificate_id=payload.get("certificate_id"),
                    asset_id=payload.get("asset_id"),
                    model_sha256=payload.get("model_sha256"),
                    payload=payload,
                    public_key_id=payload.get("public_key_id")
                )
            else:
                return VerifyCertificateResult(
                    is_valid_signature=False,
                    status="TAMPERED",
                    message="Signature verification FAILED. The certificate payload has been modified, tampered with, or signed by an unrecognized key.",
                    certificate_id=payload.get("certificate_id"),
                    asset_id=payload.get("asset_id"),
                    model_sha256=payload.get("model_sha256"),
                    payload=payload,
                    public_key_id=payload.get("public_key_id")
                )

        except Exception as e:
            logger.error(f"Error during certificate verification: {e}")
            return VerifyCertificateResult(
                is_valid_signature=False,
                status="ERROR",
                message=f"Validation failed due to error: {str(e)}"
            )

    def verify_asset_integrity(
        self,
        cert_dict: Dict[str, Any],
        model_file_bytes: bytes,
        trusted_public_key_pem: Optional[str] = None
    ) -> VerifyAssetIntegrityResult:
        """
        Option B: Verify asset integrity.
        Verifies both:
        1. That the certificate signature itself is valid.
        2. That the SHA-256 of the provided model file bytes matches the signed hash exactly.
        """
        # Step 1: Verify certificate signature
        cert_result = self.verify_certificate_payload(cert_dict, trusted_public_key_pem)
        
        # Step 2: Compute SHA-256 of uploaded model bytes
        calculated_hash = self.calculate_bytes_sha256(model_file_bytes)
        
        payload = cert_dict.get("payload", {}) if isinstance(cert_dict, dict) else {}
        expected_hash = payload.get("model_sha256", "").lower()

        hash_matches = (calculated_hash == expected_hash) and (len(expected_hash) == 64)
        overall_valid = cert_result.is_valid_signature and hash_matches

        if not cert_result.is_valid_signature:
            status = "SIGNATURE_INVALID"
            message = "Verification failed: Certificate signature is invalid or tampered with."
            details = "The certificate metadata cannot be trusted because cryptographic signature verification failed."
        elif not hash_matches:
            status = "ASSET_MODIFIED"
            message = "Verification failed: 3D Model hash DOES NOT MATCH certificate. Asset has been altered or replaced."
            details = (
                f"Byte-level mismatch detected! "
                f"Expected SHA-256 (from signed certificate): {expected_hash} | "
                f"Actual SHA-256 (from uploaded file): {calculated_hash}"
            )
        else:
            status = "VERIFIED_AUTHENTIC"
            message = "Verification SUCCESS: Digital signature is valid and 3D asset bytes match the signed hash bit-for-bit."
            details = f"Cryptographic integrity confirmed. Model SHA-256: {calculated_hash}"

        return VerifyAssetIntegrityResult(
            certificate_signature_valid=cert_result.is_valid_signature,
            asset_hash_matches=hash_matches,
            expected_hash=expected_hash,
            calculated_hash=calculated_hash,
            overall_valid=overall_valid,
            status=status,
            message=message,
            byte_discrepancy_details=details
        )

provenance_service = ProvenanceService()
