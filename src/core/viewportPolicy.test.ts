import { describe, it, expect } from 'vitest';
import { mountSet } from './viewportPolicy';

describe('ViewportPolicy (SCALE-001 invariant)', () => {
  it('NEVER mounts more than the cap, even for a 5000-node graph', () => {
    const nodes = Array.from({length: 5000}, (_,i) => ({ id: String(i) }));
    const ids = mountSet(nodes as any, [], { focusId: '0', cap: 200 });
    expect(ids.size).toBeLessThanOrEqual(200);
  });
  it('always includes the focus node', () => {
    const nodes = Array.from({length: 500}, (_,i) => ({ id: String(i) }));
    const ids = mountSet(nodes as any, [], { focusId: '42', cap: 200 });
    expect(ids.has('42')).toBe(true);
  });
  it('with no focus, returns top-cap nodes (still capped)', () => {
    const nodes = Array.from({length: 500}, (_,i) => ({ id: String(i) }));
    const ids = mountSet(nodes as any, [], { focusId: null, cap: 50 });
    expect(ids.size).toBeLessThanOrEqual(50);
  });
  it('BFS expands from focus along edges before filling', () => {
    const nodes = [{id:'a'},{id:'b'},{id:'c'},{id:'d'}] as any;
    const edges = [{source:'a',target:'b'},{source:'b',target:'c'}] as any;
    const ids = mountSet(nodes, edges, { focusId: 'a', cap: 3 });
    expect(ids.has('a')).toBe(true);
    expect(ids.has('b')).toBe(true); // b is a neighbor of focus a
    expect(ids.size).toBe(3);
  });
});
