import { Task, SerendipityActivity } from './types';

export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Organizar a mesa de trabalho',
    energyLevel: 2,
    durationMinutes: 15,
    category: 'Trabalho',
    completed: false,
    scheduledDate: new Date().toISOString(),
    scheduledTime: '09:00'
  },
  {
    id: '2',
    title: 'Responder e-mails pendentes',
    energyLevel: 3,
    durationMinutes: 30,
    category: 'Trabalho',
    completed: false,
    scheduledDate: new Date().toISOString(),
    scheduledTime: '10:30'
  },
  {
    id: '3',
    title: 'Beber um copo de água',
    energyLevel: 1,
    durationMinutes: 1,
    category: 'Auto-cuidado',
    completed: false,
    scheduledDate: new Date().toISOString(),
    scheduledTime: '11:00'
  }
];

export const INITIAL_ACTIVITIES: SerendipityActivity[] = [
  { id: '1', title: 'Dançar', category: 'Movimento', icon: 'music' },
  { id: '2', title: 'Comer torta', category: 'Delícias', icon: 'cake' },
  { id: '3', title: 'Banho de banheira', category: 'Relaxamento', icon: 'bath' },
  { id: '4', title: 'Pintar algo novo', category: 'Criatividade', icon: 'palette' }
];
