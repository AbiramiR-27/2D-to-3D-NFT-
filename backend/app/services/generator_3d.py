import hashlib
import io
import logging
import os
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Tuple, Optional, Dict, Any

import numpy as np
from PIL import Image, ImageFilter
import trimesh

from app.config import settings

logger = logging.getLogger("generator_3d")

class Generator3DBase(ABC):
    """Abstract base adapter for 3D model generation."""
    
    @abstractmethod
    def generate(
        self,
        image_path: Path,
        output_glb_path: Path,
        options: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str, int, str]:
        """
        Generates a 3D GLB model from input image.
        Returns:
            Tuple[generation_method_label, model_sha256, model_size_bytes, model_format]
        """
        pass

class Demo3DGenerator(Generator3DBase):
    """
    Procedural Demo 3D Generator.
    Explicitly labelled as a procedural relief/extrusion generator derived from 2D pixel luminance.
    Creates an authentic, watertight 3D GLB mesh with textured front relief, side skirts, and base.
    Does NOT claim to be a neural AI reconstruction.
    """
    def __init__(self, resolution: int = 72):
        self.resolution = resolution  # Grid dimension for heightmap

    def generate(
        self,
        image_path: Path,
        output_glb_path: Path,
        options: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str, int, str]:
        options = options or {}
        depth_scale = float(options.get("depth_scale", 0.35))
        mesh_style = options.get("mesh_style", "textured_relief")

        logger.info(f"Generating procedural demo 3D model ({mesh_style}) from {image_path}...")

        # 1. Load image and prepare texture & luminance grid
        with Image.open(image_path) as img:
            rgb_img = img.convert("RGB")
            # Downsample for heightmap grid
            grid_img = rgb_img.resize((self.resolution, self.resolution), Image.Resampling.LANCZOS)
            gray_img = grid_img.convert("L").filter(ImageFilter.GaussianBlur(radius=0.75))
            
            # Save a square texture for GLB material
            texture_bytes_io = io.BytesIO()
            rgb_img.resize((512, 512), Image.Resampling.LANCZOS).save(texture_bytes_io, format="JPEG", quality=90)
            texture_bytes_io.seek(0)
            pil_texture = Image.open(texture_bytes_io)

        # 2. Convert luminance to normalized height array
        height_data = np.asarray(gray_img, dtype=np.float32) / 255.0  # 0.0 to 1.0
        h, w = height_data.shape

        # Normalize grid coordinate space: X in [-1, 1], Y in [-1, 1]
        x_coords = np.linspace(-1.0, 1.0, w)
        y_coords = np.linspace(1.0, -1.0, h)
        xx, yy = np.meshgrid(x_coords, y_coords)

        # Calculate vertex positions for top surface
        # Base thickness: 0.08, plus luminance relief up to depth_scale
        base_thickness = 0.08
        zz = base_thickness + (height_data * depth_scale)

        vertices_top = np.column_stack([xx.ravel(), yy.ravel(), zz.ravel()])
        
        # Bottom base vertices (flat at z = 0)
        vertices_bottom = np.column_stack([xx.ravel(), yy.ravel(), np.zeros_like(zz.ravel())])
        
        all_vertices = np.vstack([vertices_top, vertices_bottom])
        n_top = len(vertices_top)

        # 3. Create faces for top surface (triangulated grid)
        faces = []
        for i in range(h - 1):
            for j in range(w - 1):
                idx = i * w + j
                # Two triangles for grid quad (top)
                faces.append([idx, idx + 1, idx + w])
                faces.append([idx + 1, idx + w + 1, idx + w])

        # 4. Create bottom faces (reversed winding for downward normal)
        for i in range(h - 1):
            for j in range(w - 1):
                idx = n_top + (i * w + j)
                faces.append([idx, idx + w, idx + 1])
                faces.append([idx + 1, idx + w, idx + w + 1])

        # 5. Create side skirts to make a solid watertight mesh
        # North edge (i = 0)
        for j in range(w - 1):
            top_curr = j
            top_next = j + 1
            bot_curr = n_top + j
            bot_next = n_top + (j + 1)
            faces.append([top_curr, bot_curr, top_next])
            faces.append([top_next, bot_curr, bot_next])

        # South edge (i = h - 1)
        for j in range(w - 1):
            top_curr = (h - 1) * w + j
            top_next = (h - 1) * w + (j + 1)
            bot_curr = n_top + top_curr
            bot_next = n_top + top_next
            faces.append([top_curr, top_next, bot_curr])
            faces.append([top_next, bot_next, bot_curr])

        # West edge (j = 0)
        for i in range(h - 1):
            top_curr = i * w
            top_next = (i + 1) * w
            bot_curr = n_top + top_curr
            bot_next = n_top + top_next
            faces.append([top_curr, top_next, bot_curr])
            faces.append([top_next, bot_next, bot_curr])

        # East edge (j = w - 1)
        for i in range(h - 1):
            top_curr = i * w + (w - 1)
            top_next = (i + 1) * w + (w - 1)
            bot_curr = n_top + top_curr
            bot_next = n_top + top_next
            faces.append([top_curr, bot_curr, top_next])
            faces.append([top_next, bot_curr, bot_next])

        faces = np.array(faces, dtype=np.int32)

        # 6. Generate UV mapping so the 2D artwork is projected onto the 3D relief
        # UV coordinates for top vertices: [0, 1] range mapped to image
        uv_x = (xx.ravel() + 1.0) / 2.0
        uv_y = (yy.ravel() + 1.0) / 2.0
        uv_top = np.column_stack([uv_x, uv_y])
        
        # Bottom vertices mapped to neutral edge border
        uv_bottom = np.full((n_top, 2), 0.05, dtype=np.float32)
        all_uvs = np.vstack([uv_top, uv_bottom])

        # 7. Build Trimesh with material
        material = trimesh.visual.material.PBRMaterial(
            baseColorTexture=pil_texture,
            metallicFactor=0.1,
            roughnessFactor=0.6,
        )
        visual = trimesh.visual.TextureVisuals(uv=all_uvs, image=pil_texture, material=material)
        mesh = trimesh.Trimesh(vertices=all_vertices, faces=faces, visual=visual, process=True)

        # Recompute surface vertex normals for smooth Three.js lighting
        mesh.fix_normals()

        # 8. Export directly to GLB
        output_glb_path.parent.mkdir(parents=True, exist_ok=True)
        glb_data = trimesh.exchange.gltf.export_glb(mesh)
        with open(output_glb_path, "wb") as f:
            f.write(glb_data)

        # 9. Compute cryptographic SHA-256 hash of exact model file bytes
        file_bytes = output_glb_path.read_bytes()
        model_sha256 = hashlib.sha256(file_bytes).hexdigest()
        model_size = len(file_bytes)

        label = "Procedural demo model (Luminance Relief Solid)"
        logger.info(f"Generated GLB successfully: {model_size} bytes, SHA-256: {model_sha256}")
        return label, model_sha256, model_size, "glb"

