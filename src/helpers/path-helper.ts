import path from 'path'
import {fileURLToPath} from 'url'

// export const __filename = fileURLToPath(process.argv[1])
// export const __dirname = path.dirname(__filename)

/*  */

export const pathHelper = {
  appSoucePath(p?: string) {
    return path.join(process.cwd(), p ? './src/' + p : './src/')
  },

  appTestPath(p?: string) {
    return path.join(process.cwd(), p ? './test/' + p : './test/')
  },
  stubPath(p?: string) {
    return path.join(__dirname, p ? '../../stubs/' + p : '../../stubs/')
  },
}
