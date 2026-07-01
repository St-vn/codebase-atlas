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
    <input
      type="text"
      role="textbox"
      onChange={handleChange}
      style={{
        background: '#272F42',
        color: '#F8FAFC',
        border: '1px solid #475569',
        outline: 'none',
      }}
      onFocus={e => (e.target.style.boxShadow = '0 0 0 2px #22C55E')}
      onBlur={e => (e.target.style.boxShadow = '')}
    />
  );
}
