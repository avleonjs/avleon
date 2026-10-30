import { ChildProcess, spawn, spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const isWindows = process.platform === "win32";

/**
 * Stop a child process and everything it spawned. On POSIX the child must
 * have been started with `detached: true` so it leads its own process group;
 * we send SIGTERM to the group and escalate to SIGKILL after `timeoutMs`.
 * Windows has no SIGTERM for console processes, so the tree is ended with
 * `taskkill /T /F`.
 */
export function killTree(child: ChildProcess | null, timeoutMs = 3000): Promise<void> {
  return new Promise((resolve) => {
    if (!child || child.pid === undefined || child.exitCode !== null || child.signalCode !== null) {
      return resolve();
    }
    const pid = child.pid;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve();
    };
    child.once("exit", finish);

    if (isWindows) {
      spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    } else {
      signalGroup(pid, "SIGTERM");
    }
    const timer = setTimeout(() => {
      if (!isWindows) signalGroup(pid, "SIGKILL");
      setTimeout(finish, 200);
    }, timeoutMs);
  });
}

function signalGroup(pid: number, signal: NodeJS.Signals) {
  try {
    process.kill(-pid, signal);
  } catch {
    try {
      process.kill(pid, signal);
    } catch {
      /* already gone */
    }
  }
}

/** Spawn options that make `killTree` work on every platform. */
export const treeSpawnOptions = { detached: !isWindows, windowsHide: true } as const;

/** Locate the project's own TypeScript compiler (`typescript/bin/tsc`). */
export function findTsc(root: string): string | null {
  let dir = path.resolve(root);
  for (;;) {
    const candidate = path.join(dir, "node_modules", "typescript", "bin", "tsc");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Run a node script to completion with inherited stdio, resolving to its exit code. */
export function runNode(script: string, args: string[], cwd: string, env = process.env): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd, stdio: "inherit", env });
    child.on("error", reject);
    child.on("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}