class API3DGenerator(Generator3DBase):
    """
    Adapter for genuine external AI 3D reconstruction APIs (e.g., Meshy / Tripo3D).
    Reads credentials strictly from environment variables.
    Fails with clear, transparent error diagnostics when credentials or services are unavailable.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.MESHY_API_KEY

    def generate(
        self,
        image_path: Path,
        output_glb_path: Path,
        options: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str, int, str]:
        if not self.api_key:
            raise ValueError(
                "MESHY_API_KEY is not configured in environment variables (.env). "
                "To use the genuine AI 3D service, set MESHY_API_KEY. "
                "Otherwise, use the Procedural Demo Generator."
            )

        # External API invocation would be handled here
        import requests
        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        # Verify endpoint accessibility
        try:
            resp = requests.get("https://api.meshy.ai/v2/health", headers=headers, timeout=5)
            if resp.status_code != 200:
                raise ConnectionError(f"External 3D API healthcheck failed with code {resp.status_code}")
        except Exception as e:
            raise ConnectionError(f"Failed to connect to external 3D API service: {str(e)}")

        raise NotImplementedError("External AI API integration is active but requires live queue handling.")

class GenerationService:
    """Orchestrates 3D model generation according to selected mode."""
    
    def __init__(self):
        self.demo_generator = Demo3DGenerator()
        self.api_generator = API3DGenerator()

    def generate_model(
        self,
        image_path: Path,
        output_glb_path: Path,
        mode: str = "demo",
        options: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str, int, str]:
        if mode == "api":
            try:
                return self.api_generator.generate(image_path, output_glb_path, options)
            except Exception as e:
                logger.warning(f"AI API generation requested but failed or unconfigured: {e}")
                raise e
        else:
            return self.demo_generator.generate(image_path, output_glb_path, options)

generation_service = GenerationService()
