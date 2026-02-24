'use client';

import { useState, useMemo } from 'react';
import type { CampaignConfig } from '../lib/types';
import { DEFAULT_CAMPAIGN_CONFIG } from '../lib/brand-data';
import { generateBannerHTML } from '../lib/banner-template';
import PropertiesPanel from './components/PropertiesPanel';
import PreviewPanel from './components/PreviewPanel';
import ConfigPanel from './components/ConfigPanel';

export default function Home() {
  const [config, setConfig] = useState<CampaignConfig>(DEFAULT_CAMPAIGN_CONFIG);

  const bannerHTML = useMemo(() => generateBannerHTML(config), [config]);

  const handleReset = () => {
    setConfig(DEFAULT_CAMPAIGN_CONFIG);
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      {/* Left — Properties */}
      <PropertiesPanel config={config} onChange={setConfig} />

      {/* Center — Preview */}
      <PreviewPanel config={config} html={bannerHTML} onReset={handleReset} />

      {/* Right — Config JSON */}
      <ConfigPanel config={config} />
    </div>
  );
}
