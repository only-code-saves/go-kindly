import { Task } from '../types';

/**
 * Parses a date string (YYYY-MM-DD or ISO) into a local Date object.
 */
export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  
  // Check if it's a simple YYYY-MM-DD or YYYY-MM-DDT...
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    
    // Create date in local time
    const d = new Date(year, month, day);
    
    // If there's a time part, set it in local time
    if (dateStr.includes('T')) {
      const timePart = dateStr.split('T')[1];
      const timeParts = timePart.split(':');
      if (timeParts.length >= 2) {
        d.setHours(parseInt(timeParts[0]));
        d.setMinutes(parseInt(timeParts[1]));
      }
    }
    return d;
  }
  
  // Fallback for other formats, but ensure we return local date components
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date();
  
  // If it's an ISO string from toISOString(), new Date(dateStr) is UTC.
  // We want the local date components if it's just a date, but if it has time, we want the moment.
  // However, for the purpose of this app's scheduling, we often just need the local day.
  return d;
};

export const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const getTaskInstancesInRange = (tasks: Task[], start: Date, end: Date) => {
  const instances: { task: Task; date: Date }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  tasks.forEach(task => {
    // 1. Non-repeating tasks
    if (!task.repetition || task.repetition.type === 'none') {
      let effectiveDate: Date;
      
      if (task.completed && task.completedDate) {
        effectiveDate = parseLocalDate(task.completedDate);
      } else {
        const deadlineDate = task.deadline ? parseLocalDate(task.deadline) : null;
        const scheduledDate = task.scheduledDate ? parseLocalDate(task.scheduledDate) : null;
        const originalDate = deadlineDate || scheduledDate || today;
        
        if (!task.completed && deadlineDate && deadlineDate < today) {
          // Overdue tasks "move" to today in the user's current workload
          effectiveDate = today;
        } else {
          effectiveDate = originalDate;
        }
      }
      
      effectiveDate.setHours(0, 0, 0, 0);
      if (effectiveDate >= startDate && effectiveDate <= endDate) {
        const dateStr = effectiveDate.toDateString();
        if (!task.deletedInstances?.includes(dateStr)) {
          instances.push({ task, date: effectiveDate });
        }
      }
    } 
    // 2. Repeating tasks
    else {
      let curr = new Date(startDate);
      const taskStartDate = parseLocalDate(task.scheduledDate);
      taskStartDate.setHours(0, 0, 0, 0);

      while (curr <= endDate) {
        const currDate = new Date(curr);
        currDate.setHours(0, 0, 0, 0);
        
        if (currDate >= taskStartDate && !task.deletedInstances?.includes(currDate.toDateString())) {
          let matches = false;
          const diffTime = Math.abs(currDate.getTime() - taskStartDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          switch (task.repetition.type) {
            case 'today':
              matches = isSameDay(currDate, taskStartDate);
              break;
            case 'daily':
              matches = true;
              break;
            case 'weekly':
              if (task.repetition.days && task.repetition.days.length > 0) {
                matches = task.repetition.days.includes(currDate.getDay());
              } else {
                matches = currDate.getDay() === taskStartDate.getDay();
              }
              break;
            case 'biweekly':
              matches = diffDays % 14 === 0;
              break;
            case 'monthly':
              matches = currDate.getDate() === taskStartDate.getDate();
              break;
            case 'bimonthly': {
              const monthDiff = (currDate.getFullYear() - taskStartDate.getFullYear()) * 12 + (currDate.getMonth() - taskStartDate.getMonth());
              matches = currDate.getDate() === taskStartDate.getDate() && monthDiff % 2 === 0;
              break;
            }
            case 'trimonthly':
            case 'quarterly': {
              const monthDiff = (currDate.getFullYear() - taskStartDate.getFullYear()) * 12 + (currDate.getMonth() - taskStartDate.getMonth());
              matches = currDate.getDate() === taskStartDate.getDate() && monthDiff % 3 === 0;
              break;
            }
            case 'semiannual': {
              const monthDiff = (currDate.getFullYear() - taskStartDate.getFullYear()) * 12 + (currDate.getMonth() - taskStartDate.getMonth());
              matches = currDate.getDate() === taskStartDate.getDate() && monthDiff % 6 === 0;
              break;
            }
            case 'annual':
              matches = currDate.getDate() === taskStartDate.getDate() && currDate.getMonth() === taskStartDate.getMonth();
              break;
          }

          if (matches) {
            instances.push({ task, date: currDate });
          }
        }
        curr.setDate(curr.getDate() + 1);
      }
    }
  });
  
  return instances;
};
