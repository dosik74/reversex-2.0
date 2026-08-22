import React from 'react';
import { ChevronLeft, ChevronRight, Palette, Layers, SkipForward } from 'lucide-react';
import { BACKGROUNDS, BACKGROUNDS_SPACE2 } from '../constants';

interface BackgroundSwitcherProps {
  currentIndex: number;
  bgSpace: number;
  onSwitch: (newIndex: number) => void;
  onSpaceSwitch: () => void;
}

const BackgroundSwitcher: React.FC<BackgroundSwitcherProps> = ({ 
  currentIndex, 
  bgSpace, 
  onSwitch, 
  onSpaceSwitch 
}) => {
  const backgrounds = bgSpace === 0 ? BACKGROUNDS : BACKGROUNDS_SPACE2;
  
  const handlePrev = () => {
    const newIndex = currentIndex === 0 ? backgrounds.length - 1 : currentIndex - 1;
    onSwitch(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex === backgrounds.length - 1 ? 0 : currentIndex + 1;
    onSwitch(newIndex);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Space Switch Button */}
      <button 
        onClick={onSpaceSwitch}
        className="flex items-center gap-2 px-4 py-3 rounded-full bg-black/40 border border-white/10 hover:bg-[rgba(var(--theme-rgb),0.3)] active:scale-95 transition-all text-white shadow-xl glass-panel group"
        title={bgSpace === 0 ? "Switch to Space 2" : "Switch to Space 1"}
      >
        <Layers size={18} className="text-[var(--theme-color)] group-hover:animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider">
          {bgSpace === 0 ? "Space 1" : "Space 2"}
        </span>
      </button>

      {/* Background Switcher */}
      <div className="flex items-center gap-4 bg-black/40 border border-white/10 px-6 py-3 rounded-full shadow-xl glass-panel transition-all duration-300 hover:bg-black/50">
        <button 
          onClick={handlePrev}
          className="p-2 rounded-full hover:bg-white/20 active:scale-90 transition-all text-white"
          title="Previous Theme"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex flex-col items-center px-4 min-w-[120px]">
          <span className="text-xs font-bold uppercase tracking-wider text-white/90 flex items-center gap-2 drop-shadow-md">
              <Palette size={14} className="text-white/80" />
              {backgrounds[currentIndex].name}
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

      {/* Skip Button - Skip to next background */}
      <button 
        onClick={handleNext}
        className="flex items-center gap-2 px-4 py-3 rounded-full bg-black/40 border border-white/10 hover:bg-[rgba(var(--theme-rgb),0.3)] active:scale-95 transition-all text-white shadow-xl glass-panel group"
        title="Skip to next wallpaper"
      >
        <SkipForward size={18} className="text-[var(--theme-color)] group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

export default BackgroundSwitcher;