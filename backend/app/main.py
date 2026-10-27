import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.api.assets import router as assets_router
from app.api.certificates import router as certificates_router
from app.api.blockchain import router as blockchain_router
from app.models.schemas import SystemHealth
from app.security.keys import key_manager
from app.services.nft_service import nft_service
from app.storage.local_store import local_store

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("soi.platform")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "School of Innovation (SoI) Phase 2 POC Platform: "
        "AI-Based 2D to 3D NFT Creation and Blockchain Minting Platform with Cryptographic Provenance. "
        "Demonstrates 2D artwork upload, procedural/AI 3D generation, interactive 3D preview, "
        "Ed25519-signed provenance certificates, byte-level integrity verification, and optional ERC-721 NFT minting."
    ),
    version="1.0.0",
)

# Configure CORS explicitly
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],  # Allow all for POC demo flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(assets_router, prefix=settings.API_PREFIX)
app.include_router(certificates_router, prefix=settings.API_PREFIX)
app.include_router(blockchain_router, prefix=settings.API_PREFIX)

@app.get("/api/health", response_model=SystemHealth, tags=["System Health"])
def system_health_check():
    """
    Health check endpoint reporting backend state, signing key status,
    and optional blockchain connection.
    """
    is_bc_connected = nft_service.is_blockchain_available()
    deployed_info = nft_service.get_deployed_contract_info()
    
    return SystemHealth(
        status="HEALTHY",
        version="1.0.0",
        key_configured=True,
        key_id=key_manager.key_id,
        is_dev_key=key_manager.is_dev_key,
        blockchain_available=is_bc_connected,
        blockchain_rpc=settings.BLOCKCHAIN_RPC_URL,
        chain_id=settings.CHAIN_ID if is_bc_connected else None,
        contract_address=deployed_info.get("address") if deployed_info else None,
        total_assets=local_store.count_assets(),
        total_certificates=local_store.count_certificates(),
    )

@app.get("/", tags=["Root"])
def root_status():
    return {
        "project": settings.PROJECT_NAME,
        "status": "online",
        "docs_url": "/docs",
        "api_health": "/api/health",
        "provenance_concept": "I02 - Conventional Signed Certificate",
    }
