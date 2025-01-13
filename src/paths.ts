import path from "node:path";

export type AppPaths = {
  root: string,
  src: string,
  test: string,
  controllers: string,
  models: string,
  services: string,
  requests: string,
  responses: string,
  configs: string
}


export const appPaths = (rootPath?: string): AppPaths => {
  const root = rootPath ? rootPath : path.join(process.cwd(), "./");
  return {
    root: root,
    src: path.join(root, "src"),
    test: path.join(root, "test"),
    controllers: path.join(root, "src/controllers"),
    models: path.join(root, "src/models"),
    services: path.join(root, "src/services"),
    requests: path.join(root, "src/requests"),
    responses: path.join(root, "src/responses"),
    configs: path.join(root, "src/configs")
  }
}
