import sys
from pathlib import Path

# Add backend directory to python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.services.generator_3d import generation_service
from app.services.provenance_service import provenance_service
from app.storage.local_store import local_store

def main():
    sample_dir = Path(__file__).resolve().parent
    img_path = sample_dir / "sample_01_cyber_shield.png"
    out_glb = sample_dir / "sample_model_cyber_shield.glb"

    print(f"Generating sample GLB from {img_path}...")
    label, sha256_hash, size, fmt = generation_service.generate_model(
        image_path=img_path,
        output_glb_path=out_glb,
        mode="demo",
        options={"depth_scale": 0.35}
    )
    print(f"Generated sample model: {size} bytes, SHA-256: {sha256_hash}")

    # Register in local store
    asset_id = "sample_asset_001"
    asset_data = {
        "asset_id": asset_id,
        "title": "Cyber Shield Provenance Demo",
        "description": "Baseline reference sample 3D model for college demonstration and integrity testing.",
        "creator_name": "SoI Research Team",
        "tags": ["sample", "demo", "soi-p2", "cyber-shield"],
        "image_filename": img_path.name,
        "image_path": str(img_path),
        "image_format": "png",
        "image_size_bytes": img_path.stat().st_size,
        "model_filename": out_glb.name,
        "model_path": str(out_glb),
        "model_format": "glb",
        "model_size_bytes": size,
        "model_sha256": sha256_hash,
        "generation_method": label,
        "generation_status": "completed",
    }
    local_store.create_asset(asset_data)

    # Generate certificate
    cert = provenance_service.generate_certificate_for_asset(asset_id)
    cert_json_path = sample_dir / "sample_certificate_cyber_shield.json"
    with open(cert_json_path, "w", encoding="utf-8") as f:
        f.write(cert.model_dump_json(indent=2))
    print(f"Generated and wrote signed sample certificate to {cert_json_path.name}")

if __name__ == "__main__":
    main()
