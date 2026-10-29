import path from 'path'
import { existsSync } from 'fs'

/**
 * Resolve the package root (the directory holding `stubs/`) by walking up from
 * this file. Compiled output lives under `dist/`, at a depth that differs per
 * file, so anchoring on a fixed number of `..` segments is not reliable.
 */
function packageRoot(): string {
  let dir = __dirname
  for (let i = 0; i < 5; i++) {
    if (existsSync(path.join(dir, 'stubs'))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return path.join(__dirname, '../..')
}

export const pathHelper = {
  appSoucePath(p?: string) {
    return path.join(process.cwd(), p ? './src/' + p : './src/')
  },

  appTestPath(p?: string) {
    return path.join(process.cwd(), p ? './test/' + p : './test/')
  },
  stubPath(p?: string) {
    return path.join(packageRoot(), 'stubs', p ?? '')
  },
}
