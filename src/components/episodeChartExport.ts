export const themes = {
  plum: { label: 'Слива', background: '#191520', accent: '#c5a1ef' },
  ocean: { label: 'Океан', background: '#101c23', accent: '#74cfd8' },
  graphite: { label: 'Графит', background: '#181a1e', accent: '#c5cbd6' },
};
export type Appearance = { theme: keyof typeof themes; compact: boolean; tinted: boolean };
export const defaultAppearance: Appearance = { theme: 'graphite', compact: false, tinted: true };
export function appearance(input: Partial<Appearance> | null): Appearance {
  return {
    theme: input?.theme && Object.prototype.hasOwnProperty.call(themes, input.theme) ? input.theme : defaultAppearance.theme,
    compact: input?.compact === true, tinted: input?.tinted !== false,
  };
}
type SeasonImage = { label: string; cells: { number: number; score: number | null; color: string }[] };

export async function downloadChart(title: string, source: string, settings: Appearance, seasons: SeasonImage[]) {
  const palette = themes[settings.theme];
  const rows = [...new Set(seasons.flatMap(season => season.cells.map(cell => cell.number)))].sort((a,b) => a-b);
  const margin = 36, gap = 8, axis = 66;
  const cellWidth = settings.compact ? 88 : 120;
  const cellHeight = settings.compact ? 44 : 60;
  const width = Math.max(480, 2 * margin + axis + seasons.length * (cellWidth + gap));
  const height = 176 + rows.length * (cellHeight + gap) + margin;
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
  ctx.textAlign = 'center';
  text('Серия', margin + axis / 2, 158, 15, '#bbbdc4');
  rows.forEach((number, index) => {
    text(String(number), margin + axis / 2, 176 + index * (cellHeight + gap) + cellHeight / 2 + 6, 18, '#bbbdc4');
  });
  for (const [column, season] of seasons.entries()) {
    const x = margin + axis + column * (cellWidth + gap);
    text(season.label, x + cellWidth / 2, 158, 15, '#bbbdc4', false, cellWidth);
    for (const cell of season.cells) {
      const top = 176 + rows.indexOf(cell.number) * (cellHeight + gap);
      const filled = settings.tinted && cell.score != null;
      ctx.fillStyle = filled ? cell.color : '#ffffff0d';
      ctx.beginPath();
      ctx.roundRect(x, top, cellWidth, cellHeight, 6);
      ctx.fill();
      const ink = cell.score == null ? '#92939b' : !filled ? cell.color :
        cell.score >= 9 && cell.score < 9.7 ? '#ffffff' : '#101317';
      text(cell.score?.toFixed(1) ?? '—', x + cellWidth / 2, top + cellHeight / 2 + 9, 28, ink, true);
    }
  }
  const blob = await new Promise<Blob|null>(resolve => canvas.toBlob(resolve,'image/png'));
  if (!blob) throw new Error('PNG unavailable');
  const url = URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url; link.download=title.replace(/[<>:"/\\|?*]/g,'')+' — оценки серий.png';
  document.body.append(link); link.click(); link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
