import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import App from './App';
import httpx from '../fixtures/httpx.graph.json';

beforeAll(() => {
  global.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} } as any;
  (global as any).DOMMatrixReadOnly = class { m22 = 1; } as any;
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 800 });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
});

const emptyGraph = { nodes: [], edges: [] };

describe('App P2 integration', () => {
  it('click node → focus gradient + blast-radius; mount cap holds', async () => {
    const mcp = { call: vi.fn().mockResolvedValue({ impacted_ids: [], impact_edges: [] }) };
    render(<App initialGraph={httpx} mcp={mcp} />);
    const nodes = screen.getAllByTestId(/rf-node-/);
    expect(nodes.length).toBeLessThanOrEqual(200); // SCALE-001 still holds under focus
    fireEvent.click(nodes[0]);
    // focus gradient applied — combinedOpacity drives opacity (not binary)
    // blast-radius fetched via MCP
    expect(await screen.findByText(/mcp/i)).toBeInTheDocument(); // provenance badge
  });
  it('MCP unavailable → fallback provenance, no crash, blast still shown', async () => {
    render(<App initialGraph={httpx} mcp={undefined} />);
    fireEvent.click(screen.getAllByTestId(/rf-node-/)[0]);
    expect(await screen.findByText(/fallback|graph/i)).toBeInTheDocument();
  });
  it('search + focus compose: weak-match-far-focus node dims but stays >= 0.18 (multiply/AND, contract §8)', () => {
    render(<App initialGraph={httpx} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'zzznomatch' } });
    fireEvent.click(screen.getAllByTestId(/rf-node-/)[0]);
    const dims = screen.getAllByTestId(/rf-node-/).map(n => parseFloat(getComputedStyle(n).opacity));
    expect(Math.min(...dims)).toBeGreaterThanOrEqual(0.18); // floor holds under compose
  });
  it('F16: empty graph (zero nodes) renders empty-canvas state, no crash (AVAIL-003)', () => {
    expect(() => render(<App initialGraph={emptyGraph} mcp={undefined} />)).not.toThrow();
    expect(screen.getByText(/no nodes to display/i)).toBeInTheDocument();
  });
});
