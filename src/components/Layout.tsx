import { ReactNode, useState } from 'react';
import { Home, Calendar, Trophy, Sparkles, PlusCircle, Timer, Menu, Sprout, X, Settings, Info, LogOut, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppView } from '../types';

interface LayoutProps {
  children: ReactNode;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

export const Layout = ({ children, currentView, onViewChange }: LayoutProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'serendipity', label: 'Serendipity', icon: Sparkles },
    { id: 'journey', label: 'Jornada', icon: Trophy },
  ];

  const handleMenuClick = (view: AppView) => {
    onViewChange(view);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-24 md:pb-0">
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl px-4 py-3 flex justify-between items-center border-b border-surface-container">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 hover:bg-primary-container/20 rounded-full transition-colors"
          >
            <Menu className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-xl font-bold tracking-tighter text-primary italic flex items-center gap-1.5">
            <Heart className="w-5 h-5 fill-current text-[#FF9999]" />
            Go Kindly!
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex gap-6 items-center mr-4">
            {menuItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => onViewChange(item.id as AppView)} 
                className={`text-sm font-medium transition-colors ${currentView === item.id ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container flex items-center justify-center bg-primary-container/20">
            <Sprout className="w-6 h-6 text-primary" />
          </div>
        </div>
      </header>

      {/* Side Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-surface z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <Heart className="w-6 h-6 fill-current text-[#FF9999]" />
                  <span className="text-xl font-bold text-primary italic">Go Kindly!</span>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-surface-container-high rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-on-surface-variant" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-outline">Navegação</p>
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id as AppView)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${currentView === item.id ? 'bg-primary-container text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}

                <div className="pt-4 mt-4 border-t border-surface-container">
                  <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-outline">Preferências</p>
                  <button className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-on-surface-variant hover:bg-surface-container-low transition-all">
                    <Settings className="w-5 h-5" />
                    <span className="text-sm">Configurações</span>
                  </button>
                  <button className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-on-surface-variant hover:bg-surface-container-low transition-all">
                    <Info className="w-5 h-5" />
                    <span className="text-sm">Sobre o App</span>
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-surface-container">
                <div className="bg-primary-container/20 rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-primary">Dica de Gentileza</span>
                  </div>
                  <p className="text-[10px] text-on-primary-container/70 leading-relaxed italic">
                    "O que você quer ser quando crescer? - Eu quero ser gentil."
                  </p>
                </div>
                <button className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-error hover:bg-error-container/10 transition-all">
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-bold">Sair</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/80 backdrop-blur-xl rounded-t-[32px] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] md:hidden">
        <button 
          onClick={() => onViewChange('home')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${currentView === 'home' ? 'bg-primary-container text-primary' : 'text-on-surface-variant'}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold">Início</span>
        </button>
        <button 
          onClick={() => onViewChange('agenda')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${currentView === 'agenda' ? 'bg-primary-container text-primary' : 'text-on-surface-variant'}`}
        >
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-bold">Agenda</span>
        </button>
        <button 
          onClick={() => onViewChange('serendipity')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${currentView === 'serendipity' ? 'bg-primary-container text-primary' : 'text-on-surface-variant'}`}
        >
          <Sparkles className="w-6 h-6" />
          <span className="text-[10px] font-bold">Sorte</span>
        </button>
        <button 
          onClick={() => onViewChange('journey')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${currentView === 'journey' ? 'bg-primary-container text-primary' : 'text-on-surface-variant'}`}
        >
          <Trophy className="w-6 h-6" />
          <span className="text-[10px] font-bold">Jornada</span>
        </button>
      </nav>

      {/* FAB for adding tasks */}
      {currentView !== 'add-task' && currentView !== 'focus' && (
        <button 
          onClick={() => onViewChange('add-task')}
          className="fixed right-6 bottom-28 md:bottom-8 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-40"
        >
          <PlusCircle className="w-8 h-8" />
        </button>
      )}
    </div>
  );
};
