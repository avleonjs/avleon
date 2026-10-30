import fs from "fs";
import path from "path";
import type { Options } from "@swc/core";

export type CompileResult = { ok: true } | { ok: false; error: string };

export function isTestFile(file: string): boolean {
  return /\.(test|spec)\.[cm]?[tj]s$/.test(path.basename(file));
}

export function isTsSource(file: string): boolean {
  return /\.ts$/.test(file) && !/\.d\.ts$/.test(file);
}

/**
 * Fast per-file TypeScript -> CommonJS transpiler (SWC). It does not type-check;
 * `serve` runs `tsc --noEmit` alongside it for that. tsconfig `paths` are
 * rewritten to relative imports at compile time, so no runtime hook is needed.
 */
export class SwcCompiler {
  private readonly options: Options;

  constructor(
    readonly srcDir: string,
    readonly outDir: string,
    compilerOptions: Record<string, any> = {},
  ) {
    const baseUrl: string | undefined = compilerOptions.baseUrl ?? compilerOptions.pathsBasePath;
    const paths = compilerOptions.paths as Record<string, string[]> | undefined;
    this.options = {
      swcrc: false,
      configFile: false,
      sourceMaps: "inline",
      module: { type: "commonjs" },
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        target: "es2022",
        keepClassNames: true,
        transform: { legacyDecorator: true, decoratorMetadata: true },
        ...(paths && baseUrl ? { baseUrl, paths } : {}),
      },
    };
  }

  outFileFor(file: string): string {
    return path.join(this.outDir, path.relative(this.srcDir, file)).replace(/\.ts$/, ".js");
  }

  compileFile(file: string): CompileResult {
    try {
      // Loaded lazily: the native binding is only needed by serve and route:list.
      const { transformFileSync } = require("@swc/core") as typeof import("@swc/core");
      const result = transformFileSync(file, { ...this.options, filename: file });
      const out = this.outFileFor(file);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, result.code, "utf8");
      return { ok: true };
    } catch (err) {
      // Never leave stale JS behind for a file that no longer compiles.
      fs.rmSync(this.outFileFor(file), { force: true });
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  /** All non-test `.ts` sources under `srcDir`. */
  sources(): string[] {
    if (!fs.existsSync(this.srcDir)) return [];
    return fs
      .readdirSync(this.srcDir, { withFileTypes: true, recursive: true })
      .filter((e) => e.isFile() && isTsSource(e.name) && !isTestFile(e.name))
      .map((e) => path.join((e as any).parentPath ?? (e as any).path, e.name));
  }

  compileAll(): Map<string, string> {
    const failures = new Map<string, string>();
    for (const file of this.sources()) {
      const r = this.compileFile(file);
      if (!r.ok) failures.set(file, r.error);
    }
    return failures;
  }
}
