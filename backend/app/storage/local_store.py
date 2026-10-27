import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any

from app.config import settings

class LocalStore:
    """
    Lightweight SQLite local store for assets and provenance certificates.
    Ensures state is persisted across server restarts without requiring external DB setup.
    """
    def __init__(self, db_path: Path = settings.DB_PATH):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS assets (
                    asset_id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    creator_name TEXT NOT NULL,
                    tags TEXT NOT NULL,
                    image_filename TEXT NOT NULL,
                    image_path TEXT NOT NULL,
                    image_format TEXT NOT NULL,
                    image_size_bytes INTEGER NOT NULL,
                    model_filename TEXT,
                    model_path TEXT,
                    model_format TEXT,
                    model_size_bytes INTEGER,
                    model_sha256 TEXT,
                    generation_method TEXT,
                    generation_status TEXT NOT NULL DEFAULT 'pending',
                    generation_error TEXT,
                    certificate_id TEXT,
                    nft_token_id INTEGER,
                    nft_tx_hash TEXT,
                    nft_contract_address TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS certificates (
                    certificate_id TEXT PRIMARY KEY,
                    asset_id TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    signature_hex TEXT NOT NULL,
                    public_key_pem TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(asset_id) REFERENCES assets(asset_id)
                )
            """)
            conn.commit()

    def create_asset(self, asset_data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        asset_data["created_at"] = now
        asset_data["updated_at"] = now
        
        tags_json = json.dumps(asset_data.get("tags", []))
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO assets (
                    asset_id, title, description, creator_name, tags,
                    image_filename, image_path, image_format, image_size_bytes,
                    model_filename, model_path, model_format, model_size_bytes, model_sha256,
                    generation_method, generation_status, generation_error,
                    certificate_id, nft_token_id, nft_tx_hash, nft_contract_address,
                    created_at, updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?
                )
            """, (
                asset_data["asset_id"],
                asset_data.get("title", "Untitled Artwork"),
                asset_data.get("description", ""),
                asset_data.get("creator_name", "Anonymous Creator"),
                tags_json,
                asset_data["image_filename"],
                asset_data["image_path"],
                asset_data["image_format"],
                asset_data["image_size_bytes"],
                asset_data.get("model_filename"),
                asset_data.get("model_path"),
                asset_data.get("model_format"),
                asset_data.get("model_size_bytes"),
                asset_data.get("model_sha256"),
                asset_data.get("generation_method"),
                asset_data.get("generation_status", "pending"),
                asset_data.get("generation_error"),
                asset_data.get("certificate_id"),
                asset_data.get("nft_token_id"),
                asset_data.get("nft_tx_hash"),
                asset_data.get("nft_contract_address"),
                asset_data["created_at"],
                asset_data["updated_at"]
            ))
            conn.commit()
        return self.get_asset(asset_data["asset_id"])

    def get_asset(self, asset_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM assets WHERE asset_id = ?", (asset_id,))
            row = cursor.fetchone()
            if not row:
                return None
            data = dict(row)
            data["tags"] = json.loads(data["tags"])
            return data

    def list_assets(self, limit: int = 100) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM assets ORDER BY created_at DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            result = []
            for row in rows:
                data = dict(row)
                data["tags"] = json.loads(data["tags"])
                result.append(data)
            return result

    def update_asset(self, asset_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        now = datetime.now(timezone.utc).isoformat()
        updates["updated_at"] = now
        
        if "tags" in updates and isinstance(updates["tags"], list):
            updates["tags"] = json.dumps(updates["tags"])
            
        set_clauses = [f"{col} = ?" for col in updates.keys()]
        values = list(updates.values()) + [asset_id]
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"UPDATE assets SET {', '.join(set_clauses)} WHERE asset_id = ?", values)
            conn.commit()
            
        return self.get_asset(asset_id)

    def save_certificate(
        self,
        certificate_id: str,
        asset_id: str,
        payload: Dict[str, Any],
        signature_hex: str,
        public_key_pem: str
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        payload_json = json.dumps(payload, sort_keys=True)
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO certificates (
                    certificate_id, asset_id, payload_json, signature_hex, public_key_pem, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (certificate_id, asset_id, payload_json, signature_hex, public_key_pem, now))
            
            # Also associate certificate_id in asset
            cursor.execute("UPDATE assets SET certificate_id = ? WHERE asset_id = ?", (certificate_id, asset_id))
            conn.commit()
            
        return {
            "certificate_id": certificate_id,
            "asset_id": asset_id,
            "payload": payload,
            "signature_hex": signature_hex,
            "public_key_pem": public_key_pem,
            "created_at": now
        }

    def get_certificate(self, certificate_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM certificates WHERE certificate_id = ?", (certificate_id,))
            row = cursor.fetchone()
            if not row:
                return None
            data = dict(row)
            data["payload"] = json.loads(data["payload_json"])
            return data

    def count_assets(self) -> int:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM assets")
            return cursor.fetchone()[0]

    def count_certificates(self) -> int:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM certificates")
            return cursor.fetchone()[0]

local_store = LocalStore()
