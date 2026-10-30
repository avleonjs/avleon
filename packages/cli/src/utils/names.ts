import path from "path";
import { CliError } from "../errors";

/** Split an identifier into words: `JwtAuth`, `jwt-auth`, `jwt_auth` and `jwtAuth` all give `[jwt, auth]`. */
export function words(input: string): string[] {
  const matches = input.match(/[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+|\d+/g);
  return (matches ?? []).map((w) => w.toLowerCase());
}

const upperFirst = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export const pascalCase = (input: string) => words(input).map(upperFirst).join("");
export const camelCase = (input: string) => {
  const p = pascalCase(input);
  return p ? p[0].toLowerCase() + p.slice(1) : p;
};
export const kebabCase = (input: string) => words(input).join("-");
export const snakeCase = (input: string) => words(input).join("_");
/** Human-readable title, e.g. `my_api` -> `My Api`. */
export const titleCase = (input: string) => words(input).map(upperFirst).join(" ");

export type ResolvedName = {
  /** Sub-directories requested in the name, e.g. `["admin"]` for `admin/User`. */
  dirs: string[];
  /** PascalCase name without the suffix, e.g. `JwtAuth`. */
  base: string;
  /** PascalCase class name with the suffix, e.g. `JwtAuthConfig`. */
  className: string;
  /** camelCase base, e.g. `jwtAuth`. */
  varName: string;
  /** kebab-case base, e.g. `jwt-auth`. */
  fileBase: string;
};

/**
 * Resolve a user-supplied artifact name (optionally nested, e.g. `admin/User`
 * or `admin\User`) into class and file names. A trailing suffix such as
 * `Controller` is dropped before it is re-added, so `UserController` and `User`
 * give the same result.
 */
export function resolveName(input: string, suffix = ""): ResolvedName {
  if (!input || !input.trim()) throw new CliError("A name is required.");
  const parts = input.split(/[\\/]+/).filter(Boolean);
  const last = parts.pop() ?? "";
  for (const dir of parts) {
    if (dir === "." || dir === ".." || path.isAbsolute(dir)) {
      throw new CliError(`Invalid name "${input}": use a relative path without "." or "..".`);
    }
  }
  const stripped = suffix ? last.replace(new RegExp(`[-_.]?${suffix}$`, "i"), "") : last;
  const base = pascalCase(stripped);
  if (!base) throw new CliError(`Invalid name "${input}".`);
  return {
    dirs: parts.map((d) => kebabCase(d) || d),
    base,
    className: base + suffix,
    varName: camelCase(base),
    fileBase: kebabCase(base),
  };
}
