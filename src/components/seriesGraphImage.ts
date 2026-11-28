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

// Read the two text fields independently. Sample several background pixels so a
// digit or JPEG artifact under one sample cannot invert the entire crop.
function tileField(source:ImageData, box:Box, field:'label'|'score') {
  const {x,y,w,h}=box;
  const offset=(dx:number,dy:number)=>((y+dy)*source.width+x+dx)*4;
  const bg=[0,1,2].map(c=>{
    const samples=[];
    for(let row=2;row<=7;row++) for(let col=2;col<=7;col++)
      samples.push(source.data[offset(Math.floor(col*w/10),Math.floor(row*h/10))+c]);
    return samples.sort((a,b)=>a-b)[Math.floor(samples.length/2)];
  });
  const label=field==='label';
  const left=Math.round(w*(label ? .05 : .08)), top=Math.round(h*(label ? .05 : .42));
  const right=Math.round(w*(label ? .65 : .96)), bottom=Math.round(h*(label ? .39 : .94));
  const part=canvas(right-left,bottom-top);
  const out=part.createImageData(part.canvas.width,part.canvas.height);
  for(let dy=0;dy<out.height;dy++) for(let dx=0;dx<out.width;dx++) {
    const p=offset(left+dx,top+dy);
    const diff=Math.max(...bg.map((channel,c)=>Math.abs(source.data[p+c]-channel)));
    const j=(dy*out.width+dx)*4;
    out.data.fill(Math.max(0,255-Math.max(0,diff-24)*3),j,j+3);
    out.data[j+3]=255;
  }
  part.putImageData(out,0,0);
  const width=Math.ceil(out.width*56/out.height);
  const line=canvas(width+24,80);
  line.fillStyle='white'; line.fillRect(0,0,width+24,80);
  line.drawImage(part.canvas,12,12,width,56);
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
      const labelImage=tileField(pixels,b,'label');
      const scoreImage=tileField(pixels,b,'score');
      const pair=canvas(labelImage.width+scoreImage.width,80);
      pair.drawImage(labelImage,0,0); pair.drawImage(scoreImage,labelImage.width,0);
      const combined=(await worker.recognize(pair.canvas)).data.text.trim();
      const combinedScore=combined.match(/(?:10[.,]0|[1-9][.,]\d)$/);
      const label=combinedScore ? combined.slice(0,combinedScore.index).trim() : combined;
      let episode=label.match(/^E\s*(\d+)$/i)?.[1];
      if(!episode) {
        const separate=(await worker.recognize(labelImage)).data.text.trim();
        episode=separate.match(/^E\s*(\d+)$/i)?.[1];
      }
      const isolated=(await worker.recognize(scoreImage)).data.text.trim();
      // Wrapped renders every rating in tenths, including 10.0.
      const digits=isolated.match(/^([1-9]|10)[.,]?(\d)$/);
      const score=digits ? digits[1]+'.'+digits[2] : combinedScore?.[0].replace(',','.');
      votes.push({season,episode:episode ?? '',score:score ?? ''});
    }
    // A repeated truncated label between E70 and E72 is E71, even if OCR read E7.
    const seen=new Set<string>();
    votes.forEach((vote,i)=>{
      const prev=votes[i-1], next=votes[i+1];
      if (prev?.episode && next?.episode && prev.season===vote.season &&
          next.season===vote.season && Number(next.episode)===Number(prev.episode)+2) {
        const expected=String(Number(prev.episode)+1);
        if (!vote.episode || (seen.has(vote.season+'/'+vote.episode) && expected.startsWith(vote.episode)))
          vote.episode=expected;
      }
      seen.add(vote.season+'/'+vote.episode);
    });
    return {showId:showId ? Number(showId) : null,votes};
  } finally { await worker.terminate(); }
}
