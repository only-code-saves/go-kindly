import { Task } from '../types';

export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (dateStr.includes('T')) {
      const tp = dateStr.split('T')[1].split(':');
      if (tp.length >= 2) { d.setHours(parseInt(tp[0])); d.setMinutes(parseInt(tp[1])); }
    }
    return d;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
};

export const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

/**
 * Returns all task instances (task + date) that fall within [start, end].
 *
 * Rules:
 * - 'none' tasks NEVER appear here (they go to "Para depois" only).
 * - 'today' tasks appear only on their scheduledDate.
 * - All other repetition types repeat from scheduledDate until:
 *     deadline (if set) OR end of the year the task was created.
 */
export const getTaskInstancesInRange = (tasks: Task[], start: Date, end: Date) => {
  const instances: { task: Task; date: Date }[] = [];

  const rangeStart = new Date(start); rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd   = new Date(end);   rangeEnd.setHours(23, 59, 59, 999);

  tasks.forEach(task => {
    // Tasks with no repetition go to "Para depois" — never in agenda
    if (!task.repetition || task.repetition.type === 'none') return;

    const taskStart = parseLocalDate(task.scheduledDate);
    taskStart.setHours(0, 0, 0, 0);

    // Determine the task's own end date
    let taskEnd: Date;
    if (task.repetition.type === 'today') {
      // 'today' only ever appears on its creation date
      taskEnd = new Date(taskStart);
    } else if (task.deadline) {
      taskEnd = parseLocalDate(task.deadline);
    } else {
      // No deadline → repeat until 31 Dec of the creation year
      taskEnd = new Date(taskStart.getFullYear(), 11, 31);
    }
    taskEnd.setHours(0, 0, 0, 0);

    // Effective window = intersection of task range and query range
    const effStart = taskStart > rangeStart ? new Date(taskStart) : new Date(rangeStart);
    const effEnd   = taskEnd   < rangeEnd   ? new Date(taskEnd)   : new Date(rangeEnd);
    effStart.setHours(0, 0, 0, 0);
    effEnd.setHours(0, 0, 0, 0);

    if (effStart > effEnd) return; // No overlap

    let curr = new Date(effStart);
    while (curr <= effEnd) {
      const dateStr = curr.toDateString();

      if (!task.deletedInstances?.includes(dateStr)) {
        const diffDays = Math.round((curr.getTime() - taskStart.getTime()) / 86400000);
        let matches = false;

        switch (task.repetition.type) {
          case 'today':
            matches = isSameDay(curr, taskStart);
            break;
          case 'daily':
            matches = true;
            break;
          case 'weekly':
            if (task.repetition.days && task.repetition.days.length > 0) {
              matches = task.repetition.days.includes(curr.getDay());
            } else {
              matches = curr.getDay() === taskStart.getDay();
            }
            break;
          case 'biweekly':
            matches = diffDays % 14 === 0;
            break;
          case 'monthly':
            matches = curr.getDate() === taskStart.getDate();
            break;
          case 'bimonthly': {
            const mDiff = (curr.getFullYear() - taskStart.getFullYear()) * 12 + (curr.getMonth() - taskStart.getMonth());
            matches = curr.getDate() === taskStart.getDate() && mDiff % 2 === 0;
            break;
          }
          case 'trimonthly':
          case 'quarterly': {
            const mDiff = (curr.getFullYear() - taskStart.getFullYear()) * 12 + (curr.getMonth() - taskStart.getMonth());
            matches = curr.getDate() === taskStart.getDate() && mDiff % 3 === 0;
            break;
          }
          case 'semiannual': {
            const mDiff = (curr.getFullYear() - taskStart.getFullYear()) * 12 + (curr.getMonth() - taskStart.getMonth());
            matches = curr.getDate() === taskStart.getDate() && mDiff % 6 === 0;
            break;
          }
        }

        if (matches) instances.push({ task, date: new Date(curr) });
      }

      curr.setDate(curr.getDate() + 1);
    }
  });

  return instances;
};

/** Energy weight for a task — levels 4 and 5 count double/triple for the Energy Flow bar */
export const energyWeight = (level: number) => level >= 5 ? level * 2 : level >= 4 ? level * 1.5 : level;
