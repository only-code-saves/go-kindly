import { Task, EnergyLevel } from '../types';
import { Snail, Bird, Zap, Sparkles, Cloud } from 'lucide-react';

export const EnergyIcon = ({ level, className = "" }: { level: EnergyLevel, className?: string }) => {
  switch (level) {
    case 1: return <Snail className={`w-5 h-5 ${className}`} />;
    case 2: return <Bird className={`w-5 h-5 ${className}`} />;
    case 3: return <Cloud className={`w-5 h-5 ${className}`} />;
    case 4: return <Zap className={`w-5 h-5 ${className}`} />;
    case 5: return <Sparkles className={`w-5 h-5 ${className}`} />;
    default: return <Snail className={`w-5 h-5 ${className}`} />;
  }
};
