#!/usr/bin/env node
import Table from "cli-table3";
import path from "path";
import fs from "fs/promises";
import fsExtra from "fs-extra";
import { existsSync } from "fs";
import * as prettier from "prettier";
import { createController } from "./controller";
import { commandList } from "./commands";
import { exec, execSync } from "child_process";
import { createApplication } from "./create";
import { createService } from "./service";
import { pathHelper } from "./helpers/path-helper";
import { capitalize } from "lodash";

export function iqraCli() { }

const listedCommands = commandList
  .flatMap((x) => x.Command)
  .concat(commandList.flatMap((x) => x.Alias.split(",")))
  .flatMap((a) => a.trim())
  .concat("build");

/**
 * @description Displaying basic info
 * @since v0.0.2
 * */
async function printLogo() {
  try {
    const packageInfo = await fs.readFile(
      path.join(__dirname, "../package.json"),
      "utf8",
    );
    const parsedPackInfo = JSON.parse(packageInfo);
    console.log(`Name: Avleon CLI`, "\r");
    console.log(`Version: ${parsedPackInfo.version}`, "\r");
  } catch (error) {
    throw new Error("Can't read packag info");
  }
}

async function displayCommandList(info = { logo: true, all: false }) {
  if (info.logo) {
    await printLogo();
  }
  console.log("Available commandList:");

  if (info.all) {
    const table = new Table({
      head: ["Command", "Alias", "Available Options", "Description"],
      colWidths: [20, 10, 30, 50],
      wrapOnWordBoundary: true,
      wordWrap: true,
    });
    commandList.forEach((c) => {
      table.push([c.Command, c.Alias, c.Options, c.Description]);
    });
    console.log(table.toString());
  } else {
    const table = new Table({
      head: ["Command", "Alias", "Available Options"],
      colWidths: [20, 10, 50],
      wrapOnWordBoundary: true,
      wordWrap: true,
    });
    commandList.forEach((c) => {
      table.push([c.Command, c.Alias, c.Options]);
    });
    console.log(table.toString());
  }
}

async function createModel(name: string, options = { force: false, orm: false }) {
  if (!name) {
    throw new Error(
      "Model name not found . use --name or node artisan make:model ModelName",
    );
  }

  const modelFolderExists = existsSync(
    path.join(process.cwd(), "./src/models"),
  );
  if (!modelFolderExists) {
    await fs.mkdir(path.join(process.cwd(), "./src/models"), {
      recursive: true,
    });
  }

  const modelName = name.at(0).toUpperCase() + name.slice(1);
  const modelExists = existsSync(
    path.join(process.cwd(), `./src/models/${modelName.toLowerCase()}.ts`),
  );

  if (modelExists && !options.force) {
    console.log("Model already exists!", "Use -f or --force to overwrite.\r");
    return;
  }

  const stubPath = pathHelper.stubPath(
    options.orm ? "models/entity-model.stub" : "models/basic-model.stub",
  );
  const stub = await fs.readFile(stubPath, "utf8");
  const model = stub
    .replaceAll("{Model}", modelName)
    .replaceAll("{model}", modelName.toLowerCase());

  const formatModel = await prettier.format(model, {
    singleQuote: true,
    singleAttributePerLine: true,
    parser: "typescript",
  });

  await fs.writeFile(
    path.join(process.cwd(), "./src/models/" + modelName.toLowerCase() + ".ts"),
    formatModel,
  );

  console.log("Model created successfully!");
}

async function createMiddleware(name: string, options = { force: false }) {
  if (!name) {
    throw new Error(
      "Middleware name not found. Use npx avleon make:middleware MiddlewareName",
    );
  }

  const baseName = name.replace(/middleware$/i, "");
  const className = baseName.at(0).toUpperCase() + baseName.slice(1) + "Middleware";
  const fileName = `${baseName.toLowerCase()}.middleware.ts`;
  const middlewareDir = path.join(process.cwd(), "./src/middlewares");
  const filePath = path.join(middlewareDir, fileName);

  if (existsSync(filePath) && !options.force) {
    console.log("Middleware already exists!", "Use -f or --force to overwrite.\r");
    return;
  }

  if (!existsSync(middlewareDir)) {
    await fs.mkdir(middlewareDir, { recursive: true });
  }

  const basicMiddleware = `
import { AppMiddleware, AvleonMiddleware, IRequest, IResponse } from '@avleon/core';

@AppMiddleware
export class ${className} extends AvleonMiddleware {
  async invoke(req: IRequest, res?: IResponse) {
    // your logic goes here
    return req;
  }
}
  `

  const formatModel = await prettier.format(basicMiddleware, {
    singleQuote: true,
    singleAttributePerLine: true,
    parser: "typescript",
  });

  await fs.writeFile(filePath, formatModel);

  console.log("Middleware created successfully!");
}


