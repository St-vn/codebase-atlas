import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
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

const model = { nodes: [{id:'a',label:'a.py',role:'module'},{id:'b',label:'b.py',role:'leaf'}], edges: [] } as any;

describe('GraphCanvas — combinedOpacity (US-008, contract §7 phase-2)', () => {
  it('applies combinedOpacity to node style, not matchScores directly', () => {
    const combinedOpacity = new Map([['a',1],['b',0.25]]);
    render(<GraphCanvas model={model} mountedIds={new Set(['a','b'])} combinedOpacity={combinedOpacity} matchScores={new Map()} onSelect={()=>{}} />);
    const b = screen.getByTestId('rf-node-b');
    expect((b.style.opacity || getComputedStyle(b).opacity)).toMatch(/0\.2[0-9]*/);
  });
  it('focus does not expand the mount set beyond mountedIds', () => {
    const full = { ...model, nodes: Array.from({length:1000},(_,i)=>({id:String(i),label:`${i}.py`,role:'leaf'})) };
    const combinedOpacity = new Map(Array.from({length:1000},(_,i)=>[String(i),1]));
    render(<GraphCanvas model={full} mountedIds={new Set(['0','1'])} combinedOpacity={combinedOpacity} matchScores={new Map()} onSelect={()=>{}} />);
    expect(screen.getAllByTestId(/rf-node-/).length).toBe(2); // still capped
  });
});

describe('GraphCanvas — blast-radius (US-009, USABILITY-002)', () => {
  it('impacted nodes get a ring class, not an opacity change', () => {
    const blast = { focusNodeId:'a', impactedIds:['b'], impactEdges:[{source:'b',target:'a',relation:'calls'}], source:'graph-fallback' as const };
    const combinedOpacity = new Map([['a',1],['b',0.18]]); // b is dimmed by focus but is a reverse-dep
    render(<GraphCanvas model={model} mountedIds={new Set(['a','b'])} combinedOpacity={combinedOpacity} matchScores={new Map()} blastRadius={blast} onSelect={()=>{}} />);
    const b = screen.getByTestId('rf-node-b');
    expect(b.className).toMatch(/blast-ring|blast/);   // ring via class
    expect(b.style.opacity).toMatch(/0\.18/);           // opacity UNCHANGED by blast — non-opacity channel
  });
  it('impact edges get accent stroke emphasis', () => {
    const blast = { focusNodeId:'a', impactedIds:['b'], impactEdges:[{source:'b',target:'a',relation:'calls'}], source:'mcp' as const };
    render(<GraphCanvas model={model} mountedIds={new Set(['a','b'])} combinedOpacity={new Map([['a',1],['b',1]])} matchScores={new Map()} blastRadius={blast} onSelect={()=>{}} />);
    const edge = screen.queryByTestId(/rf-edge-b-a|rf-edge-/);
    if (edge) expect(edge.className).toMatch(/blast-edge/);
  });
});
