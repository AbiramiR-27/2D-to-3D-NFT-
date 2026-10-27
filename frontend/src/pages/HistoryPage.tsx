import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  Eye,
  Award,
  Coins,
  CheckCircle2,
  Clock,
  Box,
  Hash,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Asset } from '../types';
import { api } from '../services/api';

interface HistoryPageProps {
  onSelectAsset: (asset: Asset, targetTab?: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onSelectAsset }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const list = await api.listAssets();
      setAssets(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Step 7: Local Demo Asset History</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse all 2D-to-3D creations, inspect their signed provenance certificates, and review blockchain mint records.
          </p>
        </div>

        <button
          onClick={fetchAssets}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh History
        </button>
      </div>

      {/* Asset Table or Grid */}
      {assets.length === 0 && !isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Assets Created Yet</h3>
          <p className="text-xs text-slate-500 mt-1">Upload a 2D artwork in the Create tab to generate your first 3D asset.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Creator</th>
                  <th className="px-4 py-3">Model SHA-256</th>
                  <th className="px-4 py-3">Certificate</th>
                  <th className="px-4 py-3">Blockchain NFT</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {assets.map((asset) => (
                  <tr key={asset.asset_id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Thumbnail & Title */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={asset.image_url}
                          alt={asset.title}
                          className="w-10 h-10 object-cover rounded-md border border-slate-200"
                        />
                        <div>
                          <span className="font-semibold text-slate-900 block truncate max-w-[160px]">
                            {asset.title}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 block">
                            {asset.asset_id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Creator */}
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {asset.creator_name}
                    </td>

                    {/* Model SHA-256 */}
                    <td className="px-4 py-3">
                      {asset.model_sha256 ? (
                        <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50/70 px-1.5 py-0.5 rounded border border-indigo-100 block truncate max-w-[140px]" title={asset.model_sha256}>
                          {asset.model_sha256}
                        </span>
                      ) : (
                        <span className="text-slate-400">Pending 3D</span>
                      )}
                    </td>

                    {/* Certificate Status */}
                    <td className="px-4 py-3">
                      {asset.certificate_id ? (
                        <button
                          onClick={() => onSelectAsset(asset, 'certificate')}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Signed ({asset.certificate_id.slice(0, 8)})
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Not Certified</span>
                      )}
                    </td>

                    {/* NFT Mint Status */}
                    <td className="px-4 py-3">
                      {asset.nft_token_id ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          <Coins className="w-3 h-3 text-indigo-600" />
                          Token #{asset.nft_token_id}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Unminted</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectAsset(asset, 'studio')}
                          className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                          title="Open in 3D Studio"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {asset.model_url && (
                          <a
                            href={`${asset.model_url}?download=true`}
                            download={asset.model_filename || 'model.glb'}
                            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Download GLB Model"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={() => onSelectAsset(asset, 'mint')}
                          className="p-1.5 rounded hover:bg-slate-200 text-amber-600 transition-colors"
                          title="Mint NFT"
                        >
                          <Coins className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
