import fs from "fs";
import path from "path";
import { CliError } from "../errors";
import { readTsConfig } from "../utils/tsconfig";
import { log } from "../utils/log";
import { copyAssets, requireProjectRoot } from "../utils/project";
import { findTsc, runNode } from "../utils/process";

export type BuildOptions = { cwd?: string; project?: string; quiet?: boolean };

/**
 * Compile the project with its own `tsc`, using `tsconfig.build.json` (or
 * `tsconfig.json` when there is none), then copy non-TS assets from the
 * source dir into the output dir.
 */
export async function build(opts: BuildOptions = {}): Promise<string> {
  const root = requireProjectRoot(opts.cwd ?? process.cwd());
  let config: string;
  if (opts.project) {
    config = path.resolve(opts.cwd ?? process.cwd(), opts.project);
    if (!fs.existsSync(config)) throw new CliError(`${config} not found.`);
  } else if (fs.existsSync(path.join(root, "tsconfig.build.json"))) {
    config = path.join(root, "tsconfig.build.json");
  } else if (fs.existsSync(path.join(root, "tsconfig.json"))) {
    config = path.join(root, "tsconfig.json");
    log.warn("tsconfig.build.json not found; building with tsconfig.json.");
  } else {
    throw new CliError(`No tsconfig.build.json or tsconfig.json found in ${root}.`);
  }

  const tsc = findTsc(root);
  if (!tsc) throw new CliError("TypeScript is not installed in this project. Run `npm install -D typescript`.");

  const configLayout = layoutOf(config, root);
  fs.rmSync(configLayout.outDir, { recursive: true, force: true });

  if (!opts.quiet) log.info(`Compiling with ${path.relative(root, config)}...`);
  const code = await runNode(tsc, ["--project", config], root);
  if (code !== 0) throw new CliError(`Build failed: tsc exited with code ${code}.`, code || 1);

  // tsc mirrors rootDir (or the common source root) into outDir.
  const nestedOut = path.join(configLayout.outDir, path.relative(root, configLayout.srcDir));
  const assetOut = !configLayout.explicitRootDir && fs.existsSync(nestedOut) ? nestedOut : configLayout.outDir;
  const copied = copyAssets(configLayout.srcDir, assetOut);
  if (!opts.quiet) {
    if (copied) log.info(`Copied ${copied} asset file(s) to ${path.relative(root, assetOut)}.`);
    log.success("Build complete.");
  }
  return configLayout.outDir;
}

function layoutOf(config: string, root: string) {
  const opts = readTsConfig(config).compilerOptions;
  return {
    outDir: (opts.outDir as string) ?? path.join(root, "dist"),
    srcDir: (opts.rootDir as string) ?? path.join(root, "src"),
    explicitRootDir: typeof opts.rootDir === "string",
  };
}
