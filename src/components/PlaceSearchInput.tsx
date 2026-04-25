import { useEffect, useRef, useState } from 'react';
import { searchPlaces, type PlaceSearchResult } from '../services/geocode';

interface PlaceSearchInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceSearchResult) => void;
  placeholder?: string;
  icon?: string; // material symbol name
}

const DEBOUNCE_MS = 250;

const PlaceSearchInput = ({
  id,
  value,
  onChange,
  onSelect,
  placeholder,
  icon,
}: PlaceSearchInputProps) => {
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const ignoreNextSearchRef = useRef(false);

  // 디바운스 검색
  useEffect(() => {
    if (ignoreNextSearchRef.current) {
      ignoreNextSearchRef.current = false;
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const places = await searchPlaces(trimmed, 7);
        setResults(places);
        setIsOpen(true);
        setHighlightIdx(-1);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (place: PlaceSearchResult) => {
    ignoreNextSearchRef.current = true;
    onChange(place.name);
    onSelect(place);
    setIsOpen(false);
    setHighlightIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((idx) => (idx + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((idx) => (idx - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIdx]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {icon && (
        <span className="material-symbols-outlined absolute left-4 top-[14px] text-slate-400 text-[20px] pointer-events-none z-10">
          {icon}
        </span>
      )}
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className={`w-full h-12 ${icon ? 'pl-12' : 'pl-4'} pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-all`}
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {isOpen && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 max-h-72 overflow-y-auto">
          {results.map((place, idx) => (
            <li
              key={`${place.name}-${idx}`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(place);
              }}
              onMouseEnter={() => setHighlightIdx(idx)}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                highlightIdx === idx ? 'bg-primary/5' : 'hover:bg-slate-50'
              } ${!place.withinGangnam ? 'opacity-60' : ''}`}
            >
              <span className={`material-symbols-outlined text-[20px] mt-0.5 shrink-0 ${
                place.withinGangnam ? 'text-primary' : 'text-slate-400'
              }`}>
                {place.withinGangnam ? 'place' : 'location_off'}
              </span>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-slate-900 truncate">{place.name}</span>
                <span className="text-xs text-slate-500 truncate">{place.address}</span>
              </div>
              {!place.withinGangnam && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shrink-0 self-center">
                  강남구 외부
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOpen && !isLoading && results.length === 0 && value.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 z-50">
          <p className="text-sm text-slate-400 text-center">검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  );
};

export default PlaceSearchInput;
