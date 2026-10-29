import { exec, execSync } from "node:child_process";

export class AvCli {
  constructor() {}
  private formatFileName() {}
  private async executeCommand(cmd: string) {
    const { stdout, stderr } = exec(cmd, { encoding: "utf8" });
    if (stderr) {
      throw new Error("Can't execute command");
    }
    console.log(stdout);
  }

  displayHelp() {}
  newProject() {}
  makeModel() {}
  makeController() {}
  makeService() {}
  makeConfig() {}
  makeHelper() {}
  makeRestController() {}
  makeRestService() {}

  run() {}
}
