import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

function scan(dir: string, pattern: RegExp): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    .filter(f => pattern.test(readFileSync(join(dir, f), 'utf8')));
}

describe('ADR-001 + ADR-003 boundary guards (F13: also covers src/state/)', () => {
  it('no src/core file imports reactflow', () => {
    expect(scan('src/core', /reactflow|react-flow/)).toEqual([]);
  });
  it('no src/core file imports the MCP client or blastRadiusClient (adapter-only)', () => {
    expect(scan('src/core', /blastRadiusClient|mcp-client|@modelcontextprotocol/)).toEqual([]);
  });
  it('F13: no src/state/ file imports reactflow, MCP, or blastRadiusClient — only via adapters/', () => {
    const offenders = scan('src/state', /reactflow|react-flow|@modelcontextprotocol|blastRadiusClient/);
    expect(offenders).toEqual([]);
  });
  it('BlastRadiusClient is the sole MCP touchpoint (only adapters/ file mentioning get_pr_impact)', () => {
    const touching = scan('src/adapters', /get_pr_impact/);
    expect(touching).toEqual(['blastRadiusClient.ts']);
  });
});
