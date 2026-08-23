import { ReactNode, useState } from 'react';
import { ChevronRight, ChevronUp } from 'lucide-react';

interface PosterRowProps<T> {
  title: string;
  items: T[];
  render: (item: T) => ReactNode;
  /** key extractor */
  getKey: (item: T) => string | number;
}

/**
 * Kinopoisk-style horizontal poster row with a "Посмотреть все" card
 * at the end that expands the row into a full grid.
 */
export default function PosterRow<T>({ title, items, render, getKey }: PosterRowProps<T>) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="mb-10">
      <style>{`
        .pr-in { animation: pr-fade .4s ease both; }
        @keyframes pr-fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <h2 className="font-grotesk text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2">
        {title}
      </h2>

      {expanded ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
            {items.map((item) => (
              <div key={getKey(item)} className="pr-in">{render(item)}</div>
            ))}
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="mt-5 flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold bg-white/[0.05] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.1] hover:text-white transition-all"
          >
            <ChevronUp className="w-4 h-4" />
            Свернуть
          </button>
        </>
      ) : (
        <div className="flex gap-3 overflow-x-auto kp-scroll pb-2 -mx-1 px-1">
          {items.map((item) => (
            <div key={getKey(item)} className="shrink-0 w-[150px] sm:w-[170px] lg:w-[185px] pr-in">
              {render(item)}
            </div>
          ))}
          {/* Посмотреть все */}
          <button
            onClick={() => setExpanded(true)}
            className="shrink-0 w-[150px] sm:w-[170px] lg:w-[185px] aspect-[2/3] rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/[0.08] hover:border-purple-500/50 hover:from-purple-500/10 flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-white transition-all group"
          >
            <span className="w-12 h-12 rounded-full bg-white/[0.06] group-hover:bg-purple-500/30 flex items-center justify-center transition-colors">
              <ChevronRight className="w-6 h-6" />
            </span>
            <span className="text-sm font-semibold px-3 text-center leading-tight">Посмотреть все</span>
          </button>
        </div>
      )}
    </section>
  );
}
