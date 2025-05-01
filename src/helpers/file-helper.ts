

const filenameFromPath = (fpath: string) => fpath.split('/')[fpath.split('/').length - 1];
export function getLastPart(str: string, separator: any) {
    if (!str.includes(separator)) return str
    const parts = str.split(separator)
    return parts.at(-1)
  }
  
  export function resolveNames(name: string,exclude:string) {
    const parsedName = name.replace(exclude,'')
  
    return {
      className: parsedName.charAt(0).toUpperCase() + name.slice(1),
      fileName: parsedName.toLowerCase(),
      varName: parsedName.toLowerCase(),
    }
  }
export const fh = { filenameFromPath }

