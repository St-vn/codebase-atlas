import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchBar } from './SearchBar';

const nodes = [{ id:'a', label:'client.py' }, { id:'b', label:'auth.py' }] as any;

describe('SearchBar', () => {
  it('emits matchScores on input', () => {
    const onScores = vi.fn();
    render(<SearchBar nodes={nodes} onScores={onScores} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'client' } });
    expect(onScores).toHaveBeenCalled();
    const scores = onScores.mock.calls.at(-1)![0] as Map<string, number>;
    expect(scores.get('a')!).toBeGreaterThan(scores.get('b')!);
  });
  it('empty query emits all-default scores', () => {
    const onScores = vi.fn();
    render(<SearchBar nodes={nodes} onScores={onScores} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'x' } });
    fireEvent.change(input, { target: { value: '' } });
    const scores = onScores.mock.calls.at(-1)![0] as Map<string, number>;
    expect([...scores.values()].every(v => v === 1)).toBe(true);
  });
});
