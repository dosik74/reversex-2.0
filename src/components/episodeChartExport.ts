export const themes = {
  plum: { label: 'Слива', background: '#191520', accent: '#c5a1ef' },
  ocean: { label: 'Океан', background: '#101c23', accent: '#74cfd8' },
  graphite: { label: 'Графит', background: '#181a1e', accent: '#c5cbd6' },
};
export type Appearance = { theme: keyof typeof themes; compact: boolean; tinted: boolean };
export const defaultAppearance: Appearance = { theme: 'plum', compact: false, tinted: true };
export function appearance(input: Partial<Appearance> | null): Appearance {
  return {
    theme: input?.theme && Object.prototype.hasOwnProperty.call(themes, input.theme) ? input.theme : defaultAppearance.theme,
    compact: input?.compact === true, tinted: input?.tinted !== false,
  };
}
type SeasonImage = { label: string; cells: { number: number; score: number | null; color: string }[] };

export async function downloadChart(title: string, source: string, settings: Appearance, seasons: SeasonImage[]) {
  const palette = themes[settings.theme];
  const cols = settings.compact ? 12 : 9;
  const width = 1080, margin = 48, gap = 8;
  const cellWidth = (width - 2*margin - (cols-1)*gap)/cols;
  const cellHeight = settings.compact ? 62 : 76;
  const height = 148 + seasons.reduce((n,s) => n + 58 + Math.ceil(s.cells.length / cols)*(cellHeight+gap), 0);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.fillStyle = palette.background;
  ctx.fillRect(0,0,width,height);
  const text = (s:string,x:number,y:number,size:number,color:string,bold=false,maxWidth?:number) => {
    ctx.fillStyle = color;
    ctx.font = `${bold ? 650 : 400} ${size}px "Segoe UI", Arial, sans-serif`;
    ctx.fillText(s,x,y,maxWidth);
  };
  text('ReverseX',margin,41,19,palette.accent,true);
  text(title,margin,85,36,'#ffffff',true,width-2*margin);
  text('Оценки серий · '+source,margin,116,20,'#c5c5cc');
  let y = 144;
  for (const season of seasons) {
    text(season.label,margin,y+22,22,'#fff',true);
    y += 40;
    season.cells.forEach((cell,i) => {
      const x = margin+(i%cols)*(cellWidth+gap), top=y+Math.floor(i/cols)*(cellHeight+gap);
      ctx.fillStyle = settings.tinted && cell.score != null ? cell.color+'33' : '#ffffff0d';
      ctx.beginPath(); ctx.roundRect(x,top,cellWidth,cellHeight,9); ctx.fill();
      text('Серия '+cell.number,x+10,top+19,13,'#c6c6ce');
      text(cell.score?.toFixed(1) ?? '—',x+10,top+cellHeight-13,26,cell.score == null ? '#85858f' : '#fff',true);
      if (cell.score != null) {
        ctx.fillStyle = cell.color;
        ctx.fillRect(x+10,top+cellHeight-6,(cellWidth-20)*cell.score/10,3);
      }
    });
    y += Math.ceil(season.cells.length/cols)*(cellHeight+gap)+18;
  }
  const blob = await new Promise<Blob|null>(resolve => canvas.toBlob(resolve,'image/png'));
  if (!blob) throw new Error('PNG unavailable');
  const url = URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url; link.download=title.replace(/[<>:"/\\|?*]/g,'')+' — оценки серий.png';
  document.body.append(link); link.click(); link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
