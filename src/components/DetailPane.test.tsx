import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DetailPane } from './DetailPane';

const model = {
  nodes: [
    { id:'a', label:'a.py', sourceFile:'a.py', sourceLocation:'L1', community:0, role:'module', fanIn:1, fanOut:1 },
    { id:'b', label:'b.py', sourceFile:'b.py', sourceLocation:'L2', community:0, role:'leaf', fanIn:1, fanOut:0 },
  ],
  edges: [{ source:'a', target:'b', relation:'calls' }],
} as any;

describe('DetailPane', () => {
  it('shows the focused node info', () => {
    render(<DetailPane model={model} focusId="a" onSelect={()=>{}} />);
    expect(screen.getByText('a.py')).toBeInTheDocument();
    expect(screen.getByText(/module/i)).toBeInTheDocument();
  });
  it('lists neighbors and re-selects on click', () => {
    const onSelect = vi.fn();
    render(<DetailPane model={model} focusId="a" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('b.py'));
    expect(onSelect).toHaveBeenCalledWith('b');
  });
  it('shows a hint when nothing is focused', () => {
    render(<DetailPane model={model} focusId={null} onSelect={()=>{}} />);
    expect(screen.getByText(/click a node/i)).toBeInTheDocument();
  });
});
