import fs from "fs";
import path from "path";

export type TsConfigInfo = {
  file: string;
  compilerOptions: Record<string, any>;
};

/** Parse JSON that may contain comments and trailing commas, as tsconfig files do. */
export function parseJsonc(text: string): any {
  let out = "";
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inString) {
      out += ch;
      if (ch === "\\") {
        out += next ?? "";
        i++;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
    } else if (ch === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
    } else if (ch === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i++;
    } else {
      out += ch;
    }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}

/**
 * Read a tsconfig and merge `extends` chains (relative paths and packages).
 * Path-valued options (`baseUrl`, `outDir`, `rootDir`) are resolved to
 * absolute paths relative to the file that declared them.
 */
export function readTsConfig(file: string, seen = new Set<string>()): TsConfigInfo {
  const abs = path.resolve(file);
  if (seen.has(abs)) return { file: abs, compilerOptions: {} };
  seen.add(abs);
  const raw = parseJsonc(fs.readFileSync(abs, "utf8"));
  const dir = path.dirname(abs);
  let base: Record<string, any> = {};
  const exts: string[] = raw.extends ? ([] as string[]).concat(raw.extends) : [];
  for (const ext of exts) {
    let target: string | null = null;
    if (ext.startsWith(".") || path.isAbsolute(ext)) {
      target = path.resolve(dir, ext);
      if (!fs.existsSync(target) && fs.existsSync(target + ".json")) target += ".json";
    } else {
      try {
        target = require.resolve(ext, { paths: [dir] });
      } catch {
        target = null;
      }
    }
    if (target && fs.existsSync(target)) {
      base = { ...base, ...readTsConfig(target, seen).compilerOptions };
    }
  }
  const own: Record<string, any> = { ...(raw.compilerOptions ?? {}) };
  for (const key of ["baseUrl", "outDir", "rootDir"]) {
    if (typeof own[key] === "string") own[key] = path.resolve(dir, own[key]);
  }
  if (own.paths && own.baseUrl === undefined && base.baseUrl === undefined) {
    // TypeScript resolves `paths` relative to the declaring tsconfig when baseUrl is unset.
    own.pathsBasePath = dir;
  }
  return { file: abs, compilerOptions: { ...base, ...own } };
}

export function findTsConfig(root: string, preferBuild = false): string | null {
  const names = preferBuild ? ["tsconfig.build.json", "tsconfig.json"] : ["tsconfig.json"];
  for (const name of names) {
    const file = path.join(root, name);
    if (fs.existsSync(file)) return file;
  }
  return null;
}
