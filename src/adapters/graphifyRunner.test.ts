import { describe, it, expect } from 'vitest';
import { generateGraph } from './graphifyRunner';

describe('generateGraph', () => {
  it('errors clearly when graphify is not installed', async () => {
    await expect(
      generateGraph('/some/repo', { exec: async () => { throw new Error('command not found: graphify'); } })
    ).rejects.toThrow(/graphify.*(not.*install|required)/i);
  });
  it('returns a graph.json path on success', async () => {
    const p = await generateGraph('/some/repo', { exec: async () => 'ok' });
    expect(p).toMatch(/graph\.json$/);
  });
});
