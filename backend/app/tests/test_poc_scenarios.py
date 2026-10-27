import io
import json
import pytest
from pathlib import Path
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.security.keys import key_manager
from app.services.provenance_service import provenance_service
from app.services.generator_3d import generation_service, API3DGenerator
from app.storage.local_store import local_store

client = TestClient(app)

@pytest.fixture(scope="module")
def sample_image_bytes():
    """Generates a simple 64x64 valid PNG image in-memory."""
    img = Image.new("RGB", (64, 64), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()

@pytest.fixture(scope="module")
def prepared_asset_and_cert(sample_image_bytes):
    """Creates a sample asset, generates a 3D model, and produces a signed certificate."""
    # 1. Upload image
    upload_resp = client.post(
        "/api/assets/upload",
        files={"file": ("test_artwork.png", sample_image_bytes, "image/png")},
        data={"title": "Test Artwork", "creator_name": "Test Artist", "tags": "poc,innovation"}
    )
    assert upload_resp.status_code == 201
    asset = upload_resp.json()
    asset_id = asset["asset_id"]

    # 2. Generate 3D procedural model
    gen_resp = client.post(f"/api/assets/{asset_id}/generate-3d", json={"mode": "demo", "depth_scale": 0.2})
    assert gen_resp.status_code == 200
    asset_with_model = gen_resp.json()
    assert asset_with_model["model_sha256"] is not None

    # 3. Generate Certificate
    cert_resp = client.post("/api/certificates/generate", json={"asset_id": asset_id})
    assert cert_resp.status_code == 201
    certificate = cert_resp.json()

    # 4. Fetch model file bytes
    model_resp = client.get(f"/api/assets/{asset_id}/model")
    assert model_resp.status_code == 200
    model_bytes = model_resp.content

    return {
        "asset": asset_with_model,
        "certificate": certificate,
        "model_bytes": model_bytes,
        "asset_id": asset_id
    }

def test_health_endpoint():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "HEALTHY"
    assert data["key_configured"] is True

def test_1_valid_certificate(prepared_asset_and_cert):
    """Test 1 — Valid certificate: Generate a certificate and verify it. Expected result: signature valid."""
    cert = prepared_asset_and_cert["certificate"]
    resp = client.post("/api/certificates/verify", json={"certificate": cert})
    assert resp.status_code == 200
    result = resp.json()
    assert result["is_valid_signature"] is True
    assert result["status"] == "VALID"
    assert "VALID" in result["message"]

def test_2_untampered_model(prepared_asset_and_cert):
    """Test 2 — Untampered model: Verify original model against certificate. Expected result: hash matches."""
    cert = prepared_asset_and_cert["certificate"]
    model_bytes = prepared_asset_and_cert["model_bytes"]

    cert_json_bytes = json.dumps(cert).encode("utf-8")
    resp = client.post(
        "/api/certificates/verify-asset",
        files={
            "certificate_file": ("certificate.json", cert_json_bytes, "application/json"),
            "model_file": ("model.glb", model_bytes, "model/gltf-binary"),
        }
    )
    assert resp.status_code == 200
    result = resp.json()
    assert result["certificate_signature_valid"] is True
    assert result["asset_hash_matches"] is True
    assert result["overall_valid"] is True
    assert result["status"] == "VERIFIED_AUTHENTIC"

def test_3_modified_model(prepared_asset_and_cert):
    """Test 3 — Modified model: Modify model file by 1 byte. Expected result: hash mismatch."""
    cert = prepared_asset_and_cert["certificate"]
    model_bytes = prepared_asset_and_cert["model_bytes"]

    # Tamper with 1 byte
    tampered_bytes = bytearray(model_bytes)
    tampered_bytes[10] = (tampered_bytes[10] + 1) % 256
    tampered_bytes = bytes(tampered_bytes)

    cert_json_bytes = json.dumps(cert).encode("utf-8")
    resp = client.post(
        "/api/certificates/verify-asset",
        files={
            "certificate_file": ("certificate.json", cert_json_bytes, "application/json"),
            "model_file": ("model.glb", tampered_bytes, "model/gltf-binary"),
        }
    )
    assert resp.status_code == 200
    result = resp.json()
    assert result["certificate_signature_valid"] is True
    assert result["asset_hash_matches"] is False
    assert result["overall_valid"] is False
    assert result["status"] == "ASSET_MODIFIED"
    assert "DOES NOT MATCH" in result["message"]

def test_4_modified_certificate(prepared_asset_and_cert):
    """Test 4 — Modified certificate: Alter a signed field without new valid signature. Expected result: signature fails."""
    cert = json.loads(json.dumps(prepared_asset_and_cert["certificate"]))
    # Tamper with creator or model hash inside payload
    cert["payload"]["creator_display_name"] = "Impostor Artist"

    resp = client.post("/api/certificates/verify", json={"certificate": cert})
    assert resp.status_code == 200
    result = resp.json()
    assert result["is_valid_signature"] is False
    assert result["status"] == "TAMPERED"

def test_5_missing_or_malformed_certificate():
    """Test 5 — Missing or malformed certificate: Expected result: validation error."""
    # Empty certificate
    resp = client.post("/api/certificates/verify", json={"certificate": {}})
    assert resp.status_code == 200
    result = resp.json()
    assert result["is_valid_signature"] is False
    assert result["status"] == "MALFORMED"

    # Incomplete payload
    resp2 = client.post("/api/certificates/verify", json={"certificate": {"payload": {"dummy": "value"}, "signature_hex": "abcd"}})
    assert resp2.status_code == 200
    result2 = resp2.json()
    assert result2["is_valid_signature"] is False
    assert result2["status"] == "MALFORMED"

def test_6_3d_generation_failure():
    """Test 6 — 3D generation failure: Simulate unavailable API or invalid input. Expected: clear error."""
    generator = API3DGenerator(api_key="")
    with pytest.raises(ValueError) as excinfo:
        generator.generate(Path("dummy.png"), Path("out.glb"))
    assert "MESHY_API_KEY is not configured" in str(excinfo.value)

def test_7_blockchain_unavailable(prepared_asset_and_cert):
    """Test 7 — Blockchain unavailable: Certificate generation & verification continue to work even if node is down."""
    # Query blockchain status when node may not be running
    status_resp = client.get("/api/blockchain/status")
    assert status_resp.status_code == 200
    
    # Certificate verification continues to work independently
    cert = prepared_asset_and_cert["certificate"]
    resp = client.post("/api/certificates/verify", json={"certificate": cert})
    assert resp.status_code == 200
    assert resp.json()["is_valid_signature"] is True

def test_8_and_9_mint_validation():
    """Test 9 — Contract / Service validation: Rejection of invalid inputs."""
    # Attempting to mint for non-existent asset
    mint_resp = client.post("/api/blockchain/mint-local", json={
        "asset_id": "non_existent_asset",
        "recipient_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    })
    # Must fail with 400 or 503 if node offline, or 404
    assert mint_resp.status_code in [400, 404, 503]

def test_10_repeatability(prepared_asset_and_cert):
    """Test 10 — Repeatability: Run verification repeatedly and confirm consistent results."""
    cert = prepared_asset_and_cert["certificate"]
    for _ in range(5):
        resp = client.post("/api/certificates/verify", json={"certificate": cert})
        assert resp.status_code == 200
        assert resp.json()["is_valid_signature"] is True
        assert resp.json()["status"] == "VALID"
