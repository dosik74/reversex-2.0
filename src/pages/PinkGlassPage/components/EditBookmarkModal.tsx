import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Globe, Link, Image as ImageIcon, Check, Upload, Trash2 } from 'lucide-react';
import { Bookmark } from '../types';
import { useGlobal } from '../context/GlobalContext';
import { motion } from 'framer-motion';

interface EditBookmarkModalProps {
  bookmark: Bookmark;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Bookmark>) => void;
}

const EditBookmarkModal: React.FC<EditBookmarkModalProps> = ({ bookmark, onClose, onSave }) => {
  const [title, setTitle] = useState(bookmark.title);
  const [url, setUrl] = useState(bookmark.url);
  const [customIconUrl, setCustomIconUrl] = useState(bookmark.customIconUrl || '');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { settings } = useGlobal();

  // Helper: Resize image using Canvas to prevent huge Base64 strings
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;

        // If GIF, return as is (canvas ruins animation)
        if (file.type === 'image/gif') {
           if (file.size > 1024 * 1024) { // 1MB warning for GIFs
             alert("This GIF is quite large. Syncing might be slower.");
           }
           resolve(result);
           return;
        }

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_DIMENSION = 256; // Icons don't need to be huge

          // Resize logic
          if (width > height) {
            if (width > MAX_DIMENSION) {
              height *= MAX_DIMENSION / width;
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width *= MAX_DIMENSION / height;
              height = MAX_DIMENSION;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
             ctx.drawImage(img, 0, 0, width, height);
             // Compress quality to 0.8
             const compressedDataUrl = canvas.toDataURL(file.type, 0.8);
             resolve(compressedDataUrl);
          } else {
             resolve(result);
          }
        };
        img.onerror = reject;
        img.src = result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      try {
          const base64String = await processImageFile(file);
          setCustomIconUrl(base64String);
      } catch (err) {
          console.error("Image processing failed", err);
          alert("Failed to process image.");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(bookmark.id, {
        title,
        url,
        customIconUrl: customIconUrl || undefined,
        initials: title.substring(0, 2).toUpperCase()
    });
    onClose();
  };

  const getFaviconUrl = (u: string) => {
    try {
        const domain = new URL(u).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch { return ''; }
  };

  const previewIcon = customIconUrl || getFaviconUrl(url);

  // Animation Variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { scale: 0.9, opacity: 0, y: 10 },
    visible: { 
        scale: 1, 
        opacity: 1, 
        y: 0,
        transition: { type: "spring", damping: 25, stiffness: 300 } 
    },
    exit: { scale: 0.95, opacity: 0, y: 10, transition: { duration: 0.2 } }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Dark Blurred Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose}
      />

      {/* Modal Window */}
      <motion.div 
        className="w-full max-w-md glass-panel p-6 rounded-3xl shadow-2xl relative border border-white/10 flex flex-col gap-6 z-[10000]"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Edit Shortcut</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Preview Section */}
            <div className="flex justify-center mb-6">
                <div className="relative group flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-[2rem] glass-panel flex items-center justify-center border border-white/20 shadow-lg bg-white/5 overflow-hidden relative">
                        {isProcessing ? (
                            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : previewIcon ? (
                            <img 
                                src={previewIcon} 
                                alt="Preview" 
                                className="w-12 h-12 object-contain drop-shadow-md"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                        ) : null}
                        
                        <div className={`w-12 h-12 flex items-center justify-center ${previewIcon && !isProcessing ? 'hidden' : ''}`}>
                            <Globe size={40} className="text-white/40" />
                        </div>
                    </div>

                    <div className="flex gap-2">
                         <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors flex items-center gap-1.5 border border-white/5"
                         >
                             <Upload size={12} /> Upload Icon
                         </button>
                         {customIconUrl && (
                             <button 
                                type="button"
                                onClick={() => setCustomIconUrl('')}
                                className="px-3 py-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-xs font-medium text-red-100 transition-colors flex items-center gap-1.5 border border-red-500/10"
                             >
                                 <Trash2 size={12} /> Reset
                             </button>
                         )}
                    </div>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/gif, image/webp" 
                        onChange={handleFileUpload} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-white/70 mb-1 pl-1">Name</label>
                <div className="relative">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--theme-color)] transition-all"
                        placeholder="Website Name"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-white/70 mb-1 pl-1">URL</label>
                <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--theme-color)] transition-all"
                        placeholder="https://example.com"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-white/70 mb-1 pl-1">Image URL <span className="text-white/30 text-xs font-normal">(or upload above)</span></label>
                <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input
                        type="text"
                        value={customIconUrl.startsWith('data:') ? '' : customIconUrl}
                        onChange={(e) => setCustomIconUrl(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--theme-color)] transition-all"
                        placeholder={customIconUrl.startsWith('data:') ? "Using uploaded image..." : "https://example.com/icon.png"}
                        disabled={customIconUrl.startsWith('data:')}
                    />
                </div>
            </div>

            <div className="pt-4 flex gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition-all text-sm font-medium"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl theme-bg hover:brightness-110 text-white font-medium shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                >
                    <Check size={16} /> Save Changes
                </button>
            </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
};

export default EditBookmarkModal;