async function createConfig(name: string, options = { force: false }) {
  if (!name) {
    throw new Error(
      "Config name not found . use --name or node artisan make:config JwtConfig",
    );
  }
  const baseName = name.replace(/config$/i, "");
  const modelClassName = capitalize(baseName) + "Config";
  const fileName = `${baseName.toLowerCase()}.config.ts`;
  const configDir = path.join(process.cwd(), "./src/config");
  const filePath = path.join(configDir, fileName);

  if (existsSync(filePath) && !options.force) {
    console.log("Config already exists!", "Use -f or --force to overwrite.\r");
    return;
  }

  if (!existsSync(configDir)) {
    await fs.mkdir(configDir, { recursive: true });
  }

  const basicMiddleware = `
import { AppConfig, AvleonConfig, Environment } from '@avleon/core';

@AppConfig
export class ${modelClassName} extends AvleonConfig {
  config(env: Environment) {
    // config must return the configuration object
    return {};
  }
}
  `

  const formatModel = await prettier.format(basicMiddleware, {
    singleQuote: true,
    singleAttributePerLine: true,
    parser: "typescript",
  });

  await fs.writeFile(filePath, formatModel);

  console.log("Config created successfully!");
}



export async function run() {
  try {
    const args = process.argv.slice(2);

    if (args[0] == "serve") {
      require('./serve')

      return;
    }

    if (args.length < 1) {
      await displayCommandList({ logo: true, all: false });
    } else {
      const cmdList = commandList
        .flatMap((x) => x.Command)
        .concat(
          ...commandList.flatMap((f) =>
            f.Alias.split(",").map((s) => s.trim()),
          ),
        );
      if (!listedCommands.includes(args[0].trim())) {
        console.error("Invalid command");
        await displayCommandList({ logo: false, all: false });
      } else {
        let force = false;
        let minimal = false;
        if (args.some((x) => x == "-f" || x == "--force")) {
          force = true;
        }
        if (args.some((x) => x == "--minimal" || x == "-m")) {
          minimal = true;
        }
        const flags = { minimal, force };
        if (args[0] == "new") {
          if (args[1] == undefined) {
            throw new Error('Please provide a project name. Ex avleon new example_api')
          }
          const fname = args[1];
          await createApplication(fname, flags);
        }
        if (args[0] == "build") {
          process.env.NODE_ENV = "production";
          await fsExtra.remove(path.join(process.cwd(), "dist"));
          execSync("npx tsc --project tsconfig.build.json", { stdio: "inherit" });
          console.log("Build successfully");
        }
        if (args[0] == "make:model" || args[0] == "m:m") {
          const orm = args.some((x) => x == "--orm")
          await createModel(args[1], { force, orm });
        }

        if (args[0] == "make:config" || args[0] == "m:cnf" || args[0] == "m:cfg") {
          await createConfig(args[1], { force });
        }

        if (args[0] == "make:middleware" || args[0] == "m:mlwr" || args[0] == "m:mdlr") {
          await createMiddleware(args[1], { force });
        }

        if (args[0] == "make:controller" || args[0] == "m:c") {
          let resource = false;
          let rest = false;
          let prefix = true;
          let root = null;
          if (args.some((x) => x == "-r" || x == "--resource" || x == "--rest")) {
            resource = true;
            rest = true;
          }
          if (args.some((x) => x == "--base-path")) {
            prefix = false;
          }

          let model = null;
          if (args.some((x) => x == "-m" || x == "--model")) {
            const index = args.includes("-m")
              ? args.indexOf("-m")
              : args.indexOf("--model");
            if (args[index + 1] == undefined) {
              throw new Error("Model not defined");
            }
            const modelName = args[index + 1];
            model = modelName;
          }

          if (args.some((x) => x == "-rt" || x == "--root")) {
            const index = args.includes("-rt")
              ? args.indexOf("-rt")
              : args.indexOf("--root");
            if (args[index + 1] == undefined) {
              throw new Error("Root Path not defined");
            }
            const rootPath = args[index + 1];
            root = rootPath;
          }
          const orm = args.some((x) => x == "--orm");
          await createController(args[1], { force, resource, prefix, rest, model, root, orm });
        }

        if (args[0] == "make:service" || args[0] == "m:s") {
          let resource = false;
          let rest = false;
          let prefix = true;
          let root = null;
          if (args.some((x) => x == "-r" || x == "--resource" || x == '--rest')) {
            resource = true;
            rest = true;
          }
          let model = null;
          if (args.some((x) => x == "-m" || x == "--model")) {
            const index = args.includes("-m")
              ? args.indexOf("-m")
              : args.indexOf("--model");
            if (args[index + 1] == undefined) {
              throw new Error("Model not defined");
            }
            const modelName = args[index + 1];
            model = modelName;
          }

          if (args.some((x) => x == "-rt" || x == "--root")) {
            const index = args.includes("-rt")
              ? args.indexOf("-rt")
              : args.indexOf("--root");
            if (args[index + 1] == undefined) {
              throw new Error("Root Path not defined");
            }
            const rootPath = args[index + 1];
            root = rootPath;
          }
          const orm = args.some((x) => x == "--orm");
          await createService(args[1], { force, resource, prefix, rest, model, root, orm });
        }
      }
    }
  } catch (error) {
    console.log("CLI ERROR:", error);
  }
}
run();
