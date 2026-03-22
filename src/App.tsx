/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Music, 
  Sparkles, 
  Settings, 
  Home, 
  Library, 
  User, 
  Volume2, 
  Waves,
  Mic,
  Plus,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { cn } from './lib/utils';
import { generateMusicComposition, MusicComposition } from './services/musicService';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [composition, setComposition] = useState<MusicComposition | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const partRef = useRef<Tone.Part | null>(null);

  useEffect(() => {
    // Initialize Tone.js synth
    synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
    synthRef.current.set({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 }
    });

    return () => {
      synthRef.current?.dispose();
      partRef.current?.dispose();
    };
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setIsPlaying(false);
    Tone.Transport.stop();
    
    try {
      const result = await generateMusicComposition(prompt);
      setComposition(result);
      
      // Setup Tone.js sequence
      if (partRef.current) partRef.current.dispose();
      
      Tone.Transport.bpm.value = result.bpm;
      
      partRef.current = new Tone.Part((time, value) => {
        synthRef.current?.triggerAttackRelease(value.note, value.duration, time, value.velocity);
      }, result.sequence).start(0);
      
      partRef.current.loop = true;
      partRef.current.loopEnd = '2m'; // 2 bars loop

    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = async () => {
    if (!composition) return;
    
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    if (isPlaying) {
      Tone.Transport.pause();
    } else {
      Tone.Transport.start();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        const p = (Tone.Transport.seconds % (60 / Tone.Transport.bpm.value * 8)) / (60 / Tone.Transport.bpm.value * 8);
        setProgress(p * 100);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 h-16 glass-panel flex items-center justify-between px-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-headline font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Sonic Ether
          </h1>
        </div>
        <button className="p-2 rounded-full hover:bg-surface-container-highest transition-colors">
          <Settings className="w-5 h-5 text-on-surface-variant" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-48 px-6 max-w-lg mx-auto w-full flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            Sculpt your <span className="text-primary italic">soundscape</span>.
          </h2>
          <p className="text-on-surface-variant text-lg font-light">
            Turn your thoughts into atmospheric melodies.
          </p>
        </motion.div>

        {/* Prompt Input */}
        <div className="w-full space-y-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000"></div>
            <div className="relative bg-surface-container-low rounded-xl p-1 shadow-2xl">
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe a mood, a scene, or a feeling..."
                className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 p-6 text-lg min-h-[140px] resize-none focus:ring-0 leading-relaxed font-light"
              />
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className={cn(
              "w-full py-5 px-8 rounded-full font-headline font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-2xl",
              isGenerating ? "bg-surface-container-highest text-on-surface-variant cursor-not-allowed" : "bg-primary-container text-white hover:scale-[1.02] active:scale-95"
            )}
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Composing...
              </div>
            ) : (
              <>
                <Sparkles className="w-5 h-5 fill-current" />
                Generate Soundscape
              </>
            )}
          </button>
        </div>

        {/* Presets */}
        <div className="w-full mt-12 overflow-x-auto no-scrollbar">
          <div className="flex gap-3 pb-2">
            {['Chill', 'Cyberpunk', 'Ambient', 'Piano Solo', 'Dreamy'].map((tag) => (
              <button 
                key={tag}
                onClick={() => setPrompt(tag)}
                className="whitespace-nowrap py-2 px-6 rounded-full glass-panel text-on-surface border border-white/5 hover:bg-white/10 transition-colors text-[11px] uppercase tracking-widest font-bold"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Result Area */}
        <AnimatePresence>
          {composition && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full mt-12 space-y-6"
            >
              <div className="glass-panel rounded-2xl p-8 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <div className="flex gap-1 items-end h-8">
                    {[...Array(8)].map((_, i) => (
                      <motion.div 
                        key={i}
                        animate={{ 
                          height: isPlaying ? [10, 30, 15, 25, 10] : 10 
                        }}
                        transition={{ 
                          duration: 0.8, 
                          repeat: Infinity, 
                          delay: i * 0.1 
                        }}
                        className="w-1 bg-primary rounded-full"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-headline text-2xl font-bold mb-1">{composition.mood}</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    {composition.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                  <span className="bg-white/5 px-3 py-1 rounded-full">{composition.bpm} BPM</span>
                  <span className="bg-white/5 px-3 py-1 rounded-full">{composition.scale}</span>
                </div>

                <div className="flex items-center gap-6">
                  <button 
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl"
                  >
                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                  </button>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-on-surface-variant">
                      <span>0:00</span>
                      <span>0:08</span>
                    </div>
                    <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary"
                        animate={{ width: `${progress}%` }}
                        transition={{ type: 'tween', ease: 'linear' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Instruments Bento */}
              <div className="grid grid-cols-2 gap-4">
                {composition.instruments.map((inst, i) => (
                  <div key={i} className="glass-panel rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                      <Waves className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Layer</p>
                      <p className="text-sm font-bold capitalize">{inst}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md glass-panel rounded-full p-2 flex justify-around items-center shadow-2xl z-50">
        <button className="p-4 rounded-full bg-white/10 text-primary">
          <Home className="w-6 h-6" />
        </button>
        <button className="p-4 rounded-full text-on-surface-variant hover:text-on-surface transition-colors">
          <Library className="w-6 h-6" />
        </button>
        <button className="p-4 rounded-full text-on-surface-variant hover:text-on-surface transition-colors">
          <Sparkles className="w-6 h-6" />
        </button>
        <button className="p-4 rounded-full text-on-surface-variant hover:text-on-surface transition-colors">
          <User className="w-6 h-6" />
        </button>
      </nav>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 blur-[120px] rounded-full animate-pulse-glow" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/5 blur-[120px] rounded-full animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
}
