import { 
  Trophy, Target, TrendingUp, Award, ChevronRight, Heart, Sparkles
} from 'lucide-react';
import { useMemo } from 'react';
import { Task } from '../types';
import { calculateEarnedBadges, BADGES } from '../lib/badgeUtils';

interface JourneyProps {
  tasks: Task[];
}

export const Journey = ({ tasks }: JourneyProps) => {
  const monthlyProgress = (() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthTasks = tasks.filter(task => {
      const isNone = task.repetition?.type === 'none' || !task.repetition;
      
      if (isNone) {
        // Only count if completed in this month
        if (!task.completed || !task.completedDate) return false;
        const compDate = new Date(task.completedDate);
        return compDate.getMonth() === currentMonth && compDate.getFullYear() === currentYear;
      } else {
        // Count if scheduled for this month
        const taskDate = new Date(task.scheduledDate);
        return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
      }
    });

    if (monthTasks.length === 0) return 0;

    const completedTasks = monthTasks.filter(task => task.completed);
    return Math.round((completedTasks.length / monthTasks.length) * 100);
  })();

  const getStatusTitle = (progress: number) => {
    if (progress === 0) return 'Semeando';
    if (progress < 30) return 'Brotando';
    if (progress < 60) return 'Crescendo';
    if (progress < 90) return 'Florescendo';
    return 'Plena Florada';
  };

  const weeklyStats = (() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get all tasks for the current month
    const monthTasks = tasks.filter(task => {
      const isNone = task.repetition?.type === 'none' || !task.repetition;
      
      if (isNone) {
        // Only count if completed in this month
        if (!task.completed || !task.completedDate) return false;
        const compDate = new Date(task.completedDate);
        return compDate.getMonth() === currentMonth && compDate.getFullYear() === currentYear;
      } else {
        // Count if scheduled for this month
        const taskDate = new Date(task.scheduledDate);
        return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
      }
    });

    const weeks = [
      { start: 1, end: 7 },
      { start: 8, end: 14 },
      { start: 15, end: 21 },
      { start: 22, end: 31 }
    ];

    return weeks.map((range, index) => {
      const weekTasks = monthTasks.filter(task => {
        const isNone = task.repetition?.type === 'none' || !task.repetition;
        let day: number;

        if (isNone && task.completedDate) {
          day = new Date(task.completedDate).getDate();
        } else {
          day = new Date(task.scheduledDate).getDate();
        }

        return day >= range.start && day <= range.end;
      });

      const total = weekTasks.length;
      const completed = weekTasks.filter(t => t.completed).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      let title = 'Em Progresso';
      let desc = 'Plantando novas intenções...';
      let icon = Heart;
      let color = 'bg-surface-container';
      let text = 'text-outline';
      let opacity = 'opacity-50';

      if (total > 0) {
        opacity = 'opacity-100';
        if (percentage === 100) {
          title = 'Foco Total';
          desc = 'Todas as metas alcançadas!';
          icon = Target;
          color = 'bg-secondary-container';
          text = 'text-on-secondary-container';
        } else if (percentage >= 50) {
          title = 'Equilíbrio';
          desc = 'Ritmo constante e saudável';
          icon = TrendingUp;
          color = 'bg-tertiary-container';
          text = 'text-on-tertiary-container';
        } else {
          title = 'Início de Ciclo';
          desc = 'Dando os primeiros passos';
          icon = Award;
          color = 'bg-primary-container';
          text = 'text-on-primary-container';
        }
      }

      return {
        week: index + 1,
        title,
        desc: total > 0 ? `${desc} (${percentage}%)` : desc,
        icon,
        color,
        text,
        opacity,
        percentage,
        total
      };
    });
  })();

  const earnedBadges = useMemo(() => calculateEarnedBadges(tasks), [tasks]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Jornada do Mês</h2>
        <p className="text-on-surface-variant leading-relaxed">Um olhar gentil sobre o seu crescimento e as conquistas deste ciclo.</p>
      </section>

      {/* Monthly Progress Visual */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-primary-container to-surface-bright shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[10px] font-bold tracking-widest uppercase text-on-primary-container opacity-70">Status Atual</span>
          <h3 className="text-2xl font-bold text-on-primary-container mt-1">{getStatusTitle(monthlyProgress)}</h3>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-2.5 flex-1 bg-white/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${monthlyProgress}%` }}
              ></div>
            </div>
            <span className="text-sm font-bold text-on-primary-container">{monthlyProgress}%</span>
          </div>
        </div>
        <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-primary/10" />
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 gap-4">
        {weeklyStats.map((item, i) => (
          <div key={i} className={`bg-surface-container-low p-5 rounded-2xl flex items-center gap-5 hover:bg-white transition-all group cursor-pointer ${item.opacity}`}>
            <div className={`w-14 h-14 rounded-full ${item.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${item.text}`}>
              <item.icon className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Semana {item.week}</h4>
              <p className="text-lg font-bold text-on-surface">{item.title}</p>
              <p className="text-xs text-on-surface-variant">{item.desc}</p>
              {item.total > 0 && (
                <div className="mt-2 h-1 w-24 bg-surface-container rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-700" 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              )}
            </div>
            <ChevronRight className="text-outline-variant group-hover:text-primary transition-colors" />
          </div>
        ))}
      </div>

      {/* Badges Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xl font-bold tracking-tight">Suas Conquistas</h3>
            <p className="text-xs text-on-surface-variant">Badges desbloqueadas por sua dedicação</p>
          </div>
          <div className="bg-primary-container/30 px-3 py-1 rounded-full">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{earnedBadges.length} / {BADGES.length}</span>
          </div>
        </div>

        {earnedBadges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {earnedBadges.map((badge, i) => (
              <div key={i} className="bg-white p-6 rounded-[32px] flex flex-col items-center text-center space-y-4 shadow-sm border border-surface-container hover:shadow-md transition-shadow group">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-container to-surface-bright flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <badge.icon className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Badge {i + 1}</p>
                  <h4 className="text-lg font-black text-on-surface leading-tight">{badge.name}</h4>
                  <div className="pt-2 border-t border-surface-container">
                    <p className="text-[11px] text-on-surface-variant italic leading-relaxed">
                      "{badge.quote}"
                    </p>
                    {badge.author && (
                      <p className="text-[9px] font-bold text-outline mt-1 uppercase tracking-wider">— {badge.author}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-low p-12 rounded-[40px] border-2 border-dashed border-outline-variant/30 text-center space-y-4">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto text-outline">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-on-surface">Nenhuma badge ainda</p>
              <p className="text-xs text-on-surface-variant px-8">Complete mais de 75% das tarefas do mês para ganhar sua primeira badge!</p>
            </div>
          </div>
        )}
      </section>

      <section className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary-container mb-4 text-secondary">
          <Heart className="w-6 h-6 fill-current" />
        </div>
        <p className="text-sm italic text-on-surface-variant px-10">
          "Pequenos passos, dados com gentileza e com a intenção certa, nos levam à magia ."
        </p>
      </section>
    </div>
  );
};
