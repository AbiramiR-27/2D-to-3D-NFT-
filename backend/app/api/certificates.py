import json
import logging
from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

from app.models.schemas import (
    SignedCertificate,
    VerifyCertificateRequest,
    VerifyCertificateResult,
    VerifyAssetIntegrityResult,
)
from app.services.provenance_service import provenance_service
from app.security.keys import key_manager
from app.storage.local_store import local_store

router = APIRouter(prefix="/certificates", tags=["Provenance Certificates"])
logger = logging.getLogger("api.certificates")

class GenerateCertRequest(BaseModel):
    asset_id: str

@router.post("/generate", response_model=SignedCertificate, status_code=status.HTTP_201_CREATED)
def generate_provenance_certificate(req: GenerateCertRequest):
    """
    Step 4: Generate Conventional Signed Provenance Certificate.
    Calculates exact model file bytes SHA-256, generates canonical JSON payload,
    and signs it with Ed25519 private key.
    """
    try:
        cert = provenance_service.generate_certificate_for_asset(req.asset_id)
        return cert
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating certificate: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate certificate: {str(e)}")

@router.get("/public-key")
def get_public_verification_key():
    """
    Returns the server's public key for signature verification,
    along with clear documentation on why and how the key is trusted.
    """
    pem = key_manager.get_public_key_pem()
    return {
        "key_id": key_manager.key_id,
        "algorithm": "Ed25519",
        "public_key_pem": pem,
        "is_development_key": key_manager.is_dev_key,
        "security_advisory": (
            "This public key belongs to the local development environment. "
            "In production, public keys are distributed out-of-band via trusted key registries, "
            "DNSSEC, or PKI, rather than implicitly trusted from third-party certificates."
        )
    }

@router.get("/{certificate_id}")
def get_certificate(certificate_id: str, download: bool = False):
    cert = local_store.get_certificate(certificate_id)
    if not cert:
        raise HTTPException(status_code=404, detail=f"Certificate '{certificate_id}' not found.")

    cert_json = {
        "certificate_id": cert["certificate_id"],
        "payload": cert["payload"],
        "signature_hex": cert["signature_hex"],
        "public_key_pem": cert["public_key_pem"],
        "created_at": cert["created_at"],
    }

    if download:
        content = json.dumps(cert_json, indent=2)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={certificate_id}.json"}
        )

    return cert_json

@router.post("/verify", response_model=VerifyCertificateResult)
def verify_certificate_json(req: VerifyCertificateRequest):
    """
    Option A: Verify certificate signature and structure.
    Checks whether the canonical payload matches the Ed25519 digital signature.
    """
    return provenance_service.verify_certificate_payload(req.certificate)

@router.post("/verify-asset", response_model=VerifyAssetIntegrityResult)
async def verify_asset_integrity_multipart(
    certificate_file: UploadFile = File(...),
    model_file: UploadFile = File(...),
    trusted_public_key: Optional[str] = Form(default=None)
):
    """
    Option B: Verify asset integrity.
    Accepts the certificate JSON file and the 3D model file (.glb).
    Calculates uploaded model's SHA-256 hash and compares with signed certificate hash.
    Detects if model has changed by even one byte!
    """
    try:
        cert_bytes = await certificate_file.read()
        cert_dict = json.loads(cert_bytes.decode("utf-8"))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uploaded certificate is not a valid JSON document: {str(e)}"
        )

    try:
        model_bytes = await model_file.read()
        if not model_bytes:
            raise HTTPException(status_code=400, detail="Uploaded model file is empty.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read model file: {str(e)}")

    result = provenance_service.verify_asset_integrity(
        cert_dict=cert_dict,
        model_file_bytes=model_bytes,
        trusted_public_key_pem=trusted_public_key
    )
    return result
