import React, { useState, useEffect, useRef } from 'react';
import { Settings, User, LogOut, Cloud, CloudUpload, Upload, X, FileText, Image, Film, Music, Archive, SkipForward, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { BACKGROUNDS, BACKGROUNDS_SPACE2 } from './constants';
import { useGlobal } from './context/GlobalContext';
import SearchBar from './components/SearchBar';
import AppMenu from './components/AppMenu';
import BookmarkGrid from './components/BookmarkGrid';
import InfiniteBar from './components/InfiniteBar';
import BackgroundSwitcher from './components/BackgroundSwitcher';
import SettingsModal from './components/SettingsModal';
import AuthModal from './components/AuthModal';
import TopNav from './components/TopNav';
import Clock from './components/Clock';
import { getVideo } from './utils/db';
import { supabase } from './utils/supabaseClient';
import { WhiteWaveSvg, DarkWaveSvg, DotWavesSvg, CarbonSvg, CircuitSvg } from './components/SvgBackgrounds';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import SortableBookmark from './components/SortableBookmark';
import { Bookmark } from './types';

const hexToRgb = (hex: string) => {
  let c: any;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length === 3) { c = [c[0], c[0], c[1], c[1], c[2], c[2]]; }
    c = '0x' + c.join('');
    return [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',');
  }
  return '0,229,255';
};

// ─── WebGL Shader (upgraded: dual plasma + star field + mouse ripple) ─────────
const VERT_SHADER = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const FRAG_SHADER = `
precision mediump float;
uniform float u_time;
uniform vec2  u_resolution;
uniform vec3  u_color;
uniform vec2  u_mouse;

float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.0+vec2(1.7,9.2);a*=0.5;}return v;}

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution;
  uv.y=1.0-uv.y;
  float t=u_time*0.07;  // slow & calm
  vec2 q=vec2(fbm(uv+t*0.3),fbm(uv+vec2(5.2,1.3)));
  vec2 r=vec2(fbm(uv+q+vec2(1.7,9.2)+0.12*t),fbm(uv+q+vec2(8.3,2.8)+0.1*t));
  float f=fbm(uv+r);
  vec3 dark=vec3(0.05,0.02,0.06);
  vec3 mid=u_color*0.5;
  vec3 bright=u_color*0.85;
  vec3 col=mix(dark,mid,clamp(f*f*3.5,0.0,1.0));
  col=mix(col,bright,clamp(length(q)*0.5,0.0,1.0));
  col=mix(col,dark,f*f*f*0.6);
  // subtle vignette
  float vig=uv.x*(1.0-uv.x)*uv.y*(1.0-uv.y)*16.0;
  col*=pow(vig,0.18);
  gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
}
`;

interface WebGLBgProps { themeColor: string; enabled: boolean; }

const WebGLBackground: React.FC<WebGLBgProps> = ({ themeColor, enabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(Date.now());
  const mouseRef = useRef<[number, number]>([0, 0]);

  const hexToVec3 = (hex: string): [number, number, number] => [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current!;
    const gl = canvas.getContext('webgl', { alpha: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT_SHADER));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG_SHADER));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes  = gl.getUniformLocation(prog, 'u_resolution');
    const uCol  = gl.getUniformLocation(prog, 'u_color');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouse = (e: MouseEvent) => { mouseRef.current = [e.clientX, e.clientY]; };
    window.addEventListener('mousemove', onMouse);

    const loop = () => {
      const t = (Date.now() - startRef.current) / 1000;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      const [r, g, b] = hexToVec3(themeColor);
      gl.uniform3f(uCol, r, g, b);
      gl.uniform2f(uMouse, mouseRef.current[0], mouseRef.current[1]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [enabled, themeColor]);

  if (!enabled) return null;
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ display: 'block' }}
    />
  );
};

