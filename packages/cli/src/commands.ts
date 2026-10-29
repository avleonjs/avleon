import chalk from "chalk";
export type CommandType = {
  Command: string;
  Alias: string;
  Options: string;
  Description: string;
}

export const commandList: CommandType[] = [
  {
    Command: "new",
    Alias: "",
    Options: "-m --minimal",
    Description: "Create a new application",
  },
  {
    Command: "serve",
    Alias: "",
    Options: "",
    Description:
      "Start the development server. Compiles src/ on change and restarts the app.",
  },
  {
    Command: "build",
    Alias: "",
    Options: "",
    Description: "Compile the application using tsconfig.build.json",
  },
  {
    Command: "make:model",
    Alias: "m:m",
    Options: "-f --force, --orm",
    Description:
      "Create a new model. Use -f or --force to overwrite an existing model. Pass --orm to generate a TypeORM entity.",
  },
  {
    Command: "make:controller",
    Alias: "m:c",
    Options: "-f --force, -r --resource, -m --model, -rt --root, --orm, --base-path",
    Description: `Create a new controller. Use -f or --force to overwrite an existing controller.
Pass -r or --resource for a full REST skeleton, and -m or --model to bind it to a model.\n
${chalk.blueBright("Note:")} with -m, the matching service is generated in src/services and the
controller delegates to it. Add --orm to back that service with a TypeORM repository.`,
  },
  {
    Command: "make:service",
    Alias: "m:s",
    Options: "-f --force, -r --resource, -m --model, -rt --root, --orm",
    Description: `Create a new service. Use -f or --force to overwrite an existing service.
Pass -r or --resource together with -m or --model for a REST service.\n
${chalk.blueBright("Note:")} a resource service uses an in-memory Collection by default.
Add --orm to generate one backed by a TypeORM repository instead.`,
  },
  {
    Command: "make:config",
    Alias: "m:cnf",
    Options: "-f --force",
    Description:
      "Create a new config class registered with @AppConfig. Use -f or --force to overwrite an existing config.",
  },
  {
    Command: "make:middleware",
    Alias: "m:mlwr",
    Options: "-f --force",
    Description:
      "Create a new middleware extending AvleonMiddleware. Use -f or --force to overwrite an existing middleware.",
  },
];
