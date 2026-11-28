import { createWorker, OEM, PSM } from 'tesseract.js';
import workerPath from 'tesseract.js/dist/worker.min.js?url';
import corePath from 'tesseract.js-core/tesseract-core-lstm.wasm.js?url';
type Box = { x:number; y:number; w:number; h:number };
export type PhotoVote = { season:number | null; episode:string; score:string };

function canvas(w:number, h:number) {
  const el = document.createElement('canvas');
  el.width = w; el.height = h;
  return el.getContext('2d', {willReadFrequently:true})!;
}

// Find solid, saturated rectangles even when JPEG compression shifts their RGB values.
function tiles({data,width,height}:ImageData): Box[] {
  const mask = new Uint8Array(width * height);
  for (let i=0; i<mask.length; i++) {
    const [r,g,b] = [data[i*4],data[i*4+1],data[i*4+2]];
    mask[i] = Number(Math.max(r,g,b)-Math.min(r,g,b)>48);
  }
  const stack = new Int32Array(mask.length);
  const boxes:Box[] = [];
  for (let i=0;i<mask.length;i++) {
    if (!mask[i]) continue;
    let size=1, count=0, left=width, top=height, right=0, bottom=0;
    stack[0]=i; mask[i]=0;
    while (size) {
      const pos=stack[--size], x=pos%width, y=Math.floor(pos/width);
      left=Math.min(left,x); right=Math.max(right,x);
      top=Math.min(top,y); bottom=Math.max(bottom,y); count++;
      for (const next of [x ? pos-1 : -1,x+1<width ? pos+1 : -1,pos-width,pos+width]) {
        if (mask[next]) { mask[next]=0; stack[size++]=next; }
      }
    }
    const w=right-left+1,h=bottom-top+1;
    if (h>=17 && w>=28 && w/h>1.12 && w/h<3 && count>.66*w*h)
      boxes.push({x:left,y:top,w,h});
  }
  const counts=new Map<string,number>();
  for (const b of boxes) {
    const key=Math.round(b.w/5)+','+Math.round(b.h/5);
    counts.set(key,(counts.get(key) ?? 0)+1);
  }
  const common=[...counts].sort((a,b)=>b[1]-a[1])[0];
  if (!common) return [];
  const [w,h]=common[0].split(',').map(v=>Number(v)*5);
  return boxes.filter(b=>Math.abs(b.w-w)<=Math.max(4,w*.1) && Math.abs(b.h-h)<=Math.max(4,h*.1))
    .sort((a,b)=>Math.abs(a.y-b.y)<h*.35 ? a.x-b.x : a.y-b.y);
}

// Put the small episode label and large score on a single high-contrast baseline.
function lineForTile(source:ImageData, box:Box) {
  const line=canvas(340,66);
  line.fillStyle='white'; line.fillRect(0,0,340,66);
  const {x,y,w,h}=box;
  const sample=((y+Math.floor(h*.43))*source.width+x+Math.floor(w*.55))*4;
  function field(start:number,end:number,left:number,right:number,dest:number) {
    const part=canvas(right-left,end-start);
    const out=part.createImageData(part.canvas.width,part.canvas.height);
    for(let dy=0;dy<out.height;dy++) for(let dx=0;dx<out.width;dx++) {
      const p=((y+start+dy)*source.width+x+left+dx)*4;
      const diff=Math.max(...[0,1,2].map(c=>Math.abs(source.data[p+c]-source.data[sample+c])));
      const j=(dy*out.width+dx)*4;
      out.data.fill(Math.max(0,255-(diff-32)*4),j,j+3); out.data[j+3]=255;
    }
    part.putImageData(out,0,0);
    line.drawImage(part.canvas,dest,8,out.width*48/out.height,48);
  }
  field(Math.round(h*.06),Math.round(h*.39),Math.round(w*.05),Math.round(w*.55),8);
  field(Math.round(h*.42),Math.round(h*.94),Math.round(w*.14),Math.round(w*.96),164);
  return line.canvas;
}

export async function readSeriesGraph(file:File, progress:(message:string)=>void) {
  const bitmap=await createImageBitmap(file);
  const scale=Math.min(1,2400/bitmap.width,3600/bitmap.height);
  const ctx=canvas(Math.round(bitmap.width*scale),Math.round(bitmap.height*scale));
  ctx.drawImage(bitmap,0,0,ctx.canvas.width,ctx.canvas.height); bitmap.close();
  const pixels=ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
  const boxes=tiles(pixels);
  if (!boxes.length) throw new Error('Не найдены цветные карточки. Выберите в SeriesGraph вид Wrapped с подписями E1, E2…');
  const worker=await createWorker('eng',OEM.LSTM_ONLY,{
    langPath:new URL(import.meta.env.BASE_URL+'ocr/',location.origin).href,
    workerPath:new URL(workerPath,location.href).href, corePath:new URL(corePath,location.href).href,
  });
  try {
    async function readArea(x:number,y:number,w:number,h:number) {
      const area=canvas(w*2,h*2);
      area.drawImage(ctx.canvas,x,y,w,h,0,0,w*2,h*2);
      await worker.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT,tessedit_char_whitelist:''});
      return (await worker.recognize(area.canvas)).data.text;
    }
    const address=await readArea(0,0,ctx.canvas.width,Math.min(60,ctx.canvas.height));
    const showId=address.match(/seriesgraph\.com\s*\/\s*show\s*\/\s*(\d+)/i)?.[1];
    const votes:PhotoVote[]=[];
    let lastBottom=-Infinity, season:number|null=null;
    for (const b of boxes) {
      if (b.y-lastBottom>b.h*.55) {
        const top=Math.max(0,b.y-Math.round(b.h*.85));
        const heading=top<b.y ? await readArea(Math.max(0,b.x-2),top,Math.min(ctx.canvas.width-b.x,Math.ceil(b.w*3)),b.y-top) : '';
        const match=heading.match(/Season\s*(\d+)/i);
        season=match ? Number(match[1]) : null;
        await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_LINE,tessedit_char_whitelist:'E0123456789.,',preserve_interword_spaces:'1'});
      }
      lastBottom=Math.max(lastBottom,b.y+b.h);
      progress(`Читаем оценки: ${votes.length+1} из ${boxes.length}`);
      const result=await worker.recognize(lineForTile(pixels,b));
      const raw=result.data.text.trim();
      const rating=raw.match(/(?:10[.,]0|[1-9][.,]\d)$/);
      const label=rating ? raw.slice(0,rating.index).trim() : raw;
      votes.push({season,episode:label.match(/^E\s*(\d+)$/i)?.[1] ?? '',score:rating?.[0].replace(',','.') ?? ''});
    }
    // An isolated unreadable label between E10 and E12 can only be E11.
    votes.forEach((vote,i)=>{
      const prev=votes[i-1], next=votes[i+1];
      if (!vote.episode && prev?.episode && next?.episode && prev.season===vote.season &&
          next.season===vote.season && Number(next.episode)===Number(prev.episode)+2)
        vote.episode=String(Number(prev.episode)+1);
    });
    return {showId:showId ? Number(showId) : null,votes};
  } finally { await worker.terminate(); }
}
