import React, { useRef, useState } from 'react';
import { analyzeFace } from '../services/geminiService';
import { AnalysisResult } from '../types';

const VideoAnalyzer: React.FC = () => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setResult(null);
    }
  };

  const analyzeCurrentFrame = async () => {
    if (!videoRef.current || analyzing) return;
    
    setAnalyzing(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        // Use Pro model here since video frame analysis is usually a manual, high-intent action
        const data = await analyzeFace(base64Image, true);
        setResult(data);
      }
    } catch (e) {
      console.error(e);
      alert("Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full p-4">
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl flex-1 flex flex-col items-center justify-center min-h-[400px]">
          {!videoSrc ? (
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                Upload Video
                <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
              </label>
              <p className="text-slate-500 mt-2 text-sm">MP4, WebM supported</p>
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col items-center">
              <video 
                ref={videoRef} 
                src={videoSrc} 
                controls 
                className="max-h-[500px] w-full rounded-lg bg-black"
              />
              <div className="flex gap-4 mt-6">
                <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  Change Video
                  <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
                </label>
                <button
                  onClick={analyzeCurrentFrame}
                  disabled={analyzing}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                >
                  {analyzing ? 'Scanning...' : 'Analyze This Frame'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="w-full md:w-80 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl animate-in slide-in-from-right-8 duration-500">
          <h3 className="text-xl font-bold text-white mb-6">Frame Analysis</h3>
          <div className="space-y-6">
             <div className="space-y-1">
                <span className="text-sm text-slate-400 uppercase tracking-wide">Estimated Age</span>
                <div className="text-2xl font-bold text-white">{result.age}</div>
             </div>
             <div className="space-y-1">
                <span className="text-sm text-slate-400 uppercase tracking-wide">Gender</span>
                <div className="text-2xl font-bold text-white capitalize">{result.gender}</div>
             </div>
             <div className="space-y-1">
                <span className="text-sm text-slate-400 uppercase tracking-wide">Expression</span>
                <div className="text-2xl font-bold text-indigo-400 capitalize">{result.expression}</div>
             </div>
             <div className="pt-4 border-t border-slate-700">
                <p className="text-slate-300 italic">"{result.summary}"</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoAnalyzer;