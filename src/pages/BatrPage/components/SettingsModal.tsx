import React, { useRef, useState } from 'react';
import { X, Upload, Zap, Eye, Clock, Monitor, Image, Globe, Palette, Film, Download, Database, User, LogOut, Sliders } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { TRANSLATIONS } from '../constants';
import { saveVideo, deleteVideo } from '../utils/db';
import AuthModal from './AuthModal';

interface SettingsModalProps {
  onClose: () => void;
}

type Tab = 'general' | 'profile';

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { settings, updateSettings, importData, exportData, user, logout, lastSynced, bgSpace, spaceWallpaper, setSpaceCustomBackground, setSpaceCustomVideo } = useGlobal();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [showLogin, setShowLogin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[settings.language];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
         alert("Image is too large (max 2MB).");
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSpaceCustomBackground(reader.result as string);
        setSpaceCustomVideo(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          await saveVideo(file, bgSpace);
          setSpaceCustomVideo(true);
          setSpaceCustomBackground(null);
      } catch (err) {
          console.error("Video save failed", err);
          alert("Failed to save video.");
      }
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          if (event.target?.result) {
             const success = importData(event.target.result as string);
             if (success) alert(t.importSuccess);
             else alert(t.importError);
          }
      };
      reader.readAsText(file);
  };

  const clearVideo = async () => {
      try {
          await deleteVideo(bgSpace);
          setSpaceCustomVideo(false);
      } catch (err) {
          console.error("Failed to delete video", err);
      }
  };

  if (showLogin) {
      return <AuthModal language={settings.language} onClose={() => setShowLogin(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel bg-[#05050A]/70 rounded-3xl shadow-2xl relative flex flex-col max-h-[85vh] border border-white/10">
        
        {/* Header with Tabs */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center shrink-0">
          <div className="flex gap-2 bg-black/40 p-1 rounded-xl">
             <button 
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'general' ? 'theme-bg text-white shadow-md' : 'text-white/60 hover:text-white'}`}
             >
                 <Sliders size={16} />
                 {t.settings}
             </button>
             <button 
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'theme-bg text-white shadow-md' : 'text-white/60 hover:text-white'}`}
             >
                 <User size={16} />
                 {t.profile}
             </button>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            
            {activeTab === 'general' ? (
                <>
                {/* Appearance */}
                <section className="space-y-3">
                    <h3 className="text-white/70 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Image size={12}/> {t.appearance}
                    </h3>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <span className="text-white font-medium text-sm">{t.lockBackground}</span>
                        <div 
                            onClick={() => updateSettings({ lockBackground: !settings.lockBackground })}
                            className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings.lockBackground ? 'theme-bg' : 'bg-white/20'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${settings.lockBackground ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    {/* Custom Image Wallpaper */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-white font-medium text-sm block mb-2">{t.customWallpaper}</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-white/10"
                            >
                                <Upload size={14}/> {t.uploadImage}
                            </button>
                            {spaceWallpaper.customBackground && (
                                <button 
                                    onClick={() => setSpaceCustomBackground(null)}
                                    className="py-2 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-lg text-xs transition-all border border-red-500/20"
                                >
                                    {t.reset}
                                </button>
                            )}
                            <input 
                                type="file" 
                                accept="image/*" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileUpload}
                            />
                        </div>
                    </div>

                    {/* Custom Video Wallpaper */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-white font-medium text-sm block mb-2">{t.customVideo}</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => videoInputRef.current?.click()}
                                className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-white/10"
                            >
                                <Film size={14}/> {t.uploadVideo}
                            </button>
                            {spaceWallpaper.customVideo && (
                                <button 
                                    onClick={clearVideo}
                                    className="py-2 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-lg text-xs transition-all border border-red-500/20"
                                >
                                    {t.reset}
                                </button>
                            )}
                            <input 
                                type="file" 
                                accept="video/*" 
                                ref={videoInputRef} 
                                className="hidden" 
                                onChange={handleVideoUpload}
                            />
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex justify-between mb-2">
                            <span className="text-white font-medium text-sm flex items-center gap-2"><Eye size={14} className="text-white/70"/> {t.glassBlur}</span>
                            <span className="text-white/60 text-xs font-medium">{settings.blurAmount}px</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="50" 
                            value={settings.blurAmount}
                            onChange={(e) => updateSettings({ blurAmount: parseInt(e.target.value) })}
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:theme-bg [&::-webkit-slider-thumb]:rounded-full"
                        />
                    </div>
                    
                    {/* Theme Color Picker */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <span className="text-white font-medium text-sm flex items-center gap-2"><Palette size={14} className="text-white/70"/> {t.themeColor}</span>
                        <input 
                            type="color" 
                            value={settings.themeColor} 
                            onChange={(e) => updateSettings({ themeColor: e.target.value })}
                            className="w-8 h-8 rounded-full cursor-pointer bg-transparent border-none p-0"
                        />
                    </div>
                </section>

                {/* Functionality */}
                <section className="space-y-3 pt-4 border-t border-white/10">
                    <h3 className="text-white/70 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Zap size={12}/> {t.functionality}
                    </h3>
                    
                    {/* Language Selector */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-white font-medium text-sm block mb-2 flex items-center gap-2">
                            <Globe size={14} className="text-white/70"/> {t.language}
                        </span>
                        <div className="flex bg-black/40 rounded-lg p-1">
                            <button 
                                onClick={() => updateSettings({ language: 'en' })}
                                className={`flex-1 py-1 rounded-md text-xs font-medium transition-all ${settings.language === 'en' ? 'theme-bg text-white shadow-md' : 'text-white/60 hover:text-white'}`}
                            >
                                English
                            </button>
                            <button 
                                onClick={() => updateSettings({ language: 'ru' })}
                                className={`flex-1 py-1 rounded-md text-xs font-medium transition-all ${settings.language === 'ru' ? 'theme-bg text-white shadow-md' : 'text-white/60 hover:text-white'}`}
                            >
                                Русский
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <span className="text-white font-medium text-sm">{t.animations}</span>
                        <div 
                            onClick={() => updateSettings({ isAnimationEnabled: !settings.isAnimationEnabled })}
                            className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings.isAnimationEnabled ? 'theme-bg' : 'bg-white/20'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${settings.isAnimationEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                        <span className="text-white font-medium text-sm flex items-center gap-2">
                            <Clock size={14} className="text-white/70"/> {t.timeFormat}
                        </span>
                        <div className="flex bg-black/40 rounded-lg p-1">
                            <button 
                                onClick={() => updateSettings({ timeFormat: '12h' })}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${settings.timeFormat === '12h' ? 'theme-bg text-white shadow-md' : 'text-white/60 hover:text-white'}`}
                            >
                                12h
                            </button>
                            <button 
                                onClick={() => updateSettings({ timeFormat: '24h' })}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${settings.timeFormat === '24h' ? 'theme-bg text-white shadow-md' : 'text-white/60 hover:text-white'}`}
                            >
                                24h
                            </button>
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-white font-medium text-sm block mb-2">{t.searchEngine}</span>
                        <select 
                            value={settings.searchEngine}
                            onChange={(e) => updateSettings({ searchEngine: e.target.value as any })}
                            className="w-full bg-black/50 text-white text-sm border border-white/10 rounded-lg p-2 focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                        >
                            <option value="google">Google</option>
                            <option value="bing">Bing</option>
                            <option value="duckduckgo">DuckDuckGo</option>
                            <option value="yahoo">Yahoo</option>
                        </select>
                    </div>
                </section>
                </>
            ) : (
                /* Profile Tab */
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     <div className="flex flex-col items-center justify-center p-6 bg-black/20 rounded-2xl border border-white/5">
                        <div className="w-20 h-20 rounded-full theme-bg flex items-center justify-center text-3xl font-bold text-white shadow-2xl mb-3">
                             {user ? user.email?.charAt(0).toUpperCase() : <User size={32} />}
                        </div>
                        {user ? (
                            <>
                                <h3 className="text-lg font-semibold text-white">{user.email}</h3>
                                <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
                                    {t.lastSynced}: <span className="text-white/80">{lastSynced ? lastSynced.toLocaleTimeString() : t.never}</span>
                                </p>
                                <button 
                                    onClick={logout}
                                    className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-xl text-sm transition-all border border-red-500/20 flex items-center gap-2"
                                >
                                    <LogOut size={14} /> {t.logout}
                                </button>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-semibold text-white/80">{t.notLoggedIn}</h3>
                                <p className="text-xs text-center text-white/50 mt-2 px-4">{t.loginDescription}</p>
                                <button 
                                    onClick={() => setShowLogin(true)}
                                    className="mt-4 px-6 py-2 theme-bg hover:brightness-110 text-white rounded-xl font-medium shadow-lg transition-all"
                                >
                                    {t.login}
                                </button>
                            </>
                        )}
                     </div>

                     {/* Data Management Section - Now inside Profile */}
                     <section className="space-y-3">
                        <h3 className="text-white/70 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <Database size={12}/> {t.dataManagement}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={exportData}
                                className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex flex-col items-center gap-2 text-center"
                            >
                                <Download size={20} className="text-white/80" />
                                <span className="text-xs font-medium text-white">{t.downloadSettings}</span>
                            </button>
                            <button 
                                onClick={() => jsonInputRef.current?.click()}
                                className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex flex-col items-center gap-2 text-center"
                            >
                                <Upload size={20} className="text-white/80" />
                                <span className="text-xs font-medium text-white">{t.uploadSettings}</span>
                                <input type="file" accept=".json" ref={jsonInputRef} className="hidden" onChange={handleJsonImport}/>
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;