import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Pause, Play, CheckCircle2, X } from 'lucide-react';
import { Task } from '../types';
import confetti from 'canvas-confetti';

interface FocusModeProps {
  task: Task;
  onComplete: (id: string) => void;
  onCancel: () => void;
}

export const FocusMode = ({ task, onComplete, onCancel }: FocusModeProps) => {
  const [timeLeft, setTimeLeft] = useState(task.durationMinutes * 60);
  const [isActive, setIsActive] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Preload sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
  }, []);

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isFinished) {
      handleFinish();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isFinished]);

  const handleFinish = () => {
    setIsFinished(true);
    setIsActive(false);
    
    // Play sound
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.error("Error playing sound:", e));
    }

    // Trigger confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    // Auto-complete after a short delay to let the user enjoy the celebration
    setTimeout(() => {
      onComplete(task.id);
    }, 4000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / (task.durationMinutes * 60)) * 100;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary-container/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-tertiary-container/30 rounded-full blur-[100px] pointer-events-none"></div>

      <button 
        onClick={onCancel}
        className="absolute top-6 right-6 p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="text-center mb-12 space-y-2">
        <p className="text-on-surface-variant font-medium tracking-wide opacity-80">Respire fundo.</p>
        <h2 className="text-3xl font-bold tracking-tight text-on-surface">Vamos fazer só isso agora.</h2>
      </div>

      {/* Timer Circle */}
      <div className="relative flex items-center justify-center">
        <motion.div 
          animate={{ scale: [0.98, 1.02, 0.98] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[320px] h-[320px] md:w-[420px] md:h-[420px] rounded-full bg-primary-container/40"
        ></motion.div>
        
        <div className="relative w-72 h-72 md:w-96 md:h-96 bg-white rounded-full shadow-2xl flex flex-col items-center justify-center p-10 text-center border border-white/50 backdrop-blur-sm overflow-hidden">
          {/* Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle 
              cx="50" cy="50" r="48" 
              fill="none" 
              stroke="#ebeef0" 
              strokeWidth="4" 
            />
            <motion.circle 
              cx="50" cy="50" r="48" 
              fill="none" 
              stroke="#2c6a4e" 
              strokeWidth="4" 
              strokeDasharray="301.59"
              animate={{ strokeDashoffset: 301.59 * (1 - progress / 100) }}
              strokeLinecap="round"
            />
          </svg>

          <div className="relative z-10 space-y-4">
            <h3 className="text-2xl font-extrabold text-primary tracking-tight leading-tight px-4">
              {task.title}
            </h3>
            {task.observation && (
              <p className="text-xs italic text-on-surface-variant/70 px-6 line-clamp-2">
                "{task.observation}"
              </p>
            )}
            <div className="text-5xl font-black text-on-surface tracking-tighter">
              {formatTime(timeLeft)}
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-container/30 rounded-full">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-[10px] font-bold text-on-primary-container tracking-widest uppercase">Em Foco</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 flex items-center gap-6">
        <button 
          onClick={() => setIsActive(!isActive)}
          className="flex items-center gap-3 px-8 py-4 bg-surface-container rounded-full text-on-surface-variant font-bold hover:bg-surface-container-high transition-all active:scale-95"
        >
          {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          <span>{isActive ? 'Pausa' : 'Continuar'}</span>
        </button>
        <button 
          onClick={handleFinish}
          disabled={isFinished}
          className="flex items-center gap-3 px-12 py-5 bg-primary text-white rounded-full shadow-lg shadow-primary/20 hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
        >
          <CheckCircle2 className="w-6 h-6" />
          <span className="text-lg font-extrabold tracking-tight">Feito!</span>
        </button>
      </div>

      <div className="mt-12 text-on-surface-variant/60 font-medium text-sm italic">
        Sem pressa. O tempo é seu.
      </div>
    </div>
  );
};
