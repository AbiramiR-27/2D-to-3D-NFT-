import os
import uuid
import logging
from pathlib import Path
from typing import Optional, List

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse, Response
from PIL import Image

from app.config import settings
from app.models.schemas import AssetResponse, Generate3DRequest, AssetMetadataUpdate
from app.storage.local_store import local_store
from app.services.generator_3d import generation_service
from app.services.provenance_service import provenance_service

router = APIRouter(prefix="/assets", tags=["Assets"])
logger = logging.getLogger("api.assets")

def _format_asset_response(asset: dict) -> AssetResponse:
    asset_id = asset["asset_id"]
    return AssetResponse(
        asset_id=asset_id,
        title=asset.get("title", "Untitled Artwork"),
        description=asset.get("description", ""),
        creator_name=asset.get("creator_name", "Anonymous"),
        tags=asset.get("tags", []),
        image_filename=asset["image_filename"],
        image_url=f"/api/assets/{asset_id}/image",
        image_format=asset["image_format"],
        image_size_bytes=asset["image_size_bytes"],
        model_filename=asset.get("model_filename"),
        model_url=f"/api/assets/{asset_id}/model" if asset.get("model_path") else None,
        model_format=asset.get("model_format"),
        model_size_bytes=asset.get("model_size_bytes"),
        model_sha256=asset.get("model_sha256"),
        generation_method=asset.get("generation_method"),
        generation_status=asset.get("generation_status", "pending"),
        generation_error=asset.get("generation_error"),
        certificate_id=asset.get("certificate_id"),
        nft_token_id=asset.get("nft_token_id"),
        nft_tx_hash=asset.get("nft_tx_hash"),
        nft_contract_address=asset.get("nft_contract_address"),
        created_at=asset["created_at"],
        updated_at=asset["updated_at"],
    )

@router.post("/upload", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def upload_asset_image(
    file: UploadFile = File(...),
    title: str = Form(default="Untitled Artwork"),
    description: str = Form(default=""),
    creator_name: str = Form(default="Anonymous Creator"),
    tags: Optional[str] = Form(default=""),
):
    """
    Step 1: Upload 2D Artwork.
    Validates file extension, size limit, and verifies readable image format with Pillow.
    """
    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(settings.ALLOWED_IMAGE_EXTENSIONS)}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB.",
        )

    # Validate image data integrity using Pillow
    try:
        from io import BytesIO
        with Image.open(BytesIO(file_bytes)) as img:
            img.verify()
            img_format = img.format.lower() if img.format else ext.replace(".", "")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Corrupt or invalid image file: {str(e)}",
        )

    asset_id = f"asset_{uuid.uuid4().hex[:10]}"
    safe_filename = f"{asset_id}{ext}"
    dest_path = settings.UPLOADS_DIR / safe_filename
    
    with open(dest_path, "wb") as f:
        f.write(file_bytes)

    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

    asset_data = {
        "asset_id": asset_id,
        "title": title.strip() or "Untitled Artwork",
        "description": description.strip(),
        "creator_name": creator_name.strip() or "Anonymous Creator",
        "tags": tag_list,
        "image_filename": file.filename,
        "image_path": str(dest_path),
        "image_format": img_format,
        "image_size_bytes": len(file_bytes),
        "generation_status": "pending",
    }

    created = local_store.create_asset(asset_data)
    return _format_asset_response(created)

@router.get("", response_model=List[AssetResponse])
def list_assets(limit: int = 100):
    assets = local_store.list_assets(limit=limit)
    return [_format_asset_response(a) for a in assets]

