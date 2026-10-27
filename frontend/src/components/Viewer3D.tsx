import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  RotateCcw,
  Maximize2,
  Sun,
  Eye,
  Download,
  Box,
  Layers,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface Viewer3DProps {
  modelUrl: string;
  modelFilename?: string;
  generationMethod?: string;
  fileSizeBytes?: number;
  modelSha256?: string;
}

export const Viewer3D: React.FC<Viewer3DProps> = ({
  modelUrl,
  modelFilename = 'model.glb',
  generationMethod = 'Procedural demo model',
  fileSizeBytes,
  modelSha256,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [lightPreset, setLightPreset] = useState<'studio' | 'bright' | 'dramatic'>('studio');
  
  // Model stats
  const [stats, setStats] = useState<{
    vertexCount: number;
    faceCount: number;
    dimensions: { x: number; y: number; z: number };
  }>({
    vertexCount: 0,
    faceCount: 0,
    dimensions: { x: 0, y: 0, z: 0 },
  });

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const lightsRef = useRef<{ dir: THREE.DirectionalLight; amb: THREE.AmbientLight } | null>(null);

  const resetCamera = () => {
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(0, 1.8, 3.2);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 480;

    // 1. Scene & Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9); // Slate-100 neutral tone
    sceneRef.current = scene;

    // Grid Floor
    const gridHelper = new THREE.GridHelper(6, 20, 0x94a3b8, 0xe2e8f0);
    gridHelper.position.y = -0.8;
    scene.add(gridHelper);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 3.2);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    containerRef.current.replaceChildren(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(4, 8, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x93c5fd, 0.8);
    backLight.position.set(-4, 3, -4);
    scene.add(backLight);

    lightsRef.current = { dir: dirLight, amb: ambientLight };

    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 10;
    controls.minDistance = 0.5;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.5;
    controlsRef.current = controls;

    // 6. Load GLTF / GLB Model
    setLoading(true);
    setError(null);

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const root = gltf.scene;
        modelRef.current = root;

        // Compute Bounding Box & Center
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Center model
        root.position.x -= center.x;
        root.position.y -= center.y;
        root.position.z -= center.z;

        // Count vertices and faces
        let vCount = 0;
        let fCount = 0;

        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const geometry = mesh.geometry;
            if (geometry) {
              const pos = geometry.attributes.position;
              if (pos) vCount += pos.count;
              if (geometry.index) {
                fCount += geometry.index.count / 3;
              } else if (pos) {
                fCount += pos.count / 3;
              }
            }
          }
        });

        setStats({
          vertexCount: vCount,
          faceCount: Math.round(fCount),
          dimensions: {
            x: Number(size.x.toFixed(2)),
            y: Number(size.y.toFixed(2)),
            z: Number(size.z.toFixed(2)),
          },
        });

        scene.add(root);
        setLoading(false);
      },
      (xhr) => {
        // Progress
      },
      (err) => {
        console.error('Three.js GLTF Load Error:', err);
        setError('Failed to load 3D GLB model. File may be corrupted or unavailable.');
        setLoading(false);
      }
    );

    // 7. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight || 480;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.replaceChildren();
      }
    };
  }, [modelUrl]);

  // Wireframe toggle effect
  useEffect(() => {
    if (!modelRef.current) return;
    modelRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m: any) => {
            if ('wireframe' in m) m.wireframe = wireframe;
          });
        } else if (mesh.material && 'wireframe' in mesh.material) {
          (mesh.material as any).wireframe = wireframe;
        }
      }
    });
  }, [wireframe]);

  // Auto-rotate toggle effect
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Lighting preset effect
  useEffect(() => {
    if (!lightsRef.current) return;
    if (lightPreset === 'studio') {
      lightsRef.current.amb.intensity = 1.2;
      lightsRef.current.dir.intensity = 2.0;
    } else if (lightPreset === 'bright') {
      lightsRef.current.amb.intensity = 2.0;
      lightsRef.current.dir.intensity = 3.0;
    } else if (lightPreset === 'dramatic') {
      lightsRef.current.amb.intensity = 0.5;
      lightsRef.current.dir.intensity = 4.0;
    }
  }, [lightPreset]);

  return (
    <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* 3D Viewport Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-800">
            <Box className="w-3.5 h-3.5 text-slate-600" />
            GLB Viewer
          </span>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            {modelFilename}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle Auto Rotation"
            className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
              autoRotate ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <RotateCcw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </button>

          <button
            onClick={() => setWireframe(!wireframe)}
            title="Toggle Wireframe Mode"
            className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
              wireframe ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const next = lightPreset === 'studio' ? 'bright' : lightPreset === 'bright' ? 'dramatic' : 'studio';
              setLightPreset(next);
            }}
            title={`Lighting: ${lightPreset}`}
            className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <Sun className="w-4 h-4" />
          </button>

          <button
            onClick={resetCamera}
            title="Reset Camera Orientation"
            className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <a
            href={`${modelUrl}?download=true`}
            download={modelFilename}
            className="inline-flex items-center gap-1 ml-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download GLB
          </a>
        </div>
      </div>

      {/* Viewport Canvas Container */}
      <div className="relative w-full h-[460px] bg-slate-100">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-xs">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
            <span className="text-sm font-medium text-slate-700">Loading 3D asset geometry...</span>
            <span className="text-xs text-slate-500 mt-1">Parsing binary GLTF mesh and textures</span>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/90 p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-600 mb-2" />
            <h4 className="text-sm font-semibold text-red-900">3D Preview Unavailable</h4>
            <p className="text-xs text-red-700 mt-1 max-w-sm">{error}</p>
          </div>
        )}

        {/* Bottom floating helper tip */}
        <div className="absolute bottom-3 left-3 bg-white/85 backdrop-blur-xs px-2.5 py-1 rounded text-[11px] text-slate-600 border border-slate-200/80 shadow-2xs pointer-events-none">
          Left click: Rotate • Right click: Pan • Scroll: Zoom
        </div>
      </div>

      {/* Model Metadata Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white border-t border-slate-200 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">Generation Method</span>
          <span className="font-medium text-slate-800 truncate block" title={generationMethod}>
            {generationMethod}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Mesh Complexity</span>
          <span className="font-medium text-slate-800">
            {stats.faceCount.toLocaleString()} triangles ({stats.vertexCount.toLocaleString()} vertices)
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Bounding Dimensions</span>
          <span className="font-medium text-slate-800">
            {stats.dimensions.x} × {stats.dimensions.y} × {stats.dimensions.z}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">File Size & Format</span>
          <span className="font-medium text-slate-800">
            {fileSizeBytes ? `${(fileSizeBytes / 1024).toFixed(1)} KB` : 'Standard'} (GLB Binary)
          </span>
        </div>
      </div>
    </div>
  );
};
