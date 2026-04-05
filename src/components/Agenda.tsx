import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, CheckCircle2, Edit2, Trash2, MoreVertical, Play } from 'lucide-react';
import { Task, EnergyLevel } from '../types';
import { EnergyIcon } from './EnergyIcon';
import { parseLocalDate } from '../lib/taskUtils';

interface AgendaProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string, dateStr?: string) => void;
  onStartFocus: (task: Task) => void;
}

export const Agenda = ({ tasks, onToggleTask, onEditTask, onDeleteTask, onStartFocus }: AgendaProps) => {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  
  // Helper to check if a task is "complex"
  const isComplex = (energy: EnergyLevel) => energy >= 4;

  // Task Scheduler Logic
  const scheduledTasks = useMemo(() => {
    const start = new Date(viewDate);
    if (view === 'weekly') {
      start.setDate(viewDate.getDate() - viewDate.getDay());
    } else {
      start.setDate(1);
    }
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    if (view === 'weekly') {
      end.setDate(start.getDate() + 7);
    } else {
      end.setMonth(start.getMonth() + 1);
    }

    const schedule: Record<string, Task[]> = {};
    const daysInRange: Date[] = [];
    let curr = new Date(start);
    while (curr < end) {
      daysInRange.push(new Date(curr));
      schedule[curr.toDateString()] = [];
      curr.setDate(curr.getDate() + 1);
    }

    // 1. Place Fixed Tasks (Daily, Specific Days, Deadlines, Scheduled)
    const flexibleTasks: Task[] = [];

    tasks.forEach(task => {
      const isFlexible = !task.deadline && (!task.repetition || (task.repetition.type === 'none' && !task.repetition.days));
      
      if (isFlexible) {
        // Flexible tasks with type 'none' are now handled in the "Para depois" section on Home
        // and are NOT scheduled in the Agenda.
        return;
      }

      daysInRange.forEach(date => {
        let shouldInclude = false;
        let isOverdue = false;
        const dateStr = date.toDateString();

        // Check Scheduled Date
        if (task.scheduledDate && !task.deadline) {
          const sDate = parseLocalDate(task.scheduledDate);
          if (sDate.toDateString() === dateStr) shouldInclude = true;
        }

        // Check Deadline
        if (task.deadline) {
          const dDate = parseLocalDate(task.deadline);
          if (dDate.toDateString() === dateStr) shouldInclude = true;

          // Overdue Logic: If task has a deadline, is not completed, and the deadline is in the past
          // We show it on the current day (today)
          if (!task.completed) {
            const deadlineDate = parseLocalDate(task.deadline);
            deadlineDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);

            if (deadlineDate < today && targetDate.getTime() === today.getTime()) {
              shouldInclude = true;
              isOverdue = true;
            }
          }
        }

        // Check Repetition
        if (task.repetition) {
          const taskStartDate = parseLocalDate(task.scheduledDate);
          taskStartDate.setHours(0, 0, 0, 0);
          const currentDayDate = new Date(date);
          currentDayDate.setHours(0, 0, 0, 0);

          // Only repeat if the current day is after or equal to the start date
          if (currentDayDate >= taskStartDate) {
            const diffTime = Math.abs(currentDayDate.getTime() - taskStartDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            switch (task.repetition.type) {
              case 'today':
                if (taskStartDate.toDateString() === dateStr) shouldInclude = true;
                break;
              case 'daily':
                shouldInclude = true;
                break;
              case 'weekly':
                if (task.repetition.days && task.repetition.days.includes(date.getDay())) {
                  shouldInclude = true;
                } else if (!task.repetition.days && date.getDay() === taskStartDate.getDay()) {
                  // Fallback to the same day of week if no specific days selected
                  shouldInclude = true;
                }
                break;
              case 'biweekly':
                if (diffDays % 14 === 0) shouldInclude = true;
                break;
              case 'monthly':
                if (currentDayDate.getDate() === taskStartDate.getDate()) shouldInclude = true;
                break;
              case 'bimonthly':
                // Check if it's the same day of month and every 2 months
                if (currentDayDate.getDate() === taskStartDate.getDate()) {
                  const monthDiff = (currentDayDate.getFullYear() - taskStartDate.getFullYear()) * 12 + (currentDayDate.getMonth() - taskStartDate.getMonth());
                  if (monthDiff % 2 === 0) shouldInclude = true;
                }
                break;
              case 'trimonthly':
              case 'quarterly':
                if (currentDayDate.getDate() === taskStartDate.getDate()) {
                  const monthDiff = (currentDayDate.getFullYear() - taskStartDate.getFullYear()) * 12 + (currentDayDate.getMonth() - taskStartDate.getMonth());
                  if (monthDiff % 3 === 0) shouldInclude = true;
                }
                break;
              case 'semiannual':
                if (currentDayDate.getDate() === taskStartDate.getDate()) {
                  const monthDiff = (currentDayDate.getFullYear() - taskStartDate.getFullYear()) * 12 + (currentDayDate.getMonth() - taskStartDate.getMonth());
                  if (monthDiff % 6 === 0) shouldInclude = true;
                }
                break;
              case 'annual':
                if (currentDayDate.getDate() === taskStartDate.getDate() && currentDayDate.getMonth() === taskStartDate.getMonth()) {
                  shouldInclude = true;
                }
                break;
            }
          }
        }

        if (shouldInclude) {
          // Check if this instance was deleted
          if (!task.deletedInstances?.includes(dateStr)) {
            schedule[dateStr].push({ ...task, isOverdue });
          }
        }
      });
    });

    // 2. Place Flexible Tasks with Energy Balancing
    // Sort flexible tasks: Complex first
    const sortedFlexible = [...flexibleTasks].sort((a, b) => b.energyLevel - a.energyLevel);

    sortedFlexible.forEach(task => {
      // For simplicity, we place flexible tasks once per period (week or month)
      // In a real app, this would be more sophisticated
      
      // Find the "best" day in the current range
      let bestDateStr = daysInRange[0].toDateString();
      let minComplexCount = Infinity;
      let minTotalEnergy = Infinity;

      daysInRange.forEach(date => {
        const dateStr = date.toDateString();
        
        // Check if this instance was deleted
        if (task.deletedInstances?.includes(dateStr)) return;

        const dayTasks = schedule[dateStr];
        const complexCount = dayTasks.filter(t => isComplex(t.energyLevel)).length;
        const totalEnergy = dayTasks.reduce((sum, t) => sum + t.energyLevel, 0);

        if (complexCount < minComplexCount) {
          minComplexCount = complexCount;
          minTotalEnergy = totalEnergy;
          bestDateStr = dateStr;
        } else if (complexCount === minComplexCount && totalEnergy < minTotalEnergy) {
          minTotalEnergy = totalEnergy;
          bestDateStr = dateStr;
        }
      });

      // Apply "Maximum 1 complex task per day" rule for flexible tasks
      if (isComplex(task.energyLevel) && minComplexCount >= 1) {
        // If we already have a complex task on every day, we still have to place it somewhere
        // but we'll stick to the best one found.
      }

      if (!task.deletedInstances?.includes(bestDateStr)) {
        schedule[bestDateStr].push(task);
      }
    });

    return schedule;
  }, [tasks, viewDate, view]);

  const currentTasks = scheduledTasks[selectedDate.toDateString()] || [];

  const handlePrev = () => {
    const newDate = new Date(viewDate);
    if (view === 'weekly') {
      newDate.setDate(viewDate.getDate() - 7);
    } else {
      newDate.setMonth(viewDate.getMonth() - 1);
    }
    setViewDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(viewDate);
    if (view === 'weekly') {
      newDate.setDate(viewDate.getDate() + 7);
    } else {
      newDate.setMonth(viewDate.getMonth() + 1);
    }
    setViewDate(newDate);
  };

  const getFormattedRange = () => {
    const monthName = viewDate.toLocaleString('pt-BR', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    const year = viewDate.getFullYear();

    if (view === 'monthly') {
      return `${capitalizedMonth} ${year}`;
    }

    const start = new Date(viewDate);
    start.setDate(viewDate.getDate() - viewDate.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    if (start.getMonth() === end.getMonth()) {
      return `${capitalizedMonth} ${start.getDate()} - ${end.getDate()} ${year}`;
    } else {
      const startMonthShort = start.toLocaleString('pt-BR', { month: 'short' });
      const capitalizedStartMonth = startMonthShort.charAt(0).toUpperCase() + startMonthShort.slice(1);
      const endMonthShort = end.toLocaleString('pt-BR', { month: 'short' });
      const capitalizedEndMonth = endMonthShort.charAt(0).toUpperCase() + endMonthShort.slice(1);
      return `${capitalizedStartMonth.replace('.', '')} ${start.getDate()} - ${capitalizedEndMonth.replace('.', '')} ${end.getDate()} ${end.getFullYear()}`;
    }
  };

  // Generate current week based on viewDate
  const startOfWeek = new Date(viewDate);
  startOfWeek.setDate(viewDate.getDate() - viewDate.getDay());
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  // Generate month days
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const lastDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Generate days for energy flow chart
  const flowDays = useMemo(() => {
    const start = new Date(viewDate);
    if (view === 'weekly') {
      start.setDate(viewDate.getDate() - viewDate.getDay());
    } else {
      start.setDate(1);
    }
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    if (view === 'weekly') {
      end.setDate(start.getDate() + 7);
    } else {
      end.setMonth(start.getMonth() + 1);
    }

    const days: Date[] = [];
    let curr = new Date(start);
    while (curr < end) {
      days.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  }, [viewDate, view]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* View Switcher & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">
            {view === 'weekly' ? 'Jornada Semanal' : 'Jornada Mensal'}
          </h2>
          <div className="flex items-center gap-3 text-primary">
            <button 
              onClick={handlePrev}
              className="p-1 hover:bg-primary-container/20 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <p className="text-sm font-bold min-w-[120px] text-center">
              {getFormattedRange()}
            </p>
            <button 
              onClick={handleNext}
              className="p-1 hover:bg-primary-container/20 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-full">
          <button 
            onClick={() => setView('weekly')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${view === 'weekly' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
          >
            Semana
          </button>
          <button 
            onClick={() => setView('monthly')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${view === 'monthly' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
          >
            Mês
          </button>
        </div>
      </div>

      {/* Weekly Horizontal Calendar */}
      {view === 'weekly' && (
        <section className="flex gap-3 overflow-x-auto no-scrollbar py-2">
          {weekDays.map((date, i) => {
            const isActive = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            const dayTasks = scheduledTasks[date.toDateString()] || [];
            const hasImportant = dayTasks.some(t => t.energyLevel >= 4);

            return (
              <button 
                key={i}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center gap-2 min-w-[64px] p-4 rounded-2xl transition-all relative ${isActive ? 'bg-primary-container text-primary shadow-md scale-105' : 'bg-surface-container-low text-on-surface-variant'} ${isToday && !isActive ? 'ring-1 ring-primary/30' : ''}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest">{days[date.getDay()]}</span>
                <span className="text-lg font-extrabold">{date.getDate()}</span>
                {hasImportant && (
                  <div className={`absolute bottom-2 w-1 h-1 rounded-full ${isActive ? 'bg-primary' : 'bg-primary/40'}`}></div>
                )}
              </button>
            );
          })}
        </section>
      )}

      {/* Monthly Grid */}
      {view === 'monthly' && (
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-surface-container">
          <div className="grid grid-cols-7 gap-y-4 text-center mb-4">
            {days.map(d => (
              <span key={d} className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">{d[0]}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before the first of the month */}
            {Array.from({ length: startingDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="h-10"></div>
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
              const isActive = date.toDateString() === selectedDate.toDateString();
              const isToday = date.toDateString() === new Date().toDateString();
              const dayTasks = scheduledTasks[date.toDateString()] || [];
              const hasImportant = dayTasks.some(t => t.energyLevel >= 4);
              
              return (
                <button 
                  key={day} 
                  onClick={() => setSelectedDate(date)}
                  className={`h-10 flex flex-col items-center justify-center rounded-full text-sm font-bold transition-all relative ${isActive ? 'bg-primary text-white shadow-md' : 'hover:bg-primary-container/20'} ${isToday && !isActive ? 'text-primary border border-primary/30' : ''}`}
                >
                  <span>{day}</span>
                  {hasImportant && (
                    <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isActive ? 'bg-white' : 'bg-primary/40'}`}></div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Energy Allocation Insight */}
      <section className="bg-primary-container/20 p-5 rounded-2xl border border-primary-container/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-on-primary-container">Energy Flow</h3>
          <div className="flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded-full">
            <span className="text-[10px] font-bold uppercase text-primary">
              {view === 'weekly' ? 'Semanal' : 'Mensal'}
            </span>
          </div>
        </div>
        <div className="flex items-end gap-1.5 h-16 overflow-x-auto no-scrollbar">
          {flowDays.map((date, i) => {
            const dayTasks = scheduledTasks[date.toDateString()] || [];
            const totalEnergy = dayTasks.reduce((sum, t) => sum + t.energyLevel, 0);
            const maxPossibleEnergy = 15; // Arbitrary max for scaling
            const height = Math.min(100, (totalEnergy / maxPossibleEnergy) * 100);
            const isSelected = date.toDateString() === selectedDate.toDateString();
            
            return (
              <button 
                key={i} 
                onClick={() => setSelectedDate(date)}
                className={`flex-1 min-w-[8px] rounded-t-lg transition-all hover:opacity-80 active:scale-95 ${isSelected ? 'bg-primary' : 'bg-primary/20'}`} 
                style={{ height: `${Math.max(10, height)}%` }}
                title={date.toLocaleDateString('pt-BR')}
              ></button>
            );
          })}
        </div>
        <p className="text-[10px] text-center text-on-primary-container/60 font-medium mt-3">
          Distribuição automática para equilíbrio mental
        </p>
      </section>

      {/* Task List */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold tracking-tight">Fluxo de Hoje</h3>
        <div className="space-y-4">
          {currentTasks.length > 0 ? (
            currentTasks.map(task => (
              <div 
                key={task.id} 
                className={`group p-5 rounded-2xl shadow-sm flex items-center justify-between border-l-4 transition-all hover:brightness-95 ${activeMenu === task.id ? 'z-30 relative' : 'z-0'} ${task.completed ? 'bg-surface-container-low opacity-60' : task.isOverdue ? 'bg-error-container/10 border-error' : 'bg-white border-primary'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${task.completed ? 'bg-surface-container-high' : task.isOverdue ? 'bg-error-container/40 text-error' : 'bg-primary-container/40 text-primary'}`}>
                    <EnergyIcon level={task.energyLevel} />
                  </div>
                  <div className="space-y-1">
                    <h4 className={`font-bold ${task.completed ? 'text-on-surface line-through' : task.isOverdue ? 'text-error' : 'text-on-surface'}`}>{task.title}</h4>
                    {task.observation && (
                      <p className={`text-[10px] italic ${task.isOverdue ? 'text-error/60' : 'text-on-surface-variant'}`}>
                        "{task.observation}"
                      </p>
                    )}
                    <span className={`text-[10px] font-medium flex items-center gap-1 ${task.isOverdue ? 'text-error/70' : 'text-on-surface-variant'}`}>
                      <Clock className="w-3 h-3" /> {task.scheduledTime || (task.deadline && task.deadline.includes('T') ? task.deadline.split('T')[1].slice(0, 5) : '09:00')} • {task.category}
                      {task.deadline && (
                        <span className={`ml-2 font-bold ${task.isOverdue ? 'text-error' : 'text-secondary'}`}>
                          • Deadline: {parseLocalDate(task.deadline).toLocaleDateString('pt-BR')}
                        </span>
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
                            onDeleteTask(task.id, selectedDate.toDateString());
                            setActiveMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-error hover:bg-error/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-error" /> Excluir apenas hoje
                        </button>
                        <button 
                          onClick={() => {
                            onDeleteTask(task.id);
                            setActiveMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-error hover:bg-error/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-error" /> Excluir todos
                        </button>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => onToggleTask(task.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-primary border-primary text-white' : 'border-outline-variant hover:border-primary'}`}
                  >
                    {task.completed && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant">
              <p className="text-on-surface-variant font-medium">Nenhuma tarefa para este dia.</p>
              <p className="text-xs text-on-surface-variant/60">Aproveite para descansar!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
