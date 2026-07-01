import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import App from './App';
import httpx from '../fixtures/httpx.graph.json';

beforeAll(() => {
  global.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} } as any;
  (global as any).DOMMatrixReadOnly = class { m22 = 1; } as any;
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 800 });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
});

describe('App integration', () => {
  it('renders the shell with both regions', () => {
    render(<App initialGraph={httpx} />);
    expect(screen.getByTestId('graph-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('detail-pane')).toBeInTheDocument();
  });
  it('renders capped nodes from the real 144-node fixture (SCALE-001)', () => {
    render(<App initialGraph={httpx} />);
    expect(screen.getAllByTestId(/rf-node-/).length).toBeLessThanOrEqual(200);
    expect(screen.getAllByTestId(/rf-node-/).length).toBeGreaterThan(0);
  });
  it('search input is present and typing does not crash', () => {
    render(<App initialGraph={httpx} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'client' } });
    expect(screen.getByRole('textbox')).toHaveValue('client');
  });
});
