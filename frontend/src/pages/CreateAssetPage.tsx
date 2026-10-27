import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  X,
  RefreshCw,
  Box,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { Asset } from '../types';

interface CreateAssetPageProps {
  onAssetCreated: (asset: Asset) => void;
  onNavigateToStudio: () => void;
}

export const CreateAssetPage: React.FC<CreateAssetPageProps> = ({
  onAssetCreated,
  onNavigateToStudio,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState<string>('Cyber Shield Emblem');
  const [description, setDescription] = useState<string>('Futuristic procedural heraldic emblem with dual star core.');
  const [creatorName, setCreatorName] = useState<string>('Aria Stark (Innovation Labs)');
  const [tags, setTags] = useState<string>('digital-art, 3d-relief, cyber, soi-p2');

  // 3D Generation settings
  const [genMode, setGenMode] = useState<'demo' | 'api'>('demo');
  const [depthScale, setDepthScale] = useState<number>(0.35);
  const [meshStyle, setMeshStyle] = useState<string>('textured_relief');

  // Execution states
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgressMsg, setGenerationProgressMsg] = useState<string>('');
  const [createdAsset, setCreatedAsset] = useState<Asset | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    const validExtensions = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validExtensions.includes(file.type)) {
      setErrorMessage(`Unsupported file format (${file.type || 'unknown'}). Allowed: PNG, JPG, JPEG, WEBP.`);
      return;
    }
    const maxBytes = 15 * 1024 * 1024; // 15MB
    if (file.size > maxBytes) {
      setErrorMessage(`File exceeds maximum permitted size of 15 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB uploaded).`);
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Sample Asset Presets for quick evaluation
  const loadPreset = async (presetName: string, filename: string) => {
    try {
      // Create a canvas with geometric art in-browser
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;

      if (presetName === 'cyber_shield') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 512, 512);
        // Shield
        ctx.fillStyle = '#1e3a8a';
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(256, 80);
        ctx.lineTo(390, 140);
        ctx.lineTo(370, 320);
        ctx.lineTo(256, 440);
        ctx.lineTo(142, 320);
        ctx.lineTo(122, 140);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Core
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(256, 256, 45, 0, Math.PI * 2);
        ctx.fill();
        setTitle('Cyber Shield Emblem');
        setDescription('Procedural blue-and-gold heraldic shield with central core.');
      } else if (presetName === 'vortex') {
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, 512, 512);
        const colors = ['#8b5cf6', '#ec4899', '#3b82f6', '#06b6d4'];
        for (let r = 200; r > 10; r -= 20) {
          ctx.strokeStyle = colors[(r / 20) % colors.length];
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(256, 256, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        setTitle('Innovation Vortex');
        setDescription('Concentric multicolored harmonic energy field.');
      } else {
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#10b981';
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(256, 120);
        ctx.lineTo(380, 256);
        ctx.lineTo(256, 392);
        ctx.lineTo(132, 256);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        setTitle('Quantum Emerald Prism');
        setDescription('Geometric diamond matrix representation.');
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], filename, { type: 'image/png' });
          validateAndSetFile(file);
        }
      }, 'image/png');
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadAndGenerate = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select or upload a 2D image first.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // Step 1: Upload image
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('creator_name', creatorName);
      formData.append('tags', tags);

      setGenerationProgressMsg('Uploading 2D artwork and parsing image headers...');
      const uploaded = await api.uploadAsset(formData);
      setIsUploading(false);

      // Step 2: Trigger 3D Generation
      setIsGenerating(true);
      setGenerationProgressMsg(
        genMode === 'demo'
          ? 'Generating procedural 3D GLB mesh (calculating luminance heights, skirt walls, & UV mapping)...'
          : 'Connecting to configured external AI 3D reconstruction API adapter...'
      );

      const generated = await api.generate3D(uploaded.asset_id, {
        mode: genMode,
        depth_scale: depthScale,
        mesh_style: meshStyle,
      });

      setCreatedAsset(generated);
      onAssetCreated(generated);
      setIsGenerating(false);
      setGenerationProgressMsg('');
    } catch (err: any) {
      setIsUploading(false);
      setIsGenerating(false);
      setErrorMessage(err.message || 'Operation failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Step 1 & 2: Upload 2D Artwork & Generate 3D Asset</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Select or upload your 2D source artwork. Choose between the procedural demo 3D generator or the external AI adapter.
        </p>
      </div>

      {/* Preset Pickers for Immediate Testing */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-indigo-900">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Quick Evaluation Presets (Click to Load Sample Artwork)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadPreset('cyber_shield', 'sample_cyber_shield.png')}
            className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors shadow-2xs"
          >
            🛡️ Preset 1: Cyber Shield
          </button>
          <button
            type="button"
            onClick={() => loadPreset('vortex', 'sample_innovation_vortex.png')}
            className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors shadow-2xs"
          >
            🌀 Preset 2: Innovation Vortex
          </button>
          <button
            type="button"
            onClick={() => loadPreset('quantum', 'sample_quantum_emerald.png')}
            className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors shadow-2xs"
          >
            💎 Preset 3: Quantum Prism
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Image Upload Area (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Artwork Image File
            </label>

            {!previewUrl ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500 mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-800">
                  Drag and drop your image here, or <span className="text-indigo-600 font-semibold">browse</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supported formats: PNG, JPG, JPEG, WEBP • Limit: 15 MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={previewUrl}
                  alt="Artwork preview"
                  className="w-32 h-32 object-cover rounded-lg border border-slate-200 shadow-2xs"
                />
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="text-sm font-medium text-slate-900 truncate">{selectedFile?.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Size: {selectedFile ? (selectedFile.size / 1024).toFixed(1) : 0} KB
                  </p>
                  <p className="text-xs text-slate-500">Format: {selectedFile?.type}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors"
                    >
                      Replace Image
                    </button>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Asset Metadata Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Asset Provenance Metadata
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Asset Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cyber Shield Emblem"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Creator Display Name *</label>
              <input
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="e.g. Aria Stark (Innovation Labs)"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Note: Entered display name documents authorship statement in the signed certificate.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide artistic context or creation notes..."
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="soi, 3d, provenance, artwork"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: 3D Generation Engine Settings (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                3D Generation Engine
              </h3>
            </div>

            {/* Generator Mode Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700">Generator Adapter</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGenMode('demo')}
                  className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                    genMode === 'demo'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 font-medium'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-semibold block">Procedural Demo</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Authentic luminance relief solid GLB (Offline & Free)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setGenMode('api')}
                  className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                    genMode === 'api'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 font-medium'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-semibold block">Cloud AI Adapter</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Requires external API key (.env MESHY_API_KEY)
                  </span>
                </button>
              </div>
            </div>

            {/* Honest Disclosure Box */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Methodology Transparency</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                {genMode === 'demo'
                  ? 'The procedural generator creates a genuine 3D GLB mesh with top relief calculated from image luminance, side skirt walls, flat base, and projected UV coordinates. It does not pretend to be a deep-learning reconstruction.'
                  : 'The AI adapter connects to external image-to-3D endpoints. If unconfigured or unreachable, it reports an honest diagnostic error.'}
              </p>
            </div>

            {/* Depth Scale Slider */}
            {genMode === 'demo' && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">Relief Height / Depth</span>
                  <span className="font-mono text-indigo-600 font-semibold">{depthScale}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={depthScale}
                  onChange={(e) => setDepthScale(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Subtle (0.1x)</span>
                  <span>Standard (0.35x)</span>
                  <span>Deep Relief (1.0x)</span>
                </div>
              </div>
            )}

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleUploadAndGenerate}
                disabled={!selectedFile || isUploading || isGenerating}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  !selectedFile || isUploading || isGenerating
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                }`}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Uploading Artwork...
                  </>
                ) : isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating 3D GLB Asset...
                  </>
                ) : (
                  <>
                    <Box className="w-4 h-4" />
                    Generate 3D Asset
                  </>
                )}
              </button>
            </div>

            {/* Real Progress Feedback */}
            {(isUploading || isGenerating) && (
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 space-y-1">
                <div className="flex items-center gap-2 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Processing Workflow</span>
                </div>
                <p className="text-[11px] text-indigo-700">{generationProgressMsg}</p>
              </div>
            )}

            {/* Success State */}
            {createdAsset && !isGenerating && (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-900">3D Asset Generated Successfully!</h4>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Model ID: <span className="font-mono">{createdAsset.asset_id}</span>
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      SHA-256: <span className="font-mono text-[10px] break-all">{createdAsset.model_sha256}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onNavigateToStudio}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  Proceed to 3D Studio & Preview
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
