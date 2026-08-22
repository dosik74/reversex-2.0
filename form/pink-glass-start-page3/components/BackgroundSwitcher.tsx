import React from 'react';
import { ChevronLeft, ChevronRight, Palette } from 'lucide-react';
import { BACKGROUNDS } from '../constants';

interface BackgroundSwitcherProps {
  currentIndex: number;
  onSwitch: (newIndex: number) => void;
}

const BackgroundSwitcher: React.FC<BackgroundSwitcherProps> = ({ currentIndex, onSwitch }) => {
  const handlePrev = () => {
    const newIndex = currentIndex === 0 ? BACKGROUNDS.length - 1 : currentIndex - 1;
    onSwitch(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex === BACKGROUNDS.length - 1 ? 0 : currentIndex + 1;
    onSwitch(newIndex);
  };

  return (
    <div className="flex items-center gap-4 glass-panel px-6 py-3 rounded-full transition-all duration-300 theme-hover">
      <button 
        onClick={handlePrev}
        className="p-2 rounded-full hover:bg-white/20 active:scale-90 transition-all text-white"
        title="Previous Theme"
      >
        <ChevronLeft size={20} />
      </button>
      
      <div className="flex flex-col items-center px-4 min-w-[120px]">
        <span className="text-xs font-medium uppercase tracking-wider theme-text-accent flex items-center gap-2">
            <Palette size={14} className="theme-text-accent" />
            {BACKGROUNDS[currentIndex].name}
        </span>
      </div>

      <button 
        onClick={handleNext}
        className="p-2 rounded-full hover:bg-white/20 active:scale-90 transition-all text-white"
        title="Next Theme"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default BackgroundSwitcher;