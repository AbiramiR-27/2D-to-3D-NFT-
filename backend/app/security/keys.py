import json
import logging
from pathlib import Path
from typing import Tuple, Dict, Any

from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from cryptography.exceptions import InvalidSignature

from app.config import settings

logger = logging.getLogger("provenance.keys")

class KeyManager:
    """
    Manages Ed25519 asymmetric cryptographic signing keys.
    Generates and persists a local development keypair if not present.
    Ensures deterministic canonical payload signing and signature verification.
    """
    def __init__(self, keys_dir: Path = settings.KEYS_DIR, key_name: str = settings.KEY_NAME):
        self.keys_dir = Path(keys_dir)
        self.keys_dir.mkdir(parents=True, exist_ok=True)
        self.private_key_path = self.keys_dir / f"{key_name}_private.pem"
        self.public_key_path = self.keys_dir / f"{key_name}_public.pem"
        self.key_id = settings.KEY_ID
        self.is_dev_key = True
        
        self._private_key: ed25519.Ed25519PrivateKey = None
        self._public_key: ed25519.Ed25519PublicKey = None
        
        self._load_or_generate_keys()

    def _load_or_generate_keys(self):
        """Loads existing PEM keys or generates a secure development Ed25519 pair."""
        if self.private_key_path.exists() and self.public_key_path.exists():
            try:
                with open(self.private_key_path, "rb") as f:
                    self._private_key = serialization.load_pem_private_key(f.read(), password=None)
                with open(self.public_key_path, "rb") as f:
                    self._public_key = serialization.load_pem_public_key(f.read())
                logger.info(f"Loaded existing Ed25519 keypair from {self.keys_dir}")
                return
            except Exception as e:
                logger.warning(f"Error loading existing keys: {e}. Regenerating dev keys...")

        # Generate new Ed25519 key pair
        self._private_key = ed25519.Ed25519PrivateKey.generate()
        self._public_key = self._private_key.public_key()

        # Save private key in PEM format (unencrypted for development POC with clear notice)
        pem_private = self._private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
        with open(self.private_key_path, "wb") as f:
            f.write(pem_private)

        # Save public key in PEM format
        pem_public = self._public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        with open(self.public_key_path, "wb") as f:
            f.write(pem_public)

        logger.info(f"Generated new Ed25519 dev keypair at {self.keys_dir}")

    def get_public_key_pem(self) -> str:
        """Returns the public key in PEM string format."""
        pem_bytes = self._public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        return pem_bytes.decode("utf-8")

    @staticmethod
    def canonicalize_json(payload: Dict[str, Any]) -> bytes:
        """
        Produces a canonical byte representation of a dictionary according to
        deterministic key sorting and compact separators (RFC 8785-aligned).
        """
        return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

    def sign_payload(self, payload: Dict[str, Any]) -> str:
        """
        Signs the canonical JSON representation of payload using the backend's Ed25519 private key.
        Returns the signature as a lowercase hexadecimal string.
        """
        canonical_bytes = self.canonicalize_json(payload)
        signature = self._private_key.sign(canonical_bytes)
        return signature.hex()

    def verify_signature(
        self,
        payload: Dict[str, Any],
        signature_hex: str,
        trusted_public_key_pem: str = None
    ) -> bool:
        """
        Verifies an Ed25519 signature against canonical payload bytes.
        If trusted_public_key_pem is provided, checks against it; otherwise uses the server's public key.
        """
        try:
            signature_bytes = bytes.fromhex(signature_hex)
            canonical_bytes = self.canonicalize_json(payload)

            if trusted_public_key_pem:
                public_key = serialization.load_pem_public_key(trusted_public_key_pem.encode("utf-8"))
            else:
                public_key = self._public_key

            public_key.verify(signature_bytes, canonical_bytes)
            return True
        except (InvalidSignature, ValueError, Exception) as e:
            logger.debug(f"Signature verification failed: {e}")
            return False

key_manager = KeyManager()
