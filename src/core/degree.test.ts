import { describe, it, expect } from 'vitest';
import { computeDegrees } from './degree';
import { loadGraphJson } from './graphJsonLoader';
import httpx from '../../fixtures/httpx.graph.json';

describe('computeDegrees', () => {
  it('counts fanIn/fanOut from edges', () => {
    const g = loadGraphJson(httpx);
    const deg = computeDegrees(g);
    const client = deg.get('client')!;
    expect(client.fanIn + client.fanOut).toBeGreaterThan(0);
  });
  it('initializes every node to zero even with no edges', () => {
    const deg = computeDegrees({ nodes: [{id:'x'} as any], edges: [] });
    expect(deg.get('x')).toEqual({ fanIn: 0, fanOut: 0 });
  });
});
