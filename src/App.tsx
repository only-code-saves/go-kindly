import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { Serendipity } from './components/Serendipity';
import { Agenda } from './components/Agenda';
import { Journey } from './components/Journey';
import { AddTask } from './components/AddTask';
import { FocusMode } from './components/FocusMode';
import { Task, SerendipityActivity, AppView } from './types';
import { INITIAL_TASKS, INITIAL_ACTIVITIES } from './constants';

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch { return INITIAL_TASKS; }
  });
  const [activities, setActivities] = useState<SerendipityActivity[]>(() => {
    try {
      const saved = localStorage.getItem('activities');
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
    } catch { return INITIAL_ACTIVITIES; }
  });
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    try { localStorage.setItem('tasks', JSON.stringify(tasks)); } catch {}
  }, [tasks]);

  useEffect(() => {
    try { localStorage.setItem('activities', JSON.stringify(activities)); } catch {}
  }, [activities]);

  const triggerConfetti = () => {
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
  };

  const handleAddTask = (newTask: Omit<Task, 'id' | 'completed'>) => {
    if (editingTask && tasks.some((t: any) => t.id === editingTask.id)) {
      setTasks((prev: any) => prev.map((t: any) => t.id === editingTask.id ? { ...t, ...newTask } : t));
    } else {
      const task: Task = {
        ...newTask,
        id: Date.now().toString(36),
        completed: false
      };
      setTasks((prev: any) => [task, ...prev]);
    }
    setEditingTask(null);
    setView('home');
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setView('add-task');
  };

  const handleDeleteTask = (id: string, dateStr?: string) => {
    if (dateStr) {
      setTasks(prev => prev.map(t => {
        if (t.id === id) {
          const deletedInstances = t.deletedInstances || [];
          if (!deletedInstances.includes(dateStr)) {
            return { ...t, deletedInstances: [...deletedInstances, dateStr] };
          }
        }
        return t;
      }));
    } else {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const isCompleting = !t.completed;
        return { 
          ...t, 
          completed: isCompleting,
          completedDate: isCompleting ? new Date().toISOString() : undefined
        };
      }
      return t;
    }));
  };

  const handleCompleteTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { 
      ...t, 
      completed: true,
      completedDate: new Date().toISOString()
    } : t));
    setActiveTask(null);
    setView('home');
    triggerConfetti();
  };

  const handleAddActivity = (title: string) => {
    const activity: SerendipityActivity = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      category: 'Geral',
      icon: 'sparkles'
    };
    setActivities(prev => [...prev, activity]);
  };

  const handleRemoveActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const renderView = () => {
    switch (view) {
      case 'home':
        return (
          <Home 
            tasks={tasks} 
            onStartFocus={(task) => {
              setActiveTask(task);
              setView('focus');
            }} 
            onViewChange={setView}
            onDeleteTask={handleDeleteTask}
            onToggleTask={handleToggleTask}
            onEditTask={handleEditTask}
          />
        );
      case 'serendipity':
        return (
          <Serendipity 
            activities={activities} 
            onAddActivity={handleAddActivity}
            onRemoveActivity={handleRemoveActivity}
            onStartFocus={(activity, duration) => {
              const tempTask: Task = {
                id: `temp-${activity.id}`,
                title: activity.title,
                energyLevel: 3,
                durationMinutes: duration,
                category: activity.category,
                completed: false,
                scheduledDate: new Date().toISOString()
              };
              setActiveTask(tempTask);
              setView('focus');
            }}
          />
        );
      case 'agenda':
        return (
          <Agenda 
            tasks={tasks} 
            onToggleTask={handleToggleTask} 
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onStartFocus={(task) => {
              setActiveTask(task);
              setView('focus');
            }}
          />
        );
      case 'journey':
        return <Journey tasks={tasks} />;
      case 'add-task':
        return (
          <AddTask 
            onAdd={handleAddTask} 
            onCancel={() => {
              setEditingTask(null);
              setView('home');
            }} 
            editingTask={editingTask}
          />
        );
      case 'focus':
        return activeTask ? (
          <FocusMode 
            task={activeTask} 
            onComplete={handleCompleteTask} 
            onCancel={() => setView('home')} 
          />
        ) : null;
      default:
        return (
          <Home 
            tasks={tasks} 
            onStartFocus={() => {}} 
            onViewChange={setView} 
            onDeleteTask={handleDeleteTask} 
            onToggleTask={handleToggleTask}
            onEditTask={handleEditTask}
          />
        );
    }
  };

  const handleAddNew = () => {
    setEditingTask(null);
    setView('add-task');
  };

  return (
    <Layout currentView={view} onViewChange={setView} onAddNew={handleAddNew}>
      {renderView()}
    </Layout>
  );
}
