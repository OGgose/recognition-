import React, { useRef, useEffect, useState, useCallback } from 'react';
import { analyzeFace, generateSpeech } from '../services/geminiService';
import { AnalysisResult } from '../types';

const LiveAnalyzer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useProModel, setUseProModel] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setError(null);
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
    stopAutoMode();
  };

  const stopAutoMode = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setAutoMode(false);
  };

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || analyzing) return;

    setAnalyzing(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        
        const data = await analyzeFace(base64Image, useProModel);
        setResult(data);
        setError(null);
      }
    } catch (err: any) {
      console.error(err);
      // Don't set error string in auto mode to avoid flickering UI
      if (!autoMode) setError("Analysis failed. Try again.");
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, useProModel, autoMode]);

  const toggleAutoMode = () => {
    if (autoMode) {
      stopAutoMode();
    } else {
      setAutoMode(true);
      // Run immediately then interval
      captureAndAnalyze();
      intervalRef.current = window.setInterval(captureAndAnalyze, 4000); // Every 4 seconds to be safe with quota
    }
  };

  const speakResult = async () => {
    if (!result) return;
    try {
      const text = `I see a ${result.gender} around ${result.age} years old. They look ${result.expression}.`;
      const audioBuffer = await generateSpeech(text);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await ctx.decodeAudioData(audioBuffer);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col md:flex-row gap-6 h-full">
        {/* Left: Camera Feed */}
        <div className="flex-1 bg-slate-800 rounded-2xl overflow-hidden relative shadow-xl border border-slate-700 min-h-[300px] flex items-center justify-center">
          {!isStreaming && !error && (
            <button 
              onClick={startCamera}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-full font-semibold transition-all shadow-lg shadow-indigo-500/30"
            >
              Start Camera
            </button>
          )}
          {error && (
             <div className="text-red-400 p-4 text-center">
               <p>{error}</p>
               <button onClick={startCamera} className="mt-4 text-indigo-400 underline">Retry</button>
             </div>
          )}
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover ${!isStreaming ? 'hidden' : 'block'}`}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {analyzing && (
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-mono animate-pulse border border-white/20">
              ANALYZING...
            </div>
          )}
        </div>

        {/* Right: Controls & Results */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Settings
            </h3>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-300">High Accuracy (Slow)</span>
              <button 
                onClick={() => setUseProModel(!useProModel)}
                className={`w-12 h-6 rounded-full transition-colors relative ${useProModel ? 'bg-indigo-600' : 'bg-slate-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${useProModel ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={captureAndAnalyze}
                disabled={!isStreaming || autoMode}
                className="col-span-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Analyze Once
              </button>
              <button
                onClick={toggleAutoMode}
                disabled={!isStreaming}
                className={`col-span-1 py-2 rounded-lg text-sm font-medium transition-colors ${autoMode ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
              >
                {autoMode ? 'Stop Auto' : 'Auto Loop'}
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl min-h-[200px]">
            <h3 className="text-lg font-bold text-white mb-4">Results</h3>
            {result ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-700/50 p-3 rounded-xl border border-slate-600">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Age</p>
                    <p className="text-xl font-bold text-white">{result.age}</p>
                  </div>
                  <div className="bg-slate-700/50 p-3 rounded-xl border border-slate-600">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Gender</p>
                    <p className="text-xl font-bold text-white capitalize">{result.gender}</p>
                  </div>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-xl border border-slate-600">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Expression</p>
                  <p className="text-lg font-medium text-indigo-300 capitalize">{result.expression}</p>
                </div>
                 <div className="bg-slate-700/50 p-3 rounded-xl border border-slate-600">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Summary</p>
                  <p className="text-sm text-slate-300 mt-1">{result.summary}</p>
                </div>
                
                <button 
                  onClick={speakResult}
                  className="w-full flex items-center justify-center gap-2 py-2 mt-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-600/30 transition-colors"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 11H1a1 1 0 01-1-1V6a1 1 0 011-1h3.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Listen
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm italic">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No data collected yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAnalyzer;