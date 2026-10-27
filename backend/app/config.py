import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Based 2D to 3D NFT Creation & Cryptographic Provenance Platform"
    API_PREFIX: str = "/api"
    
    # Storage paths
    DATA_DIR: Path = BASE_DIR / "data"
    UPLOADS_DIR: Path = BASE_DIR / "data" / "uploads"
    MODELS_DIR: Path = BASE_DIR / "data" / "models"
    CERTIFICATES_DIR: Path = BASE_DIR / "data" / "certificates"
    KEYS_DIR: Path = BASE_DIR / "keys"
    DB_PATH: Path = BASE_DIR / "data" / "soi_platform.db"
    
    # Upload limits
    MAX_UPLOAD_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    ALLOWED_IMAGE_EXTENSIONS: set = {".png", ".jpg", ".jpeg", ".webp"}
    
    # Key settings
    KEY_NAME: str = "dev_ed25519"
    KEY_ID: str = "urn:soi:key:ed25519:dev-01"
    
    # 3D Generator Settings
    MESHY_API_KEY: str = os.getenv("MESHY_API_KEY", "")
    TRIPO3D_API_KEY: str = os.getenv("TRIPO3D_API_KEY", "")
    DEFAULT_GENERATION_MODE: str = "demo"  # 'demo' or 'api'
    
    # Blockchain settings
    BLOCKCHAIN_RPC_URL: str = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")
    CHAIN_ID: int = int(os.getenv("CHAIN_ID", "31337"))
    CONTRACT_ADDRESS: str = os.getenv("CONTRACT_ADDRESS", "")
    DEPLOYER_PRIVATE_KEY: str = os.getenv("DEPLOYER_PRIVATE_KEY", "")
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
for path in [settings.UPLOADS_DIR, settings.MODELS_DIR, settings.CERTIFICATES_DIR, settings.KEYS_DIR]:
    path.mkdir(parents=True, exist_ok=True)
