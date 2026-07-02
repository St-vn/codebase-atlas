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

const modelBlast = { nodes:[{id:'a',label:'a.py',sourceFile:'a.py',role:'module'}], edges:[] } as any;

describe('DetailPane — blast-radius provenance (AVAIL-002, F7 leaf case, F15 placement)', () => {
  it('shows MCP source badge when blast came from MCP', () => {
    render(<DetailPane model={modelBlast} focusId="a" onSelect={()=>{}} blastRadius={{focusNodeId:'a',impactedIds:[],impactEdges:[],source:'mcp'}} />);
    expect(screen.getByText(/mcp/i)).toBeInTheDocument();
  });
  it('shows fallback badge when blast came from graph-fallback', () => {
    render(<DetailPane model={modelBlast} focusId="a" onSelect={()=>{}} blastRadius={{focusNodeId:'a',impactedIds:[],impactEdges:[],source:'graph-fallback'}} />);
    expect(screen.getByText(/fallback|graph/i)).toBeInTheDocument();
  });
  it('lists impacted (reverse-dep) nodes in the pane', () => {
    const model2 = { nodes:[{id:'a',label:'a.py',sourceFile:'a.py',role:'module'},{id:'b',label:'b.py',sourceFile:'b.py',role:'leaf'}], edges:[{source:'b',target:'a',relation:'calls'}] } as any;
    render(<DetailPane model={model2} focusId="a" onSelect={()=>{}} blastRadius={{focusNodeId:'a',impactedIds:['b'],impactEdges:[{source:'b',target:'a',relation:'calls'}],source:'graph-fallback'}} />);
    expect(screen.getAllByText('b.py').length).toBeGreaterThan(0);
  });
  it('F7: leaf node (zero dependents) — shows "No upstream dependents" + provenance badge, no crash', () => {
    const modelLeaf = { nodes:[{id:'a',label:'leaf.py',sourceFile:'leaf.py',role:'leaf'}], edges:[] } as any;
    render(<DetailPane model={modelLeaf} focusId="a" onSelect={()=>{}} blastRadius={{focusNodeId:'a',impactedIds:[],impactEdges:[],source:'graph-fallback'}} />);
    expect(screen.getByText(/no upstream dependents/i)).toBeInTheDocument();
    // Provenance badge is still shown (honest AVAIL-002).
    expect(screen.getByText(/fallback|graph/i)).toBeInTheDocument();
  });
});
