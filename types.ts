export interface AnalysisResult {
  age: string;
  gender: string;
  expression: string;
  summary: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  groundingUrls?: string[];
}

export enum AppTab {
  LIVE_ANALYSIS = 'LIVE_ANALYSIS',
  VIDEO_ANALYSIS = 'VIDEO_ANALYSIS',
  VEO_STUDIO = 'VEO_STUDIO',
  THINKING_CHAT = 'THINKING_CHAT',
}

// Global declaration for Veo API Key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
