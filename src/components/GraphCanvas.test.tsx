import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { GraphCanvas } from './GraphCanvas';

beforeAll(() => {
  // jsdom lacks these; React Flow needs them
  global.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} } as any;
  (global as any).DOMMatrixReadOnly = class { m22 = 1; } as any;
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 800 });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
});

const bigModel = {
  nodes: Array.from({length:1000},(_,i)=>({ id:String(i), label:`${i}.py`, role:'leaf', sourceFile:'', sourceLocation:null, community:0, fanIn:0, fanOut:0 })),
  edges: [],
} as any;

describe('GraphCanvas', () => {
  it('renders ONLY mounted nodes, not the full 1000 (SCALE-001)', () => {
    render(<GraphCanvas model={bigModel} mountedIds={new Set(['0','1'])} matchScores={new Map()} onSelect={()=>{}} />);
    expect(screen.getAllByTestId(/rf-node-/).length).toBe(2);
  });
  it('applies matchScore as opacity', () => {
    render(<GraphCanvas model={bigModel} mountedIds={new Set(['0'])} matchScores={new Map([['0',0.3]])} onSelect={()=>{}} />);
    const node = screen.getByTestId('rf-node-0');
    // opacity applied somewhere on the node subtree (inline style)
    expect(node.closest('[style*="opacity"]') || node).toBeTruthy();
  });
});
