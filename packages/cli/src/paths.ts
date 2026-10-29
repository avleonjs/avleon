import path from "node:path";

export type BasicAppPaths = {
  root: string,
  src: string,
  test: string,
  public: string

}

export type AppPaths = BasicAppPaths & {
  controllers: string,
  models: string,
  services: string,
  configs: string
  dtos: string
}


export const appPathsMinimal = (rootPath?: string): BasicAppPaths => {
  const root = rootPath ? rootPath : path.join(process.cwd(), "./");
  return {
    root: root,
    src: path.join(root, "src"),
    public: path.join(root, "public"),
    test: path.join(root, "test"),
  }
}

export const appPaths = (rootPath?: string): AppPaths => {
  const root = rootPath ? rootPath : path.join(process.cwd(), "./");
  return {
    root: root,
    src: path.join(root, "src"),
    public: path.join(root, "public"),
    test: path.join(root, "test"),
    controllers: path.join(root, "src/controllers"),
    models: path.join(root, "src/models"),
    services: path.join(root, "src/services"),
    dtos: path.join(root, "src/dtos"),
    configs: path.join(root, "src/config")
  }
}
