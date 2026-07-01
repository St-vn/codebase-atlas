import { exec as nodeExec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(nodeExec);

async function defaultExec(cmd: string): Promise<string> {
  const { stdout } = await execAsync(cmd);
  return stdout;
}

export async function generateGraph(
  repoPath: string,
  opts?: { exec?: (cmd: string) => Promise<string> }
): Promise<string> {
  const exec = opts?.exec ?? defaultExec;

  try {
    await exec(`graphify --repo "${repoPath}" --out "${repoPath}/graphify-out"`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/not found|ENOENT|command not found/i.test(message)) {
      throw new Error(
        'graphify is required but not installed — install it (see https://github.com/safishamsi/graphify) then retry'
      );
    }
    throw err;
  }

  return `${repoPath}/graphify-out/graph.json`;
}