// ─── Floating Particles (disabled — was too heavy) ───────────────────────────
const FloatingParticles: React.FC<{ themeColor: string; enabled: boolean }> = ({ themeColor, enabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const hexToRgba = (hex: string, a: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${a})`;
    };

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      r: number; alpha: number; life: number; maxLife: number;
    }

    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.6 - 0.2,
      r: Math.random() * 2.5 + 0.5,
      alpha: 0,
      life: Math.random() * 300,
      maxLife: 300 + Math.random() * 200,
    }));

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.life++;
        if (p.life > p.maxLife) {
          p.life = 0;
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 10;
          p.vx = (Math.random() - 0.5) * 0.4;
          p.vy = -Math.random() * 0.6 - 0.2;
          p.r = Math.random() * 2.5 + 0.5;
          p.maxLife = 300 + Math.random() * 200;
        }
        p.x += p.vx;
        p.y += p.vy;
        const rel = p.life / p.maxLife;
        p.alpha = rel < 0.1 ? rel * 10 : rel > 0.85 ? (1 - rel) / 0.15 : 1;

        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        grad.addColorStop(0, hexToRgba(themeColor, p.alpha * 0.9));
        grad.addColorStop(1, hexToRgba(themeColor, 0));
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [enabled, themeColor]);

  if (!enabled) return null;
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};

// ─── Drop Zone ────────────────────────────────────────────────────────────────
interface DroppedFile { id: string; name: string; size: number; type: string; url: string; }

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image size={18} />;
  if (type.startsWith('video/')) return <Film size={18} />;
  if (type.startsWith('audio/')) return <Music size={18} />;
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return <Archive size={18} />;
  return <FileText size={18} />;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const DropZone: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const addFiles = (raw: FileList | null) => {
    if (!raw) return;
    setFiles(prev => [...prev, ...Array.from(raw).map(f => ({
      id: Math.random().toString(36).slice(2),
      name: f.name, size: f.size, type: f.type,
      url: URL.createObjectURL(f),
    }))]);
  };

  // Listen for drag events on document — but NEVER block pointer events otherwise
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      dragCounter.current++;
      setIsDragging(true);
    };
    const onDragLeave = (e: DragEvent) => {
      dragCounter.current--;
      if (dragCounter.current <= 0) { dragCounter.current = 0; setIsDragging(false); }
    };
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      addFiles(e.dataTransfer?.files ?? null);
      setIsOpen(true);
    };

    document.addEventListener('dragenter', onDragEnter);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragenter', onDragEnter);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('drop', onDrop);
    };
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => {
      const f = prev.find(x => x.id === id);
      if (f) URL.revokeObjectURL(f.url);
      return prev.filter(x => x.id !== id);
    });
  };

  return (
    <>
      {/* Drag overlay — pointer-events-none always, only shows visual */}
      {isDragging && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          style={{
            background: 'rgba(var(--theme-rgb),0.07)',
            backdropFilter: 'blur(3px)',
            border: '3px dashed rgba(var(--theme-rgb),0.55)',
          }}
        >
          <div className="text-center">
            <div style={{ animation: 'bounceUp 0.8s ease infinite alternate' }}>
              <Upload size={60} className="mx-auto mb-4" style={{ color: 'var(--theme-color)', filter: 'drop-shadow(0 0 24px var(--theme-color))' }} />
            </div>
            <p className="text-3xl font-black tracking-widest" style={{
              color: 'var(--theme-color)',
              fontFamily: "'Space Grotesk', sans-serif",
              textShadow: '0 0 40px var(--theme-color), 0 0 80px rgba(var(--theme-rgb),0.33)',
            }}>
              DROP FILES
            </p>
            <p className="text-white/50 mt-2 text-sm">Release to add files</p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        id="drop-zone-btn"
        onClick={() => { setIsOpen(v => !v); }}
        className="fixed bottom-6 left-6 p-3 rounded-2xl backdrop-blur-md text-white/80 hover:text-white transition-all duration-300 z-40 border flex items-center gap-2 group"
        style={{
          background: 'rgba(var(--theme-rgb),0.12)',
          borderColor: 'rgba(var(--theme-rgb),0.30)',
          boxShadow: files.length
            ? '0 0 25px rgba(var(--theme-rgb),0.45), 0 0 50px rgba(var(--theme-rgb),0.15)'
            : '0 4px 20px rgba(0,0,0,0.4)',
        }}
        title="Drop Zone"
      >
        <Upload size={18} style={{ transition: 'transform 0.3s' }} />
        <span className="text-xs font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Drop Zone</span>
        {files.length > 0 && (
          <span className="text-xs font-black rounded-full w-5 h-5 flex items-center justify-center"
            style={{ background: 'var(--theme-color)', color: '#000' }}>
            {files.length}
          </span>
        )}
      </button>

      {/* Hidden input */}
      <input ref={inputRef} type="file" multiple className="hidden"
        onChange={e => { addFiles(e.target.files); setIsOpen(true); e.target.value = ''; }} />

      {/* Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 left-6 z-50 rounded-2xl overflow-hidden"
          style={{
            width: 330,
            maxHeight: 480,
            background: 'rgba(6,6,18,0.92)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(var(--theme-rgb),0.22)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 50px rgba(var(--theme-rgb),0.12)',
            animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1) forwards',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(var(--theme-rgb),0.12)' }}>
            <div className="flex items-center gap-2.5">
              <Upload size={16} style={{ color: 'var(--theme-color)' }} />
              <span className="font-bold text-white text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.05em' }}>
                Drop Zone
              </span>
              {files.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(var(--theme-rgb),0.18)', color: 'var(--theme-color)' }}>
                  {files.length}
                </span>
              )}
            </div>
            <button onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/8">
              <X size={15} />
            </button>
          </div>

          {/* Drop area inside panel */}
          <div
            className="mx-4 mt-3 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
            style={{
              height: 80,
              border: `2px dashed rgba(var(--theme-rgb),0.35)`,
              background: 'rgba(var(--theme-rgb),0.04)',
            }}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={20} style={{ color: 'var(--theme-color)', opacity: 0.7 }} />
            <p className="text-xs text-white/50 mt-1.5">
              <span style={{ color: 'var(--theme-color)', fontWeight: 700 }}>Click</span> or drag files here
            </p>
          </div>

          {/* File list */}
          <div className="p-4 overflow-y-auto" style={{ maxHeight: 250 }}>
            {files.length === 0 ? (
              <p className="text-center text-white/25 text-xs py-6">No files yet</p>
            ) : (
              <div className="space-y-1.5">
                {files.map(f => (
                  <div key={f.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl group transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div style={{ color: 'var(--theme-color)', opacity: 0.8, flexShrink: 0 }}>{getFileIcon(f.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white/90 truncate">{f.name}</p>
                      <p className="text-xs text-white/35">{formatSize(f.size)}</p>
                    </div>
                    <button onClick={() => removeFile(f.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {files.length > 0 && (
            <div className="px-4 pb-4">
              <button
                onClick={() => { files.forEach(f => URL.revokeObjectURL(f.url)); setFiles([]); }}
                className="w-full text-xs py-2 rounded-xl transition-all"
                style={{ background: 'rgba(255,50,50,0.08)', color: 'rgba(255,100,100,0.75)', border: '1px solid rgba(255,50,50,0.18)' }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

// ─── BATR Logo (typing + fade-in, PF Playskool Pro font) ──────────────────────
const BatrLogo: React.FC<{ themeColor: string }> = ({ themeColor }) => {
  const [visible, setVisible] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const fullText = 'batr';
  const [typed, setTyped] = useState('');

  useEffect(() => {
    // Smooth fade-in on mount
    const timer = setTimeout(() => setVisible(true), 100);

    // Type-once animation (does not erase)
    const typeTimer = window.setTimeout(() => {
      let i = 0;
      const id = window.setInterval(() => {
        i += 1;
        setTyped(fullText.slice(0, i));
        if (i >= fullText.length) window.clearInterval(id);
      }, 110);
    }, 250);
    
    // Rare glitch — every 8-15s, very brief
    let glitchTimeout: number | null = null;
    let glitchInnerTimeout: number | null = null;
    const schedule = () => {
      const delay = 8000 + Math.random() * 7000;
      glitchTimeout = window.setTimeout(() => {
        setGlitch(true);
        glitchInnerTimeout = window.setTimeout(() => { setGlitch(false); schedule(); }, 120);
      }, delay);
    };
    schedule();
    
    return () => {
      clearTimeout(timer);
      clearTimeout(typeTimer);
      if (glitchTimeout) clearTimeout(glitchTimeout);
      if (glitchInnerTimeout) clearTimeout(glitchInnerTimeout);
    };
  }, []);

  return (
    <div 
      className="relative flex flex-col items-center justify-center select-none cursor-default"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 1.5s ease-out, transform 1.5s ease-out',
      }}
    >
      {/* Soft glow — always on, not pulsing */}
      <div className="absolute blur-3xl rounded-full pointer-events-none"
        style={{
          width: '160%', height: '220%',
          background: `radial-gradient(ellipse, ${themeColor}28 0%, transparent 70%)`,
        }}
      />

      {/* Main text — shimmer gradient, hover scale */}
      <span
        className="relative font-black uppercase"
        style={{
          fontFamily: '"PFPlayskoolPro-Regular", "PF Playskool Pro", "Space Grotesk", system-ui, sans-serif',
          fontSize: 'clamp(3.5rem, 9vw, 7rem)',
          letterSpacing: '0.15em',
          background: `linear-gradient(135deg, #ffffff 0%, ${themeColor} 45%, #ffffff 70%, ${themeColor} 100%)`,
          backgroundSize: '250% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'shimmerText 6s linear infinite',
          filter: `drop-shadow(0 0 16px ${themeColor}88)`,
          transition: 'filter 0.3s, transform 0.3s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.filter = `drop-shadow(0 0 30px ${themeColor}cc) drop-shadow(0 0 60px ${themeColor}44)`;
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.filter = `drop-shadow(0 0 16px ${themeColor}88)`;
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        }}
      >
        {typed || '\u00A0'}
      </span>

      {/* Rare glitch */}
      {glitch && typed.length === fullText.length && (
        <span className="absolute font-black uppercase pointer-events-none"
          style={{
            fontFamily: '"PFPlayskoolPro-Regular", "PF Playskool Pro", "Space Grotesk", system-ui, sans-serif',
            fontSize: 'clamp(3.5rem, 9vw, 7rem)',
            letterSpacing: '0.15em',
            color: themeColor,
            opacity: 0.35,
            transform: 'translate(5px, -1px)',
            mixBlendMode: 'screen',
          }}>{fullText}</span>
      )}

    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const { settings, updateSettings, bgIndex, setBgIndex, bgSpace, setBgSpace, spaceWallpaper, setSpaceCustomVideo, user, isSyncing, topLinks, setTopLinks, bookmarks, setBookmarks } = useGlobal();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<Bookmark | null>(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;900&family=Orbitron:wght@700;900&display=swap';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 5 } }));

  const findContainer = (id: string) => {
    if (topLinks.find(i => i.id === id)) return 'top-bar';
    if (bookmarks.find(i => i.id === id)) return 'center-grid';
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    const item = topLinks.find(i => i.id === id) || bookmarks.find(i => i.id === id);
    if (item) setActiveItem(item);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;
    if (!overId || active.id === overId) return;
    const aC = findContainer(active.id as string);
    const oC = findContainer(overId as string);
    if (!oC || !aC || aC === oC) return;
    const aItems = aC === 'top-bar' ? topLinks : bookmarks;
    const oItems = oC === 'top-bar' ? topLinks : bookmarks;
    const aIdx = aItems.findIndex(i => i.id === active.id);
    const oIdx = oItems.findIndex(i => i.id === overId);
    const newIdx = oIdx >= 0
      ? oIdx + (active.rect.current.translated && active.rect.current.translated.top > over!.rect.top + over!.rect.height ? 1 : 0)
      : oItems.length + 1;
    const item = aItems[aIdx];
    if (aC === 'top-bar') {
      setTopLinks(topLinks.filter(i => i.id !== active.id));
      setBookmarks([...bookmarks.slice(0, newIdx), item, ...bookmarks.slice(newIdx)]);
    } else {
      setBookmarks(bookmarks.filter(i => i.id !== active.id));
      setTopLinks([...topLinks.slice(0, newIdx), item, ...topLinks.slice(newIdx)]);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const aC = findContainer(active.id as string);
    const oC = over ? findContainer(over.id as string) : null;
    if (aC && oC && aC === oC && over && active.id !== over.id) {
      if (aC === 'top-bar') setTopLinks(arrayMove(topLinks, topLinks.findIndex(i => i.id === active.id), topLinks.findIndex(i => i.id === over.id)));
      else setBookmarks(arrayMove(bookmarks, bookmarks.findIndex(i => i.id === active.id), bookmarks.findIndex(i => i.id === over.id)));
    }
    setActiveId(null);
    setActiveItem(null);
  };

  const dropAnimation = { sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) };

  useEffect(() => {
    let active = true;
    if (spaceWallpaper.customVideo) {
      getVideo(bgSpace).then(blob => {
        if (!active) return;
        if (blob) setVideoUrl(URL.createObjectURL(blob));
        else setSpaceCustomVideo(false);
      }).catch(() => setSpaceCustomVideo(false));
    } else {
      setVideoUrl(null);
    }
    return () => { active = false; };
  }, [spaceWallpaper.customVideo, bgSpace]);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [videoUrl]);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  // Get the correct background array based on current space
  const currentBackgrounds = bgSpace === 0 ? BACKGROUNDS : BACKGROUNDS_SPACE2;
  const currentBgValue = spaceWallpaper.customBackground || currentBackgrounds[bgIndex].value;
  const currentSvgId = !spaceWallpaper.customBackground && !spaceWallpaper.customVideo ? currentBackgrounds[bgIndex].svgId : null;
  const themeRgb = hexToRgb(settings.themeColor);
  const useWebGL = !spaceWallpaper.customBackground && !spaceWallpaper.customVideo && !currentSvgId && settings.isAnimationEnabled;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter}
      onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className={`relative w-full h-screen overflow-hidden text-white ${settings.isAnimationEnabled ? '' : 'disable-animations'}`}>

        {/* Global styles & keyframes */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;900&family=Orbitron:wght@700;900&display=swap');
          @import url('https://db.onlinewebfonts.com/c/1f3cecd67a658841068d04a7d9af5261?family=PFPlayskoolPro-Regular');
          :root {
            --glass-blur: ${settings.blurAmount}px;
            --theme-color: ${settings.themeColor};
            --theme-rgb: ${themeRgb};
          }
          ::selection { background: rgba(var(--theme-rgb),0.35); color: #fff; }
          .glass-panel { backdrop-filter: blur(var(--glass-blur)) !important; -webkit-backdrop-filter: blur(var(--glass-blur)) !important; }
          .theme-text { color: var(--theme-color); }
          .theme-text-accent { color: rgba(var(--theme-rgb),0.8); }
          .theme-bg { background-color: var(--theme-color); }
          .theme-bg-accent { background-color: rgba(var(--theme-rgb),0.3); }
          .theme-bg-glass { background-color: rgba(var(--theme-rgb),0.15); }
          .theme-border { border-color: rgba(var(--theme-rgb),0.25); }
          .theme-hover:hover { background-color: rgba(var(--theme-rgb),0.2); }

          @keyframes gradient-xy {
            0%,100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient-slow { background-size:400% 400%; animation: gradient-xy 20s ease infinite; }

          /* Entry — simple fade only, no bounce */
          @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
          .animate-fade-in-down   { animation: fadeIn 0.7s ease both; }
          .animate-fade-in-down-2 { animation: fadeIn 0.7s 0.1s ease both; }
          .animate-fade-in-up     { animation: fadeIn 0.7s 0.2s ease both; }
          .animate-fade-in        { animation: fadeIn 0.6s ease both; }

          /* Logo shimmer */
          @keyframes shimmerText {
            0%   { background-position: 0% 50%; }
            100% { background-position: 250% 50%; }
          }

          /* Drop Zone */
          @keyframes slideUp {
            from { opacity:0; transform: translateY(12px); }
            to   { opacity:1; transform: translateY(0); }
          }
          @keyframes bounceUp {
            from { transform: translateY(5px); }
            to   { transform: translateY(-5px); }
          }
          @keyframes popIn {
            0% { opacity: 0; transform: scale(0.9) translateY(20px); }
            70% { transform: scale(1.02) translateY(0); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }

          ${!settings.isAnimationEnabled ? `*,*::before,*::after{animation:none!important;transition:none!important;}` : ''}
        `}</style>

        {/* ── Background ── */}
        <div className="absolute inset-0 overflow-hidden z-0 bg-[#030310]">
          {useWebGL && <WebGLBackground themeColor={settings.themeColor} enabled={useWebGL} />}

          <video ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 pointer-events-none ${videoUrl ? 'opacity-100' : 'opacity-0'}`}
            src={videoUrl || undefined} autoPlay muted loop playsInline />
          <div className={`absolute inset-0 bg-black/40 pointer-events-none transition-opacity duration-1000 ${videoUrl ? 'opacity-100' : 'opacity-0'}`} />

          <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${(videoUrl || useWebGL) ? 'opacity-0' : 'opacity-100'}`}
            style={{ background: spaceWallpaper.customBackground ? `url(${spaceWallpaper.customBackground}) center/cover no-repeat` : currentBgValue }}>
            {currentSvgId === 'white-wave' && <WhiteWaveSvg />}
            {currentSvgId === 'dark-wave'  && <DarkWaveSvg  />}
            {currentSvgId === 'dot-waves'  && <DotWavesSvg  />}
            {currentSvgId === 'carbon'     && <CarbonSvg    />}
            {currentSvgId === 'circuit'    && <CircuitSvg   />}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none ${!spaceWallpaper.customBackground && settings.isAnimationEnabled && !currentSvgId ? 'animate-gradient-slow' : ''}`} />
          </div>
        </div>

        {/* ── Infinite Bar ── */}
        <InfiniteBar language={settings.language} />

        {/* ── Main content ── */}
        <div className="relative z-10 w-full h-full flex flex-col pt-12">
          <div className="animate-fade-in">
            <Clock format={settings.timeFormat} />
          </div>

          <header className="flex justify-end items-center p-4 pr-6 gap-2 mt-2 animate-fade-in">
            <TopNav language={settings.language} />
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-white/50" title={isSyncing ? 'Syncing…' : 'Synced'}>
                  {isSyncing ? <CloudUpload size={18} className="animate-pulse theme-text" /> : <Cloud size={18} />}
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-white/5 glass-panel">
                  <div className="w-6 h-6 rounded-full theme-bg flex items-center justify-center text-xs font-bold text-white shadow-lg">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <button onClick={handleLogout} title="Logout" className="text-white/70 hover:text-white transition-colors">
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className="p-3 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors" title="Login">
                <User size={20} />
              </button>
            )}
            <AppMenu language={settings.language} />
          </header>

          <main className="flex-1 flex flex-col items-center justify-center -mt-8 px-4 w-full">
            <div className="mb-6 animate-fade-in-down flex flex-col items-center justify-center">
              <button
                  onClick={() => setIsUrlModalOpen(true)}
                  className="mb-2 p-1.5 rounded-full bg-white/5 hover:bg-white/20 text-white/50 hover:text-white backdrop-blur-md border border-white/5 transition-all duration-300 hover:scale-110 shadow-lg"
                  title="Open URL"
              >
                  <LinkIcon size={14} />
              </button>
              <BatrLogo themeColor={settings.themeColor} />
            </div>

            <div className="animate-fade-in-down-2 w-full flex justify-center">
              <SearchBar engine={settings.searchEngine} language={settings.language} />
            </div>

            <div className="animate-fade-in-up w-full flex justify-center">
              <BookmarkGrid language={settings.language} />
            </div>
          </main>

          <footer className="p-8 flex justify-center pb-12 relative animate-fade-in">
            {!settings.lockBackground && (
              <BackgroundSwitcher
                currentIndex={bgIndex}
                bgSpace={bgSpace}
                onSwitch={setBgIndex}
                onSpaceSwitch={() => {
                  const nextSpace = bgSpace === 0 ? 1 : 0;
                  const nextBackgrounds = nextSpace === 0 ? BACKGROUNDS : BACKGROUNDS_SPACE2;
                  setBgSpace(nextSpace);
                  setBgIndex(Math.min(bgIndex, nextBackgrounds.length - 1));
                }}
              />
            )}
          </footer>
        </div>

        {/* ── Bottom-right controls (Skip + Settings) ── */}
        <div className="fixed bottom-6 right-6 flex items-center gap-3 z-40">
          <button
            onClick={() => {
              const nextSpace = bgSpace === 0 ? 1 : 0;
              const nextBackgrounds = nextSpace === 0 ? BACKGROUNDS : BACKGROUNDS_SPACE2;
              setBgSpace(nextSpace);
              setBgIndex(Math.min(bgIndex, nextBackgrounds.length - 1));
            }}
            className="p-3 rounded-full bg-black/40 hover:bg-[rgba(var(--theme-rgb),0.5)] backdrop-blur-md text-white/80 hover:text-white transition-all duration-300 border border-white/10 hover:scale-110 group"
            title={bgSpace === 0 ? "Go to Space 2" : "Go to Space 1"}
            style={{
              boxShadow: '0 0 20px rgba(var(--theme-rgb),0.3), 0 4px 15px rgba(0,0,0,0.4)',
            }}
          >
            <SkipForward size={20} className="text-[var(--theme-color)] group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 rounded-full bg-black/20 hover:bg-[rgba(var(--theme-rgb),0.4)] backdrop-blur-md text-white/70 hover:text-white transition-all duration-300 border border-white/8 hover:rotate-90"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>

        {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
        {isAuthOpen     && <AuthModal language={settings.language} onClose={() => setIsAuthOpen(false)} />}

        {isUrlModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsUrlModalOpen(false)} style={{ animation: 'fadeIn 0.3s ease-out forwards' }} />
                <div className="relative w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl" style={{ animation: 'popIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards' }}>
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <LinkIcon size={20} className="theme-text" /> Открыть ссылку
                    </h3>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (urlInput) {
                            let finalUrl = urlInput.trim();
                            if (!/^https?:\/\//i.test(finalUrl)) {
                                finalUrl = 'https://' + finalUrl;
                            }
                            window.location.href = finalUrl;
                        }
                    }}>
                        <input
                            autoFocus
                            type="text"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="Вставьте URL сюда..."
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[var(--theme-color)] transition-colors mb-4"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsUrlModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-xl theme-bg text-white hover:opacity-90 transition-opacity flex items-center gap-2"
                            >
                                Перейти <ExternalLink size={16} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* ── Drop Zone ── */}
        <DropZone />

        {/* ── DND overlay ── */}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeId && activeItem ? (
            <SortableBookmark bookmark={activeItem}
              variant={findContainer(activeId) === 'top-bar' ? 'pill' : 'card'}
              onRemove={() => {}} isOverlay />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default App;
