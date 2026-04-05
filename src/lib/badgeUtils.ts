import { 
  PawPrint, Wind, BookOpen, Fish, Sun, Monitor, Sword, Globe, 
  Shield, Dog, Moon, Castle, Zap, Cat, Star, Ghost, Footprints, 
  Flame, Hourglass, Sparkles
} from 'lucide-react';
import { Task } from '../types';

export const BADGES = [
  { name: 'Bill the Pony', icon: PawPrint, quote: 'Mesmo o menor dos seres pode mudar o curso do futuro.', author: 'J.R.R. Tolkien' },
  { name: 'Mafagafo', icon: Wind, quote: 'O absurdo é o tempero que transforma o impossível em divertido.' },
  { name: 'Elizabeth Bennet', icon: BookOpen, quote: 'Coragem é a graça sob pressão.', author: 'Ernest Hemingway' },
  { name: 'Don’t panic! & Thanks for the fish', icon: Fish, quote: 'O universo é grande, estranho e cheio de peixes; sorria e continue nadando.' },
  { name: 'Timão & Pumba', icon: Sun, quote: 'Às vezes, a melhor estratégia é rir, comer e seguir em frente.' },
  { name: 'Steve Wozniak', icon: Monitor, quote: 'A melhor maneira de prever o futuro é inventá-lo.', author: 'Alan Kay' },
  { name: 'Inigo Montoya', icon: Sword, quote: 'Caia sete vezes e levante-se oito.', author: 'Provérbio japonês' },
  { name: 'Carmen Sandiego', icon: Globe, quote: 'Não é o destino que importa, mas a viagem.', author: 'T.S. Eliot' },
  { name: 'Jack Reacher', icon: Shield, quote: 'A coragem não é ausência de medo, mas a decisão de que algo é mais importante que ele.', author: 'Ambrose Redmoon' },
  { name: 'John Wick', icon: Dog, quote: 'O homem que se ergue é mais forte do que o que nunca caiu.', author: 'Viktor Frankl' },
  { name: 'Geralt', icon: Moon, quote: 'O homem que conquista a si mesmo é mais poderoso do que aquele que conquista mil homens em batalha.', author: 'Buda' },
  { name: 'Musashi', icon: Castle, quote: 'Perceba o que não pode ser visto a olho nu.', author: 'Miyamoto Musashi' },
  { name: 'Asterix & Obelix', icon: Zap, quote: 'A alegria evita mil males e prolonga a vida.', author: 'William Shakespeare' },
  { name: 'Cheshire Cat', icon: Cat, quote: 'Não se perca no tempo: nós somos feitos dele.', author: 'Jorge Luis Borges' },
  { name: 'Scadufax', icon: Star, quote: 'A velocidade não é nada sem direção.', author: 'Provérbio chinês' },
  { name: 'Harry Vanderspeigle', icon: Ghost, quote: 'Às vezes, ser estranho é apenas o primeiro passo para ser extraordinário.', author: 'Clarissa Pinkola Estés' },
  { name: 'Tiffany Aching', icon: Footprints, quote: 'O que você faz com o que tem é o que define quem você é.', author: 'Madeline L’Engle' },
  { name: 'Calcifer', icon: Flame, quote: 'Aqueles que não acreditam em magia jamais a encontrarão.', author: 'Roald Dahl' },
  { name: '10ª Doctor', icon: Hourglass, quote: 'O tempo é muito lento para os que esperam, muito rápido para os que temem, muito longo para os que sofrem, muito curto para os que se alegram, mas para os que amam, o tempo é eternidade.', author: 'Henry Van Dyke' },
  { name: 'Lúthien Tinúviel', icon: Sparkles, quote: 'A imaginação é o verdadeiro começo da criação.', author: 'George Bernard Shaw' },
];

export const calculateEarnedBadges = (tasks: Task[]) => {
  // Group tasks by month
  const monthGroups: Record<string, Task[]> = {};
  
  tasks.forEach(task => {
    const isNone = task.repetition?.type === 'none' || !task.repetition;
    let date: Date | null = null;

    if (isNone) {
      // Only count if completed
      if (task.completed && task.completedDate) {
        date = new Date(task.completedDate);
      }
    } else {
      // Count based on scheduled date
      date = new Date(task.scheduledDate);
    }

    if (date) {
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!monthGroups[key]) monthGroups[key] = [];
      monthGroups[key].push(task);
    }
  });

  // Sort months chronologically
  const sortedMonthKeys = Object.keys(monthGroups).sort();

  let badgeCount = 0;
  sortedMonthKeys.forEach(key => {
    const monthTasks = monthGroups[key];
    const completed = monthTasks.filter(t => t.completed).length;
    const percentage = (completed / monthTasks.length) * 100;

    if (percentage >= 100) {
      badgeCount += 2;
    } else if (percentage >= 75) {
      badgeCount += 1;
    }
  });

  return BADGES.slice(0, Math.min(badgeCount, BADGES.length));
};
