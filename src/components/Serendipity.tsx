import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Plus, Trash2, Cake, Music, Bath, Palette, Coffee, Book, Heart, Play } from 'lucide-react';
import { SerendipityActivity } from '../types';

interface SerendipityProps {
  activities: SerendipityActivity[];
  onAddActivity: (title: string) => void;
  onRemoveActivity: (id: string) => void;
  onStartFocus: (activity: SerendipityActivity, duration: number) => void;
}

const ICON_MAP: Record<string, any> = {
  music: Music,
  cake: Cake,
  bath: Bath,
  palette: Palette,
  coffee: Coffee,
  book: Book,
  heart: Heart
};

export const Serendipity = ({ activities, onAddActivity, onRemoveActivity, onStartFocus }: SerendipityProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SerendipityActivity | null>(null);
  const [newActivity, setNewActivity] = useState('');
  const [duration, setDuration] = useState(15);

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setResult(null);
    
    const extraSpins = 5 + Math.random() * 5;
    const newRotation = rotation + extraSpins * 360;
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const index = Math.floor(Math.random() * activities.length);
      setResult(activities[index]);
    }, 3000);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <section className="flex flex-col items-center text-center">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-primary mb-2">Serendipity</h2>
          <p className="text-on-surface-variant max-w-xs mx-auto">Deixe o destino escolher seu próximo momento de alegria.</p>
        </div>

        {/* The Wheel */}
        <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
          <motion.div 
            animate={{ rotate: rotation }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="w-full h-full rounded-full border-8 border-primary-container relative overflow-hidden shadow-xl"
            style={{ 
              background: `conic-gradient(from 0deg, #fef3c7 0% 25%, #fce7f3 25% 50%, #f3e8ff 50% 75%, #d1fae5 75% 100%)` 
            }}
          >
            {/* Simulated Spokes */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-px bg-primary/10 rotate-0"></div>
              <div className="w-full h-px bg-primary/10 rotate-45"></div>
              <div className="w-full h-px bg-primary/10 rotate-90"></div>
              <div className="w-full h-px bg-primary/10 rotate-135"></div>
            </div>

            {/* Labels */}
            {activities.slice(0, 4).map((activity, i) => (
              <div 
                key={activity.id}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ transform: `rotate(${i * 90}deg)` }}
              >
                <span className="absolute top-8 text-[10px] font-extrabold text-primary uppercase tracking-widest">
                  {activity.title}
                </span>
              </div>
            ))}

            {/* Center Hub */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-white rounded-full shadow-lg border-4 border-white/50 z-10 flex items-center justify-center">
                <div className="w-3 h-3 bg-primary/20 rounded-full"></div>
              </div>
            </div>
          </motion.div>

          {/* Pointer */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-primary"></div>
          </div>

          <AnimatePresence>
            {result && !isSpinning && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 z-30 flex items-center justify-center"
              >
                <div className="bg-white/95 backdrop-blur-md p-8 rounded-[40px] shadow-2xl border-2 border-primary-container text-center space-y-6 max-w-[280px] animate-in zoom-in duration-300">
                  <div className="bg-primary-container w-20 h-20 rounded-full flex items-center justify-center mx-auto text-primary shadow-inner">
                    <Sparkles className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-primary tracking-tight">{result.title}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">Sorteado com carinho</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col items-center gap-1">
                      <label className="text-[10px] font-bold uppercase text-outline">Quanto tempo?</label>
                      <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-2xl border border-outline-variant/30">
                        <button 
                          onClick={() => setDuration(Math.max(1, duration - 1))}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition-colors text-primary font-bold"
                        >
                          -
                        </button>
                        <span className="text-lg font-black text-on-surface min-w-[40px]">{duration}m</span>
                        <button 
                          onClick={() => setDuration(Math.min(120, duration + 1))}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition-colors text-primary font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => onStartFocus(result, duration)}
                      className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Iniciar Agora
                    </button>
                    
                    <button 
                      onClick={() => setResult(null)}
                      className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <button 
            onClick={spinWheel}
            disabled={isSpinning}
            className="bg-gradient-to-r from-primary-container to-primary-fixed-dim text-on-primary-container px-10 py-5 rounded-full font-bold text-xl shadow-lg flex items-center gap-3 active:scale-95 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-6 h-6" />
            Girar!
          </button>
          <p className="text-xs text-outline font-medium tracking-widest uppercase">Siga seu coração</p>
        </div>
      </section>

      {/* Activities List */}
      <section className="space-y-6">
        <div className="flex justify-between items-end px-2">
          <div>
            <h3 className="text-xl font-bold text-on-surface">Sua Arca de Diversão</h3>
            <p className="text-sm text-on-surface-variant">Atividades esperando para serem sorteadas</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={newActivity}
            onChange={(e) => setNewActivity(e.target.value)}
            placeholder="Adicionar nova diversão..."
            className="flex-1 bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary-container"
          />
          <button 
            onClick={() => {
              if (newActivity.trim()) {
                onAddActivity(newActivity);
                setNewActivity('');
              }
            }}
            className="bg-primary text-white p-3 rounded-2xl"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map(activity => {
            const IconComp = ICON_MAP[activity.icon] || Sparkles;
            return (
              <div key={activity.id} className="bg-surface-container-low p-4 rounded-2xl flex items-center justify-between group hover:bg-surface-container-high transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-container/40 rounded-xl flex items-center justify-center text-primary">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface">{activity.title}</h4>
                    <p className="text-[10px] text-on-surface-variant">Categoria: {activity.category}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onRemoveActivity(activity.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-outline hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
