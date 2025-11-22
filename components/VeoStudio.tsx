import React, { useState } from 'react';
import { generateVideo } from '../services/geminiService';

const VeoStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null); // base64 without prefix for API
  const [previewImage, setPreviewImage] = useState<string | null>(null); // full data url for UI
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
        setUploadedImage(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt && !uploadedImage) return;
    setGenerating(true);
    setVideoUrl(null);
    setError(null);

    try {
      // Check API key selection for Veo
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await window.aistudio.openSelectKey();
            // Assuming successful selection if promise resolves
        }
      }

      const url = await generateVideo(prompt, aspectRatio, uploadedImage || undefined);
      setVideoUrl(url);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Requested entity was not found")) {
         setError("API Key authorization failed. Please try again and select a valid project.");
         if(window.aistudio) await window.aistudio.openSelectKey();
      } else {
         setError("Video generation failed. Ensure your project has Veo access enabled.");
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 p-8 rounded-3xl border border-indigo-500/30 text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Veo Creative Studio</h2>
        <p className="text-indigo-200">Generate stunning videos from text prompts or animate your images.</p>
        <div className="mt-4 text-xs text-indigo-300/60 bg-indigo-900/40 inline-block px-3 py-1 rounded-full border border-indigo-500/20">
          Powered by veo-3.1-fast-generate-preview
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6 bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div>
            <label className="block text-slate-300 text-sm font-bold mb-2">Reference Image (Optional)</label>
            <div className={`relative h-48 border-2 border-dashed rounded-xl flex items-center justify-center transition-colors ${uploadedImage ? 'border-indigo-500 bg-slate-900' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'}`}>
              {previewImage ? (
                 <>
                   <img src={previewImage} alt="Reference" className="h-full w-full object-contain rounded-lg" />
                   <button onClick={() => { setUploadedImage(null); setPreviewImage(null); }} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-red-500/80">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                   </button>
                 </>
              ) : (
                <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                  <span className="text-slate-500">Click to upload image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-bold mb-2">Prompt</label>
            <textarea
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
              placeholder="Describe the video you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div>
             <label className="block text-slate-300 text-sm font-bold mb-2">Aspect Ratio</label>
             <div className="flex gap-4">
               <button 
                  onClick={() => setAspectRatio('16:9')}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium ${aspectRatio === '16:9' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                >
                  Landscape (16:9)
                </button>
                <button 
                  onClick={() => setAspectRatio('9:16')}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium ${aspectRatio === '9:16' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                >
                  Portrait (9:16)
                </button>
             </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || (!prompt && !uploadedImage)}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            {generating ? 'Generating (this may take a minute)...' : 'Generate Video'}
          </button>
          
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>

        <div className="bg-black rounded-2xl border border-slate-700 flex items-center justify-center overflow-hidden min-h-[300px]">
          {videoUrl ? (
            <video 
              src={videoUrl} 
              controls 
              autoPlay 
              loop
              className="w-full h-full object-contain"
            />
          ) : generating ? (
            <div className="text-center space-y-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              <p className="text-indigo-400 animate-pulse">Creating magic...</p>
            </div>
          ) : (
            <div className="text-slate-600 text-center p-8">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p>Preview will appear here</p>
            </div>
          )}
        </div>
      </div>
       <div className="text-center">
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-indigo-400 underline">
          Billing Information (Paid Project Required for Veo)
        </a>
      </div>
    </div>
  );
};

export default VeoStudio;