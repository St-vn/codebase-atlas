import { Search } from 'lucide-react';
import { matchScores } from '../core/searchScores';

interface SearchBarProps {
  nodes: { id: string; label: string }[];
  onScores: (scores: Map<string, number>) => void;
}

export function SearchBar({ nodes, onScores }: SearchBarProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onScores(matchScores(nodes, e.target.value));
  }

  return (
    <div className="relative flex items-center">
      <Search
        className="absolute left-2.5 text-muted-foreground pointer-events-none"
        size={14}
        strokeWidth={1.5}
      />
      <input
        type="text"
        role="textbox"
        placeholder="Search nodes…"
        onChange={handleChange}
        className="
          bg-muted text-foreground border border-border rounded-md
          pl-8 pr-3 py-1.5
          text-sm font-mono w-full
          placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:ring-accent
          transition-colors duration-150
        "
      />
    </div>
  );
}
