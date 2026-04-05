import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Info, Wand2, Tag } from 'lucide-react';
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
  const [durationMinutes, setDurationMinutes] = useState(editingTask?.durationMinutes || 30);
  const [repetitionType, setRepetitionType] = useState<RepetitionType>(editingTask?.repetition?.type || 'none');
  const [repetitionDays, setRepetitionDays] = useState<number[]>(editingTask?.repetition?.days || []);
  const [hasDeadline, setHasDeadline] = useState(!!editingTask?.deadline);
  const [deadlineDate, setDeadlineDate] = useState(() => editingTask?.deadline ? editingTask.deadline.split('T')[0] : '');
  const [hasTime, setHasTime] = useState(!!editingTask?.scheduledTime || (!!editingTask?.deadline && editingTask.deadline.includes('T')));
  const [taskTime, setTaskTime] = useState(() => {
    if (editingTask?.scheduledTime) return editingTask.scheduledTime;
    if (editingTask?.deadline && editingTask.deadline.includes('T')) return editingTask.deadline.split('T')[1].slice(0, 5);
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
    { label: 'D', value: 0 }, { label: 'S', value: 1 }, { label: 'T', value: 2 },
    { label: 'Q', value: 3 }, { label: 'Q', value: 4 }, { label: 'S', value: 5 }, { label: 'S', value: 6 },
  ];

  const toggleDay = (day: number) => {
    setRepetitionDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const changeDuration = (delta: number) => {
    setDurationMinutes(prev => Math.max(5, Math.min(480, prev + delta)));
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    let finalDeadline: string | undefined = undefined;
    if (hasDeadline && deadlineDate) {
      finalDeadline = hasTime ? `${deadlineDate}T${taskTime}` : deadlineDate;
    }

    onAdd({
      title: title.trim(),
      energyLevel,
      durationMinutes,
      category: 'Geral',
      scheduledDate: new Date().toISOString(),
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
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500 max-w-md mx-auto pb-12">
      <header className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 hover:bg-primary-container/20 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-primary" />
        </button>
        <h2 className="text-xl font-bold text-primary">{editingTask ? 'Editar Alegria' : 'Nova Alegria'}</h2>
      </header>

      <div className="flex justify-center py-2">
        <div className="w-24 h-24 bg-primary-container rounded-full flex items-center justify-center relative shadow-inner">
          <Wand2 className="w-10 h-10 text-primary" />
          <div className="absolute top-2 left-2 animate-bounce text-secondary">
            <Tag className="w-4 h-4 fill-current" />
          </div>
        </div>
      </div>

      <div className="space-y-6">

        {/* OBRIGATÓRIO: Título */}
        <section className="space-y-2">
          <label className="block text-lg font-bold tracking-tight text-primary px-1">
            O que vamos fazer? <span className="text-error text-sm">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Cuidar das plantinhas..."
            className="w-full bg-white border-none rounded-2xl p-5 text-lg shadow-sm focus:ring-2 focus:ring-primary-container transition-all"
          />
        </section>

        {/* OBRIGATÓRIO: Repetição */}
        <section className="space-y-2">
          <label className="block text-lg font-bold tracking-tight text-primary px-1">
            Repetições da tarefa <span className="text-error text-sm">*</span>
          </label>
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
                type="button"
                onClick={() => setRepetitionType(opt.value as RepetitionType)}
                className={`p-4 rounded-2xl text-sm font-bold border-2 transition-all ${repetitionType === opt.value ? 'bg-primary-container border-primary text-primary' : 'bg-white border-transparent text-on-surface-variant'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {repetitionType === 'weekly' && (
            <div className="flex justify-between p-2 bg-surface-container-low rounded-2xl animate-in fade-in">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`w-10 h-10 rounded-full text-xs font-bold transition-all ${repetitionDays.includes(day.value) ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-white'}`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="border-t border-surface-container pt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline px-1 mb-4">Opcionais</p>

          {/* Duração */}
          <section className="space-y-2 mb-6">
            <label className="block text-sm font-bold tracking-tight text-on-surface-variant px-1">Duração</label>
            <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-2">
              <button type="button" onClick={() => changeDuration(-5)}
                className="w-12 h-12 flex items-center justify-center text-2xl font-bold text-primary hover:bg-primary-container/20 active:bg-primary-container/40 rounded-xl transition-colors">
                −
              </button>
              <span className="text-lg font-bold text-on-surface">{formatDuration(durationMinutes)}</span>
              <button type="button" onClick={() => changeDuration(5)}
                className="w-12 h-12 flex items-center justify-center text-2xl font-bold text-primary hover:bg-primary-container/20 active:bg-primary-container/40 rounded-xl transition-colors">
                +
              </button>
            </div>
          </section>

          {/* Nível de Energia */}
          <section className="space-y-2 mb-6">
            <label className="block text-sm font-bold tracking-tight text-on-surface-variant px-1">Nível de Energia</label>
            <div className="flex justify-between items-center bg-tertiary-container/20 p-3 rounded-2xl">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setEnergyLevel(level as EnergyLevel)}
                  className={`flex flex-col items-center gap-1 transition-all ${energyLevel === level ? 'scale-110' : 'opacity-40'}`}
                >
                  <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm ${energyLevel === level ? 'ring-2 ring-tertiary' : ''}`}>
                    <EnergyIcon level={level as EnergyLevel} className="text-tertiary" />
                  </div>
                  <span className="text-[10px] font-bold text-tertiary">{level}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-low rounded-xl">
              <Info className="w-4 h-4 text-tertiary shrink-0" />
              <p className="text-[11px] text-on-surface-variant font-medium leading-tight">{energyPhrases[energyLevel]}</p>
            </div>
          </section>

          {/* Observação */}
          <section className="space-y-2 mb-6">
            <label className="block text-sm font-bold tracking-tight text-on-surface-variant px-1">Observação</label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value.slice(0, 120))}
              placeholder="Algum detalhe importante?"
              className="w-full bg-white border-none rounded-2xl p-4 text-sm shadow-sm focus:ring-2 focus:ring-primary-container transition-all min-h-[80px] resize-none"
            />
            <div className="flex justify-end px-1">
              <span className={`text-[10px] font-bold ${observation.length >= 120 ? 'text-error' : 'text-outline'}`}>{observation.length}/120</span>
            </div>
          </section>

          {/* Horário */}
          <section className="space-y-2 mb-6">
            <div className="flex items-center justify-between px-1">
              <label className="text-sm font-bold tracking-tight text-on-surface-variant">Horário específico</label>
              <button
                type="button"
                onClick={() => setHasTime(!hasTime)}
                className={`w-12 h-6 rounded-full transition-all relative ${hasTime ? 'bg-primary' : 'bg-outline-variant'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hasTime ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            {hasTime && (
              <input
                type="time"
                value={taskTime}
                onChange={(e) => setTaskTime(e.target.value)}
                className="w-full bg-white border-none rounded-2xl p-4 text-lg shadow-sm focus:ring-2 focus:ring-primary-container transition-all"
              />
            )}
          </section>

          {/* Deadline */}
          <section className="space-y-2 mb-6">
            <div className="flex items-center justify-between px-1">
              <label className="text-sm font-bold tracking-tight text-on-surface-variant">Deadline</label>
              <button
                type="button"
                onClick={() => setHasDeadline(!hasDeadline)}
                className={`w-12 h-6 rounded-full transition-all relative ${hasDeadline ? 'bg-primary' : 'bg-outline-variant'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hasDeadline ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            {hasDeadline && (
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full bg-white border-none rounded-2xl p-4 text-lg shadow-sm focus:ring-2 focus:ring-primary-container transition-all"
              />
            )}
          </section>
        </div>

        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full bg-primary text-white py-5 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-6 h-6" />
            {editingTask ? 'Atualizar Momento' : 'Salvar Momento'}
          </button>
          <button
            type="button"
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