@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: str):
    asset = local_store.get_asset(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found.")
    return _format_asset_response(asset)

@router.patch("/{asset_id}", response_model=AssetResponse)
def update_asset_metadata(asset_id: str, updates: AssetMetadataUpdate):
    asset = local_store.get_asset(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found.")

    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    if update_dict:
        asset = local_store.update_asset(asset_id, update_dict)
    return _format_asset_response(asset)

@router.post("/{asset_id}/generate-3d", response_model=AssetResponse)
def generate_3d_model(asset_id: str, req: Generate3DRequest):
    """
    Step 2: Generate 3D Asset.
    Produces either a genuine AI model via configured API or an authentic procedural demo 3D GLB model.
    """
    asset = local_store.get_asset(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found.")

    image_path = Path(asset["image_path"])
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Original 2D artwork file missing on server.")

    output_glb_filename = f"{asset_id}.glb"
    output_glb_path = settings.MODELS_DIR / output_glb_filename

    local_store.update_asset(asset_id, {"generation_status": "generating", "generation_error": None})

    try:
        method_label, sha256_hash, file_size, model_format = generation_service.generate_model(
            image_path=image_path,
            output_glb_path=output_glb_path,
            mode=req.mode,
            options={"depth_scale": req.depth_scale, "mesh_style": req.mesh_style}
        )

        updated = local_store.update_asset(asset_id, {
            "model_filename": output_glb_filename,
            "model_path": str(output_glb_path),
            "model_format": model_format,
            "model_size_bytes": file_size,
            "model_sha256": sha256_hash,
            "generation_method": method_label,
            "generation_status": "completed",
            "generation_error": None,
        })
        return _format_asset_response(updated)

    except Exception as e:
        logger.error(f"3D generation error for asset {asset_id}: {e}")
        local_store.update_asset(asset_id, {
            "generation_status": "failed",
            "generation_error": str(e),
        })
        raise HTTPException(status_code=500, detail=f"3D Generation failed: {str(e)}")

@router.get("/{asset_id}/model")
def download_or_preview_model(asset_id: str, download: bool = False):
    """Step 3: Preview and download GLB model."""
    asset = local_store.get_asset(asset_id)
    if not asset or not asset.get("model_path"):
        raise HTTPException(status_code=404, detail="3D model has not been generated for this asset.")

    model_path = Path(asset["model_path"])
    if not model_path.exists():
        raise HTTPException(status_code=404, detail="Model file missing from disk.")

    filename = asset.get("model_filename", f"{asset_id}.glb")
    media_type = "model/gltf-binary"
    headers = {"Content-Disposition": f"attachment; filename={filename}"} if download else {}
    return FileResponse(path=str(model_path), media_type=media_type, headers=headers)

@router.get("/{asset_id}/image")
def get_original_image(asset_id: str):
    asset = local_store.get_asset(asset_id)
    if not asset or not asset.get("image_path"):
        raise HTTPException(status_code=404, detail="Image not found for this asset.")

    image_path = Path(asset["image_path"])
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image file missing from disk.")

    ext = image_path.suffix.lower()
    media_types = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}
    return FileResponse(path=str(image_path), media_type=media_types.get(ext, "application/octet-stream"))

@router.post("/{asset_id}/tamper-test")
def simulate_tampering_for_testing(asset_id: str):
    """
    POC Test Scenario Helper (Test 3):
    Flips a byte in the generated 3D model file to demonstrate tamper detection in verification.
    """
    asset = local_store.get_asset(asset_id)
    if not asset or not asset.get("model_path"):
        raise HTTPException(status_code=404, detail="3D model does not exist to tamper.")

    model_path = Path(asset["model_path"])
    data = bytearray(model_path.read_bytes())
    if len(data) > 100:
        # Flip a byte at offset 50
        data[50] = (data[50] + 1) % 256
        with open(model_path, "wb") as f:
            f.write(data)
        new_hash = provenance_service.calculate_bytes_sha256(data)
        return {
            "message": "Model file has been intentionally modified by 1 byte at offset 50 for tamper demonstration.",
            "original_signed_hash": asset.get("model_sha256"),
            "new_modified_file_hash": new_hash
        }
    else:
        raise HTTPException(status_code=400, detail="Model file is unexpectedly small.")
