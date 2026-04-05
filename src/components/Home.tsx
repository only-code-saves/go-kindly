import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Clock, CheckCircle2, AlertCircle, Sparkles, Sprout, Trash2, Edit2, MoreVertical, Heart } from 'lucide-react';
import { Task, AppView } from '../types';
import { EnergyIcon } from './EnergyIcon';
import { GoogleGenAI } from "@google/genai";
import { calculateEarnedBadges } from '../lib/badgeUtils';
import { getTaskInstancesInRange, parseLocalDate, isSameDay } from '../lib/taskUtils';

interface HomeProps {
  tasks: Task[];
  onStartFocus: (task: Task) => void;
  onViewChange: (view: AppView) => void;
  onDeleteTask: (id: string, dateStr?: string) => void;
  onToggleTask: (id: string) => void;
  onEditTask: (task: Task) => void;
}

export const Home = ({ tasks, onStartFocus, onViewChange, onDeleteTask, onToggleTask, onEditTask }: HomeProps) => {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const earnedBadges = useMemo(() => calculateEarnedBadges(tasks), [tasks]);
  const lastBadge = earnedBadges.length > 0 ? earnedBadges[earnedBadges.length - 1] : null;

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const todayInstances = getTaskInstancesInRange(tasks, todayStart, todayEnd);
    const weekInstances = getTaskInstancesInRange(tasks, startOfWeek, endOfWeek);
    const monthInstances = getTaskInstancesInRange(tasks, startOfMonth, endOfMonth);

    const todayCompleted = todayInstances.filter(i => i.task.completed && i.task.completedDate && isSameDay(parseLocalDate(i.task.completedDate), i.date)).length;
    const weekCompleted = weekInstances.filter(i => i.task.completed && i.task.completedDate && isSameDay(parseLocalDate(i.task.completedDate), i.date)).length;
    const monthCompleted = monthInstances.filter(i => i.task.completed && i.task.completedDate && isSameDay(parseLocalDate(i.task.completedDate), i.date)).length;

    const pendingCount = tasks.filter(t => {
      if (t.completed || !t.deadline) return false;
      const dDate = parseLocalDate(t.deadline);
      dDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dDate < today;
    }).length;

    return { 
      todayCompleted, todayTotal: todayInstances.length,
      weekCompleted, weekTotal: weekInstances.length,
      monthCompleted, monthTotal: monthInstances.length,
      pendingCount
    };
  }, [tasks]);

  // Scheduled tasks are those that have a deadline, specific days, or daily repetition
  const isScheduled = (task: Task) => {
    return !!task.deadline || (!!task.repetition && (task.repetition.type !== 'none' || !!task.repetition.days));
  };

  const scheduledTasks = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    // Get instances for today to filter only tasks that should appear today
    const todayInstances = getTaskInstancesInRange(tasks, today, todayEnd);
    const todayTaskIds = new Set(todayInstances.map(i => i.task.id));

    return tasks
      .filter(t => isScheduled(t) && todayTaskIds.has(t.id))
      .map(t => {
        if (t.deadline && !t.completed) {
          const dDate = parseLocalDate(t.deadline);
          dDate.setHours(0, 0, 0, 0);
          if (dDate < today) return { ...t, isOverdue: true };
        }
        return t;
      })
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return 0;
      });
  }, [tasks]);

  const forLaterTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks
      .filter(t => !isScheduled(t))
      .map(t => {
        if (t.deadline && !t.completed) {
          const dDate = parseLocalDate(t.deadline);
          dDate.setHours(0, 0, 0, 0);
          if (dDate < today) return { ...t, isOverdue: true };
        }
        return t;
      });
  }, [tasks]);
  
  const nextTask = scheduledTasks.find(t => !t.completed);

  const getSmartSuggestion = async () => {
    // Check cache first
    const cached = localStorage.getItem('smart_suggestion');
    if (cached) {
      try {
        const { text, timestamp, expires } = JSON.parse(cached);
        const cacheDuration = expires || (60 * 60 * 1000); // Default 1 hour
        if (Date.now() - timestamp < cacheDuration) {
          setSuggestion(text);
          return;
        }
      } catch (e) {
        localStorage.removeItem('smart_suggestion');
      }
    }

    setLoadingSuggestion(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on these tasks: ${JSON.stringify(tasks)}, give a very short, gentle, and encouraging "Go Kindly" style suggestion for the day. Max 15 words. Portuguese.`,
      });
      
      const text = response.text || "Você está indo muito bem!";
      setSuggestion(text);
      // Cache successful response for 4 hours
      localStorage.setItem('smart_suggestion', JSON.stringify({ 
        text, 
        timestamp: Date.now(),
        expires: 4 * 60 * 60 * 1000
      }));
    } catch (error: any) {
      const errorStr = JSON.stringify(error);
      const isQuotaError = errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED');
      
      if (isQuotaError) {
        console.warn('Gemini API quota exceeded. Using fallback and extending cache.');
      } else {
        console.error('Gemini API Error:', error);
      }
      
      // Fallback suggestions
      const fallbacks = [
        "Lembre-se de respirar fundo hoje.",
        "Um passo de cada vez é o suficiente.",
        "Sua gentileza com você mesmo é sua maior força.",
        "O progresso lento ainda é progresso.",
        "Trate-se com o mesmo carinho que trata os outros.",
        "A calma é um superpoder. Use-a hoje.",
        "Você não precisa dar conta de tudo agora.",
        "Gentileza gera gentileza, começando por você."
      ];
      const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      setSuggestion(randomFallback);

      // If quota exceeded, cache the fallback for 24 hours to stop hitting the API
      if (isQuotaError) {
        localStorage.setItem('smart_suggestion', JSON.stringify({ 
          text: randomFallback, 
          timestamp: Date.now(), 
          expires: 24 * 60 * 60 * 1000 
        }));
      }
    } finally {
      setLoadingSuggestion(false);
    }
  };

  useEffect(() => {
    getSmartSuggestion();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Mascot Greeting */}
      <section className="flex flex-col items-center text-center space-y-4 py-4">
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-primary-container/30 blur-3xl rounded-full"></div>
          <div className="w-24 h-24 bg-primary-container/40 rounded-full flex items-center justify-center relative">
            <Sprout className="w-12 h-12 text-primary" />
          </div>
        </motion.div>
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">Olá! Vamos cuidar de hoje?</h2>
          <p className="text-on-surface-variant font-medium">
            {stats.todayTotal > 0 
              ? `Hoje temos ${stats.todayTotal} tarefas leves. Sem pressa!`
              : "Tudo pronto por hoje! Que tal um momento serendipity?"}
          </p>
        </div>
      </section>

      {/* Smart Suggestion */}
      <AnimatePresence>
        {suggestion && (
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-tertiary-container/40 p-4 rounded-2xl border border-tertiary-container relative overflow-hidden"
          >
            <div className="flex gap-3 items-start">
              <div className="bg-tertiary-container p-2 rounded-full text-on-tertiary-container">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <p className="text-sm font-medium text-on-tertiary-container leading-relaxed">
                {suggestion}
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Next Task Focus Card */}
      {nextTask && (
        <section className="relative">
          <div className={`absolute top-0 right-0 -mt-2 -mr-2 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest z-10 ${nextTask.isOverdue ? 'bg-error' : 'bg-secondary'}`}>
            {nextTask.isOverdue ? 'Atrasada' : 'Próxima'}
          </div>
          <div className={`p-6 rounded-3xl shadow-sm border space-y-6 transition-all ${nextTask.isOverdue ? 'bg-error-container/10 border-error' : 'bg-white border-surface-container'}`}>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className={`text-xl font-bold tracking-tight leading-tight ${nextTask.isOverdue ? 'text-error' : 'text-on-surface'}`}>
                  {nextTask.title}
                </h3>
                {nextTask.observation && (
                  <p className={`text-xs italic ${nextTask.isOverdue ? 'text-error/60' : 'text-on-surface-variant'}`}>
                    "{nextTask.observation}"
                  </p>
                )}
                <div className="space-y-1">
                  <p className={`flex items-center gap-2 text-sm ${nextTask.isOverdue ? 'text-error/70' : 'text-on-surface-variant'}`}>
                    <Clock className="w-4 h-4" />
                    {nextTask.scheduledTime || (nextTask.deadline && nextTask.deadline.includes('T') ? nextTask.deadline.split('T')[1].slice(0, 5) : '09:00')} • {nextTask.durationMinutes} min • Energia {nextTask.energyLevel}
                  </p>
                  {nextTask.isOverdue && nextTask.deadline && (
                    <p className="text-error text-[10px] font-bold uppercase tracking-wider">
                      Venceu em: {parseLocalDate(nextTask.deadline).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className={`p-3 rounded-2xl ${nextTask.isOverdue ? 'bg-error-container/40 text-error' : 'bg-primary-container/40 text-primary'}`}>
                  <EnergyIcon level={nextTask.energyLevel} />
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === `next-${nextTask.id}` ? null : `next-${nextTask.id}`)}
                    className={`p-2 hover:bg-surface-container-high rounded-full transition-colors ${nextTask.isOverdue ? 'text-error/60 hover:text-error' : 'text-on-surface-variant'}`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {activeMenu === `next-${nextTask.id}` && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-surface-container p-1 z-30 min-w-[120px] animate-in fade-in zoom-in-95 duration-200">
                      <button 
                        onClick={() => {
                          onEditTask(nextTask);
                          setActiveMenu(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-on-surface hover:bg-primary-container/20 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3 h-3 text-primary" /> Editar
                      </button>
                      <button 
                        onClick={() => {
                          onDeleteTask(nextTask.id, new Date().toDateString());
                          setActiveMenu(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-error hover:bg-error/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-error" /> Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={() => onStartFocus(nextTask)}
              className={`w-full py-4 rounded-full font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all ${nextTask.isOverdue ? 'bg-error text-white shadow-error/20' : 'bg-primary text-white shadow-primary/20'}`}
            >
              <Play className="w-5 h-5 fill-current" />
              Iniciar Modo Foco
            </button>
          </div>
        </section>
      )}

      {/* Quick Stats */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-primary-container/40 p-5 rounded-2xl flex flex-col justify-between">
          <CheckCircle2 className="w-8 h-8 text-primary" />
          <div className="mt-4 space-y-1">
            <div className="flex items-baseline gap-1 mb-1">
              <span className={`text-xs font-bold uppercase ${stats.pendingCount > 0 ? 'text-error' : 'text-primary'}`}>
                {stats.pendingCount} Pendentes
              </span>
            </div>
            <div className="flex items-baseline gap-1 border-t border-primary-container/20 pt-1">
              <span className="text-2xl font-bold text-primary">{stats.todayCompleted}</span>
              <span className="text-lg font-bold text-error">/{stats.todayTotal}</span>
              <span className="text-[10px] font-bold text-on-primary-container/60 uppercase ml-1">Hoje</span>
            </div>
            <div className="flex items-baseline gap-1 border-t border-primary-container/20 pt-1">
              <span className="text-lg font-bold text-primary">{stats.weekCompleted}</span>
              <span className="text-sm font-bold text-error">/{stats.weekTotal}</span>
              <span className="text-[10px] font-bold text-on-primary-container/60 uppercase ml-1">Semana</span>
            </div>
            <div className="flex items-baseline gap-1 border-t border-primary-container/20 pt-1">
              <span className="text-lg font-bold text-primary">{stats.monthCompleted}</span>
              <span className="text-sm font-bold text-error">/{stats.monthTotal}</span>
              <span className="text-[10px] font-bold text-on-primary-container/60 uppercase ml-1">Mês</span>
            </div>
          </div>
        </div>
        <div className="bg-secondary-container/40 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <Sparkles className="w-8 h-8 text-secondary" />
            {lastBadge && (
              <div className="bg-white/50 p-2 rounded-xl border border-secondary/20">
                <lastBadge.icon className="w-6 h-6 text-secondary" />
              </div>
            )}
          </div>
          <div>
            <p className="text-2xl font-bold text-on-secondary-container">{earnedBadges.length}</p>
            <p className="text-xs text-on-secondary-container/70 font-bold uppercase">Badges</p>
            {lastBadge && (
              <p className="text-[8px] text-secondary font-bold uppercase mt-1 truncate">Última: {lastBadge.name}</p>
            )}
          </div>
        </div>
      </section>

      {/* Task List Preview (Para Depois) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="font-bold text-on-surface-variant uppercase text-xs tracking-widest">Para depois</h4>
          <span className="text-[10px] font-bold text-outline uppercase tracking-widest bg-surface-container px-2 py-0.5 rounded-full">
            {forLaterTasks.length} tarefas
          </span>
        </div>
        <div className="space-y-3">
          {forLaterTasks.length > 0 ? (
            forLaterTasks.map(task => (
              <div 
                key={task.id} 
                className={`group p-4 rounded-2xl shadow-sm flex items-center justify-between border-l-4 transition-all hover:brightness-95 ${activeMenu === task.id ? 'z-30 relative' : 'z-0'} ${task.completed ? 'bg-surface-container-low opacity-60' : task.isOverdue ? 'bg-error-container/10 border-error' : 'bg-white border-primary'}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <button 
                    onClick={() => onToggleTask(task.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-primary border-primary text-white' : task.isOverdue ? 'border-error hover:bg-error/10' : 'border-outline-variant hover:border-primary'}`}
                  >
                    {task.completed && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <div className="space-y-0.5">
                    <h4 className={`font-bold text-sm ${task.completed ? 'text-on-surface line-through' : task.isOverdue ? 'text-error' : 'text-on-surface'}`}>{task.title}</h4>
                    {task.observation && (
                      <p className={`text-[10px] italic ${task.isOverdue ? 'text-error/60' : 'text-on-surface-variant'}`}>
                        "{task.observation}"
                      </p>
                    )}
                    <span className={`text-[10px] font-medium flex items-center gap-1 ${task.isOverdue ? 'text-error/70' : 'text-on-surface-variant'}`}>
                      <Clock className="w-3 h-3" /> {task.scheduledTime || (task.deadline && task.deadline.includes('T') ? task.deadline.split('T')[1].slice(0, 5) : '09:00')} • {task.durationMinutes} min • {task.category}
                      {task.isOverdue && task.deadline && (
                        <span className="ml-1 font-bold">• Venceu: {parseLocalDate(task.deadline).toLocaleDateString('pt-BR')}</span>
                      )}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!task.completed && (
                    <button 
                      onClick={() => onStartFocus(task)}
                      className={`p-2 rounded-full transition-colors ${task.isOverdue ? 'text-error hover:bg-error-container/20' : 'text-primary hover:bg-primary-container/20'}`}
                      title="Iniciar Foco"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  )}
                  
                  <div className="relative">
                    <button 
                      onClick={() => setActiveMenu(activeMenu === task.id ? null : task.id)}
                      className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {activeMenu === task.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-surface-container p-1 z-10 min-w-[120px] animate-in fade-in zoom-in-95 duration-200">
                        <button 
                          onClick={() => {
                            onEditTask(task);
                            setActiveMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-on-surface hover:bg-primary-container/20 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3 h-3 text-primary" /> Editar
                        </button>
                        <button 
                          onClick={() => {
                            onDeleteTask(task.id);
                            setActiveMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-error hover:bg-error/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-error" /> Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/30">
              <p className="text-on-surface-variant text-xs font-medium">Nenhuma tarefa "Para depois".</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
