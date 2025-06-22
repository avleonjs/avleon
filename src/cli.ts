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

  const basicModel = `
      \t
  export class ${modelName}{
  id:number;
  name: string;
}
  `

  const ormModel = `
import {Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
\t
  @Entity({name:'${modelName}'})
  export class ${modelName}{

  @PrimaryGeneratedColumn()
  id:number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
`;

  const formatModel = await prettier.format(options.orm ? ormModel : basicModel, {
    singleQuote: true,
    singleAttributePerLine: true,
    parser: "typescript",
  });

  await fs.writeFile(
    path.join(process.cwd(), "./src/models/" + modelName.toLowerCase() + ".ts"),
    formatModel,
  );

  console.log("Model created succssessfully!");
}

async function createMiddleware(name: string, options = { force: false }) {
  if (!name) {
    throw new Error(
      "Model name not found . use --name or node artisan make:model ModelName",
    );
  }
  const modelName = name.at(0).toUpperCase() + name.slice(1);
  const modelExists = existsSync(
    path.join(process.cwd(), `./src/middlewares/${modelName.toLowerCase()}.middleware.ts`),
  );

  if (modelExists && !options.force) {
    console.log("Middleware already exists!", "Use -f or --force to overwrite.\r");
    return;
  }

  const modelFolderExists = existsSync(
    path.join(process.cwd(), "./src/middlewares"),
  );
  if (!modelFolderExists) {
    await fs.mkdir(path.join(process.cwd(), "./src/middleware"), {
      recursive: true,
    });
  }

  const basicMiddleware = `
      \t
import { Middleware, IMiddleware } from '@avleon/core';

@Middleware
export class ${modelName}Middleware implements IMiddleware{

    invoke(req:IRequest){
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

  await fs.writeFile(
    path.join(process.cwd(), "./src/middlewares/" + modelName.toLowerCase() + ".ts"),
    formatModel,
  );

  console.log("Middleware created succssessfully!");
}


async function createConfig(name: string, options = { force: false }) {
  if (!name) {
    throw new Error(
      "Config name not found . use --name or node artisan make:config JwtConfig",
    );
  }
  const modelName = name.at(0).toUpperCase() + name.slice(1);
  const modelClassName = capitalize(modelName).endsWith('Config')? capitalize(modelName) :capitalize(modelName)+"Config"
  const modelExists = existsSync(
    path.join(process.cwd(), `./src/config/${modelName.toLowerCase()}.ts`),
  );

  if (modelExists && !options.force) {
    console.log("Config already exists!", "Use -f or --force to overwrite.\r");
    return;
  }

  const modelFolderExists = existsSync(
    path.join(process.cwd(), "./src/config"),
  );
  if (!modelFolderExists) {
    await fs.mkdir(path.join(process.cwd(), "./src/config"), {
      recursive: true,
    });
  }

  const basicMiddleware = `
      \t
import { Config, IConfig } from '@avleon/core';

@AppConfig
export class ${modelClassName} implements IConfig<T>{

    config(env: Environment){
      // config must return config
      return {
      
      };
    }
 
}
  `

  const formatModel = await prettier.format(basicMiddleware, {
    singleQuote: true,
    singleAttributePerLine: true,
    parser: "typescript",
  });

  await fs.writeFile(
    path.join(process.cwd(), "./src/config/" + modelName.toLowerCase() + ".ts"),
    formatModel,
  );

  console.log("Config created succssessfully!");
}



export async function run() {
  try {
    const args = process.argv.slice(2);
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
        if (args.some((x) => x == "--mimimal")) {
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
          //const appPath =
          execSync("rm -r ./dist");
          execSync("npx tsc --project tsconfig.build.json");
          console.log("Build successfully");
        }
        if (args[0] == "make:model") {
          const orm = args.some((x) => x == "--orm")
          await createModel(args[1], { force, orm });
        }

        if (args[0] == "make:config" || args[0] == "m:cfg") {
          await createConfig(args[1], { force });
        }

        if (args[0] == "make:middleware" || args[0] == "m:mdlr") {
          await createMiddleware(args[1], { force });
        }

        if (args[0] == "make:controller" || args[0] == "m:c") {
          let resource = false;
          let rest = false;
          let prefix = true;
          let root = null;
          if (args.some((x) => x == "-r" || x == "--resource")) {
            resource = true;
          }
          if (args.some((x) => x == "-r" || x == "--rest")) {
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
          await createController(args[1], { force, resource, prefix, rest, model, root });
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
          await createService(args[1], { force, resource, prefix, rest, model, root });
        }
      }
    }
  } catch (error) {
    console.log("CLI ERROR:", error);
  }
}
run();
