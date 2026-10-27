import React, { useState } from 'react';
import {
  Box,
  Download,
  Award,
  Hash,
  User,
  Calendar,
  Tag,
  FileCode,
  ArrowRight,
  CheckCircle2,
  Layers,
  Edit3,
  Save,
  AlertCircle,
} from 'lucide-react';
import { Viewer3D } from '../components/Viewer3D';
import { Asset } from '../types';
import { api } from '../services/api';

interface Studio3DPageProps {
  currentAsset: Asset | null;
  onNavigateToCertificate: () => void;
  onAssetUpdated: (asset: Asset) => void;
}

export const Studio3DPage: React.FC<Studio3DPageProps> = ({
  currentAsset,
  onNavigateToCertificate,
  onAssetUpdated,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(currentAsset?.title || '');
  const [description, setDescription] = useState<string>(currentAsset?.description || '');
  const [creatorName, setCreatorName] = useState<string>(currentAsset?.creator_name || '');
  const [tagsInput, setTagsInput] = useState<string>(currentAsset?.tags?.join(', ') || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!currentAsset) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-4">
          <Box className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">No Active 3D Asset Selected</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Please upload a 2D image and generate a 3D asset first, or select an existing asset from the Asset History tab.
        </p>
      </div>
    );
  }

  const modelUrl = `/api/assets/${currentAsset.asset_id}/model`;

  const handleSaveMetadata = async () => {
    setIsSaving(true);
    try {
      const tagList = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      const updated = await api.updateAssetMetadata(currentAsset.asset_id, {
        title,
        description,
        creator_name: creatorName,
        tags: tagList,
      });
      onAssetUpdated(updated);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Step 3 & 4: 3D Studio & Asset Metadata</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Active Asset
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Interactive real-time 3D inspection and verified provenance metadata management.
          </p>
        </div>

        <button
          onClick={onNavigateToCertificate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-xs"
        >
          <Award className="w-4 h-4" />
          Proceed to Signed Certificate
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive 3D Viewer (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Viewer3D
            modelUrl={modelUrl}
            modelFilename={currentAsset.model_filename || `${currentAsset.asset_id}.glb`}
            generationMethod={currentAsset.generation_method || 'Procedural demo model'}
            fileSizeBytes={currentAsset.model_size_bytes}
            modelSha256={currentAsset.model_sha256}
          />

          {/* Cryptographic Hash Summary Card */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 shadow-sm border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                Asset Binary SHA-256 Checksum
              </span>
              <span className="text-[11px] text-slate-400">Byte-level exact hash</span>
            </div>
            <p className="font-mono text-xs text-indigo-300 break-all select-all bg-slate-950/60 p-2 rounded border border-slate-800">
              {currentAsset.model_sha256 || 'Hash will be calculated upon generation'}
            </p>
            <p className="text-[11px] text-slate-400 leading-tight">
              This exact checksum will be signed by the asymmetric Ed25519 private key in the next step to form the
              tamper-proof provenance certificate.
            </p>
          </div>
        </div>

        {/* Right: Asset & Provenance Metadata Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Asset Metadata Card
              </h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
              ) : (
                <button
                  onClick={handleSaveMetadata}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  <Save className="w-3 h-3" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>

            {/* Original 2D Artwork Thumbnail */}
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <img
                src={currentAsset.image_url}
                alt="2D Source"
                className="w-14 h-14 object-cover rounded-md border border-slate-200"
              />
              <div className="min-w-0 flex-1 text-xs">
                <span className="font-semibold text-slate-800 block truncate">{currentAsset.image_filename}</span>
                <span className="text-slate-500 block">
                  Original Source ({(currentAsset.image_size_bytes / 1024).toFixed(1)} KB)
                </span>
                <span className="text-[10px] text-indigo-600 uppercase font-semibold">{currentAsset.image_format}</span>
              </div>
            </div>

            {/* Editable Fields */}
            {!isEditing ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Asset Title</span>
                  <span className="font-semibold text-slate-900 text-sm">{currentAsset.title}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Creator Display Name</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {currentAsset.creator_name}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Description</span>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{currentAsset.description || 'No description provided.'}</p>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Tags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentAsset.tags && currentAsset.tags.length > 0 ? (
                      currentAsset.tags.map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px]">
                          #{t}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">No tags</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Asset Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Creator Display Name</label>
                  <input
                    type="text"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* System Generated / Calculated Identifiers (Read-Only) */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                System Identifiers (Computed)
              </span>

              <div className="flex justify-between">
                <span className="text-slate-500">Asset ID</span>
                <span className="font-mono text-slate-800 font-medium">{currentAsset.asset_id}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Creation Timestamp</span>
                <span className="text-slate-700">
                  {new Date(currentAsset.created_at).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Model File Format</span>
                <span className="font-medium text-slate-800 uppercase">{currentAsset.model_format || 'GLB'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Certificate Status</span>
                {currentAsset.certificate_id ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Issued ({currentAsset.certificate_id})
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">Pending Issuance</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
