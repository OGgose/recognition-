import React, { useState } from 'react';
import TabButton from './components/TabButton';
import LiveAnalyzer from './components/LiveAnalyzer';
import VideoAnalyzer from './components/VideoAnalyzer';
import VeoStudio from './components/VeoStudio';
import ThinkingChat from './components/ThinkingChat';
import { AppTab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.LIVE_ANALYSIS);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500/30">
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg shadow-lg shadow-indigo-500/20 flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-xl tracking-tight text-white">FaceInsight AI</span>
            </div>
          </div>
          
          <div className="flex space-x-1 overflow-x-auto">
            <TabButton 
              label="Live Analysis" 
              active={activeTab === AppTab.LIVE_ANALYSIS} 
              onClick={() => setActiveTab(AppTab.LIVE_ANALYSIS)}
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
            />
            <TabButton 
              label="Video File" 
              active={activeTab === AppTab.VIDEO_ANALYSIS} 
              onClick={() => setActiveTab(AppTab.VIDEO_ANALYSIS)}
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>}
            />
            <TabButton 
              label="Veo Studio" 
              active={activeTab === AppTab.VEO_STUDIO} 
              onClick={() => setActiveTab(AppTab.VEO_STUDIO)}
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>}
            />
             <TabButton 
              label="Thinking Chat" 
              active={activeTab === AppTab.THINKING_CHAT} 
              onClick={() => setActiveTab(AppTab.THINKING_CHAT)}
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
            />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 h-[calc(100vh-64px)] overflow-hidden">
        {activeTab === AppTab.LIVE_ANALYSIS && <LiveAnalyzer />}
        {activeTab === AppTab.VIDEO_ANALYSIS && <VideoAnalyzer />}
        {activeTab === AppTab.VEO_STUDIO && <VeoStudio />}
        {activeTab === AppTab.THINKING_CHAT && <ThinkingChat />}
      </main>
    </div>
  );
};

export default App;