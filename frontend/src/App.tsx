import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { CreateAssetPage } from './pages/CreateAssetPage';
import { Studio3DPage } from './pages/Studio3DPage';
import { CertificatePage } from './pages/CertificatePage';
import { VerifyPage } from './pages/VerifyPage';
import { MintNFTPage } from './pages/MintNFTPage';
import { HistoryPage } from './pages/HistoryPage';
import { TestSuitePage } from './pages/TestSuitePage';
import { Asset, SystemHealth } from './types';
import { api } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  // Poll system health once upon mounting
  useEffect(() => {
    api.getHealth()
      .then(setSystemHealth)
      .catch((err) => console.warn('Backend not responding yet:', err));
  }, []);

  const handleAssetCreated = (asset: Asset) => {
    setCurrentAsset(asset);
  };

  const handleSelectAssetFromHistory = (asset: Asset, targetTab: string = 'studio') => {
    setCurrentAsset(asset);
    setCurrentTab(targetTab);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        systemHealth={systemHealth}
      />

      {/* Main Tab Viewport */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            onStart={() => setCurrentTab('create')}
            systemHealth={systemHealth}
          />
        )}

        {currentTab === 'create' && (
          <CreateAssetPage
            onAssetCreated={handleAssetCreated}
            onNavigateToStudio={() => setCurrentTab('studio')}
          />
        )}

        {currentTab === 'studio' && (
          <Studio3DPage
            currentAsset={currentAsset}
            onNavigateToCertificate={() => setCurrentTab('certificate')}
            onAssetUpdated={setCurrentAsset}
          />
        )}

        {currentTab === 'certificate' && (
          <CertificatePage
            currentAsset={currentAsset}
            onNavigateToVerify={() => setCurrentTab('verify')}
            onAssetUpdated={setCurrentAsset}
          />
        )}

        {currentTab === 'verify' && (
          <VerifyPage currentAsset={currentAsset} />
        )}

        {currentTab === 'mint' && (
          <MintNFTPage
            currentAsset={currentAsset}
            onAssetUpdated={setCurrentAsset}
          />
        )}

        {currentTab === 'history' && (
          <HistoryPage onSelectAsset={handleSelectAssetFromHistory} />
        )}

        {currentTab === 'tests' && (
          <TestSuitePage />
        )}
      </main>

      {/* Professional Academic Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-700">School of Innovation (SoI) — Phase 2 Project POC</span>
            <span className="mx-2">•</span>
            <span>Concept I02: Conventional Signed Certificate & Blockchain Minting</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Ed25519 Cryptography</span>
            <span>•</span>
            <span>SHA-256 Byte Digest</span>
            <span>•</span>
            <span>OpenZeppelin ERC-721</span>
            <span>•</span>
            <span>FastAPI & Three.js</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
