const useColor =
  !process.env.NO_COLOR && (process.env.FORCE_COLOR !== undefined || process.stdout.isTTY === true);

const code = (open: string) => (s: string) => (useColor ? `\x1b[${open}m${s}\x1b[0m` : s);

export const c = {
  dim: code("90"),
  bold: code("1"),
  cyan: code("36"),
  green: code("32"),
  yellow: code("33"),
  red: code("31"),
  white: code("37"),
};

export const icon = {
  success: c.green("✔"),
  error: c.red("✖"),
  warn: c.yellow("⚠"),
  arrow: c.dim("→"),
};

export const log = {
  info: (msg: string) => console.log(msg),
  step: (label: string, detail?: string) =>
    console.log(`  ${icon.arrow} ${label.padEnd(30, " ")}${detail ? c.dim(detail) : ""}`),
  success: (msg: string) => console.log(`${icon.success} ${msg}`),
  warn: (msg: string) => console.warn(`${icon.warn} ${c.yellow(msg)}`),
  error: (msg: string) => console.error(`${icon.error} ${c.red(msg)}`),
  section: (title: string) => {
    console.log(`\n${c.bold(c.cyan(`  ${title}`))}`);
    console.log(`  ${"─".repeat(40)}`);
  },
};

/** Timestamped, category-prefixed logging used by the long-running commands. */
export function tagged(category: string, color: (s: string) => string = c.white) {
  return (message: string) => {
    const ts = new Date().toTimeString().split(" ")[0];
    console.log(`${c.dim(`[${ts}]`)} ${color(`[${category}]`)} ${message}`);
  };
}
