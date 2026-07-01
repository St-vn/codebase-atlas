import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('ADR-001 boundary: Core imports nothing from React Flow', () => {
  it('no src/core file imports reactflow', () => {
    const dir = 'src/core';
    const offenders = readdirSync(dir)
      .filter(f => (f.endsWith('.ts') || f.endsWith('.tsx')) && !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'))
      .filter(f => /reactflow|react-flow/.test(readFileSync(join(dir, f), 'utf8')));
    expect(offenders).toEqual([]);
  });
});
