import { describe, it, expect } from 'vitest';
import { loadGraphJson } from './graphJsonLoader';
import httpx from '../../fixtures/httpx.graph.json';

describe('loadGraphJson', () => {
  it('parses graphify nodes and links from real httpx fixture', () => {
    const g = loadGraphJson(httpx);
    expect(g.nodes.length).toBe(144);
    expect(g.edges.length).toBeGreaterThan(0);
    const client = g.nodes.find(n => n.id === 'client');
    expect(client?.label).toBe('client.py');
  });
  it('throws a clear error on malformed input', () => {
    expect(() => loadGraphJson({} as any)).toThrow(/missing nodes/i);
  });
});
