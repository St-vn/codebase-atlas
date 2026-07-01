import { describe, it, expect } from 'vitest';
import { buildModel } from './typedGraphModel';
import { loadGraphJson } from './graphJsonLoader';
import httpx from '../../fixtures/httpx.graph.json';

describe('buildModel', () => {
  it('produces 144 typed nodes, each with a role', () => {
    const model = buildModel(loadGraphJson(httpx));
    expect(model.nodes).toHaveLength(144);
    expect(model.nodes.every(n => !!n.role)).toBe(true);
  });
  it('carries fanIn/fanOut and preserves edges', () => {
    const model = buildModel(loadGraphJson(httpx));
    const client = model.nodes.find(n => n.id === 'client')!;
    expect(client.fanIn + client.fanOut).toBeGreaterThan(0);
    expect(model.edges.length).toBeGreaterThan(0);
  });
  it('assigns interface role when inherits-in >= 3 (synthetic)', () => {
    const g = { nodes:[{id:'base',label:'Base',source_file:'',source_location:null,community:0},{id:'a',label:'A',source_file:'',source_location:null,community:0},{id:'b',label:'B',source_file:'',source_location:null,community:0},{id:'c',label:'C',source_file:'',source_location:null,community:0}], edges:[{source:'a',target:'base',relation:'inherits'},{source:'b',target:'base',relation:'inherits'},{source:'c',target:'base',relation:'inherits'}] };
    const model = buildModel(g as any);
    expect(model.nodes.find(n=>n.id==='base')!.role).toBe('interface');
  });
});
