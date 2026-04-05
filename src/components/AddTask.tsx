import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Info, Wand2, Calendar, Clock, Tag, ChevronDown } from 'lucide-react';
import { EnergyLevel, Task, RepetitionType } from '../types';
import { EnergyIcon } from './EnergyIcon';

interface AddTaskProps {
  onAdd: (task: Omit<Task, 'id' | 'completed'>) => void;
  onCancel: () => void;
  editingTask?: Task | null;
}

export const AddTask = ({ onAdd, onCancel, editingTask }: AddTaskProps) => {
  const [title, setTitle] = useState(editingTask?.title || '');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(editingTask?.energyLevel || 3);
  const [hours, setHours] = useState(Math.floor((editingTask?.durationMinutes || 30) / 60));
  const [minutes, setMinutes] = useState((editingTask?.durationMinutes || 30) % 60);
  const [category, setCategory] = useState(editingTask?.category || 'Trabalho');
  
  const [repetitionType, setRepetitionType] = useState<RepetitionType>(editingTask?.repetition?.type || 'none');
  const [repetitionDays, setRepetitionDays] = useState<number[]>(editingTask?.repetition?.days || []);
  const [hasDeadline, setHasDeadline] = useState(!!editingTask?.deadline);
  const [deadlineDate, setDeadlineDate] = useState(() => {
    if (editingTask?.deadline) {
      return editingTask.deadline.split('T')[0];
    }
    return '';
  });
  const [hasTime, setHasTime] = useState(!!editingTask?.scheduledTime || (!!editingTask?.deadline && editingTask.deadline.includes('T')));
  const [taskTime, setTaskTime] = useState(() => {
    if (editingTask?.scheduledTime) return editingTask.scheduledTime;
    if (editingTask?.deadline && editingTask.deadline.includes('T')) {
      return editingTask.deadline.split('T')[1].slice(0, 5);
    }
    return '12:00';
  });
  const [observation, setObservation] = useState(editingTask?.observation || '');

  const energyPhrases: Record<number, string> = {
    1: "Nível de atenção e energia leve, essa a gente faz brincando",
    2: "Bem-te-vi mandou avisar que é fácil, mas presta atenção!",
    3: "O tempo sempre está bom, mas é preciso um pouquinho de foco!",
    4: "Raios e trovões, Nino! A gente consegue dar conta!",
    5: "Foco, força e café! Essa aqui é pra se concentrar!"
  };

  const daysOfWeek = [
    { label: 'D', value: 0 },
    { label: 'S', value: 1 },
    { label: 'T', value: 2 },
    { label: 'Q', value: 3 },
    { label: 'Q', value: 4 },
    { label: 'S', value: 5 },
    { label: 'S', value: 6 },
  ];

  const toggleDay = (day: number) => {
    setRepetitionDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const totalMinutes = (hours * 60) + minutes;
    if (totalMinutes <= 0) return;
    
    let finalDeadline = hasDeadline ? deadlineDate : undefined;
    // For backward compatibility and overdue logic, we still append time to deadline if both exist
    if (finalDeadline && hasTime) {
      finalDeadline = `${deadlineDate}T${taskTime}`;
    }
    
    const scheduledDate = hasDeadline ? deadlineDate : (repetitionType === 'today' ? new Date().toISOString() : new Date().toISOString());

    onAdd({
      title,
      energyLevel,
      durationMinutes: totalMinutes,
      category,
      scheduledDate,
      scheduledTime: hasTime ? taskTime : undefined,
      repetition: repetitionType !== 'none' ? {
        type: repetitionType,
        days: repetitionType === 'weekly' ? repetitionDays : undefined
      } : undefined,
      deadline: finalDeadline,
      observation: observation.trim() || undefined
    });
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500 max-w-md mx-auto pb-12">
      <header className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 hover:bg-primary-container/20 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-primary" />
        </button>
        <h2 className="text-xl font-bold text-primary">{editingTask ? 'Editar Alegria' : 'Nova Alegria'}</h2>
      </header>

      <div className="flex justify-center py-4">
        <div className="w-32 h-32 bg-primary-container rounded-full flex items-center justify-center relative shadow-inner">
          <Wand2 className="w-12 h-12 text-primary" />
          <div className="absolute top-2 left-2 animate-bounce text-secondary">
            <Tag className="w-5 h-5 fill-current" />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <section className="space-y-3">
          <label className="block text-lg font-bold tracking-tight text-primary px-1">O que vamos fazer?</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Cuidar das plantinhas..."
            className="w-full bg-white border-none rounded-2xl p-5 text-lg shadow-sm focus:ring-2 focus:ring-primary-container transition-all"
          />
        </section>

        <section className="space-y-3">
          <label className="block text-lg font-bold tracking-tight text-primary px-1">Observação (Opcional)</label>
          <textarea 
            value={observation}
            onChange={(e) => setObservation(e.target.value.slice(0, 120))}
            placeholder="Algum detalhe importante?"
            className="w-full bg-white border-none rounded-2xl p-5 text-sm shadow-sm focus:ring-2 focus:ring-primary-container transition-all min-h-[100px] resize-none"
          />
          <div className="flex justify-end px-1">
            <span className={`text-[10px] font-bold ${observation.length >= 120 ? 'text-error' : 'text-outline'}`}>
              {observation.length}/120
            </span>
          </div>
        </section>

        <section className="space-y-3">
          <label className="block text-lg font-bold tracking-tight text-primary px-1">Nível de Energia</label>
          <div className="flex justify-between items-center bg-tertiary-container/20 p-4 rounded-2xl">
            {[1, 2, 3, 4, 5].map((level) => (
              <button 
                key={level}
                onClick={() => setEnergyLevel(level as EnergyLevel)}
                className={`flex flex-col items-center gap-2 transition-all ${energyLevel === level ? 'scale-110' : 'opacity-40'}`}
              >
                <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm ${energyLevel === level ? 'ring-2 ring-tertiary' : ''}`}>
                  <EnergyIcon level={level as EnergyLevel} className="text-tertiary" />
                </div>
                <span className="text-[10px] font-bold text-tertiary">{level}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 py-3 bg-surface-container-low rounded-xl min-h-[60px]">
            <Info className="w-4 h-4 text-tertiary shrink-0" />
            <p className="text-[11px] text-on-surface-variant font-medium leading-tight">
              {energyPhrases[energyLevel]}
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <label className="block text-lg font-bold tracking-tight text-primary px-1">Quanto tempo dura?</label>
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold uppercase text-outline px-1">Horas</label>
              <input 
                type="number" 
                min="0"
                max="23"
                value={hours}
                onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-white border-none rounded-2xl p-4 text-center text-xl font-bold shadow-sm focus:ring-2 focus:ring-primary-container"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold uppercase text-outline px-1">Minutos</label>
              <input 
                type="number" 
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="w-full bg-white border-none rounded-2xl p-4 text-center text-xl font-bold shadow-sm focus:ring-2 focus:ring-primary-container"
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <label className="block text-lg font-bold tracking-tight text-primary px-1">Repetições da tarefa</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Hoje', value: 'today' },
              { label: 'Nenhuma', value: 'none' },
              { label: 'Diária', value: 'daily' },
              { label: 'Semanal', value: 'weekly' },
              { label: 'Quinzenal', value: 'biweekly' },
              { label: 'Mensal', value: 'monthly' },
              { label: 'Bimestral', value: 'bimonthly' },
              { label: 'Trimestral', value: 'trimonthly' },
              { label: 'Quadrimestral', value: 'quarterly' },
              { label: 'Semestral', value: 'semiannual' },
              { label: 'Anual', value: 'annual' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRepetitionType(opt.value as RepetitionType)}
                className={`p-4 rounded-2xl text-sm font-bold border-2 transition-all ${repetitionType === opt.value ? 'bg-primary-container border-primary text-primary' : 'bg-white border-transparent text-on-surface-variant'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          
          {repetitionType === 'weekly' && (
            <div className="flex justify-between p-2 bg-surface-container-low rounded-2xl animate-in fade-in slide-in-from-top-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`w-10 h-10 rounded-full text-xs font-bold transition-all ${repetitionDays.includes(day.value) ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-white'}`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-lg font-bold tracking-tight text-primary">Precisa de horário?</label>
            <button 
              onClick={() => setHasTime(!hasTime)}
              className={`w-12 h-6 rounded-full transition-all relative ${hasTime ? 'bg-primary' : 'bg-outline-variant'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hasTime ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
          
          {hasTime && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <input 
                type="time" 
                value={taskTime}
                onChange={(e) => setTaskTime(e.target.value)}
                className="w-full bg-white border-none rounded-2xl p-5 text-lg shadow-sm focus:ring-2 focus:ring-primary-container transition-all"
              />
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-lg font-bold tracking-tight text-primary">Tem Deadline?</label>
            <button 
              onClick={() => setHasDeadline(!hasDeadline)}
              className={`w-12 h-6 rounded-full transition-all relative ${hasDeadline ? 'bg-primary' : 'bg-outline-variant'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hasDeadline ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
          
          {hasDeadline && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <input 
                type="date" 
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full bg-white border-none rounded-2xl p-5 text-lg shadow-sm focus:ring-2 focus:ring-primary-container transition-all"
              />
            </div>
          )}
        </section>

        <div className="pt-6 space-y-4">
          <button 
            onClick={handleSubmit}
            className="w-full bg-primary text-white py-5 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-6 h-6" />
            {editingTask ? 'Atualizar Momento' : 'Salvar Momento'}
          </button>
          <button 
            onClick={onCancel}
            className="w-full py-4 text-on-surface-variant font-bold hover:text-primary transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
