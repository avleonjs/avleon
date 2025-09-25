import fs from "fs-extra";
import { appPathsMinimal, appPaths as getAppPaths } from "./paths";
import * as prettier from "prettier";
import path from "path";
import os from 'os';
import inquirer from 'inquirer';
import { exec, spawn } from 'child_process';
import util from 'util';
import { capitalize, snakeCase } from "lodash";

const execAsync = util.promisify(exec);
const getShell = () => {
  if (os.platform() === 'win32') {
    return process.env.ComSpec || 'cmd.exe'; // Windows fallback
  }
  return process.env.SHELL || '/bin/sh'; // macOS/Linux fallback
};
async function askForPackageManager(): Promise<'npm' | 'yarn' | 'pnpm'> {
  const { packageManager } = await inquirer.prompt([
    {
      type: 'list',
      name: 'packageManager',
      message: 'Which package manager do you want to use?',
      choices: ['npm', 'yarn', 'pnpm'],
      default: 'npm'
    }
  ]);

  return packageManager;
}

async function installDependencies(pm: string, fname: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(pm, ['install'], {
      cwd: fname,
      shell: getShell(),
      stdio: 'inherit',
    });

    child.on('exit', (code) => {
      if (code === 0) {
        console.log('✅ Dependencies installed successfully.');
        console.log(`cd ${fname}`);
        console.log(pm == 'npm' ? `npm run start:dev` : `${pm} start:dev`);
        resolve();
      } else {
        console.error(`❌ Installation failed with exit code ${code}`);
        reject(new Error(`Install failed with code ${code}`));
      }
    });

    child.on('error', (err) => {
      console.error('❌ Failed to start install process:', err);
      reject(err);
    });
  });
}
async function createApplication(fname: any, flags: any = {}) {
  let appPaths = getAppPaths(fname);
  const pm = await askForPackageManager();
  // const dirs = Object.values(appPaths);
  // for (let i = 0; i < dirs.length; i++) {
  //   await fs.ensureDir(dirs[i]);
  // }

  await fs.ensureDir(appPaths.root + "/src");
  await fs.ensureDir(appPaths.root + "/src/controllers");
  await fs.ensureDir(appPaths.root + "/src/config");
  await fs.ensureDir(appPaths.root + "/src/services");
  // await fs.ensureDir(appPaths.root + "/src/models");
  await fs.ensureDir(appPaths.root + "/test");
  await fs.ensureDir(appPaths.root + "/public");
  // copy

  // home controller
  const homeService = `
import { AppService } from '@avleon/core';


@AppService
export class HomeService{

  sayHello(){
    return "Hello World!";
  }
}
`;

  const formatHomeService= await prettier.format(homeService, {
    singleQuote: true,
    singleAttributePerLine: true,
    parser: "typescript",
  });

  await fs.writeFile(path.join(appPaths.services, "home.service.ts"), formatHomeService);


  // home controller
  const homeContrlelr = `
import { ApiController, Get } from '@avleon/core';
import { HomeService } from '../services/home.service';


@ApiController
export class HomeController{

  constructor(
    private readonly homeService: HomeService
  ){}

  @Get()
  sayHello(){
    return this.homeService.sayHello();
  }
}
`;

  const formatHomeController = await prettier.format(homeContrlelr, {
    singleQuote: true,
    singleAttributePerLine: true,
    parser: "typescript",
  });

  await fs.writeFile(path.join(appPaths.controllers, "home.controller.ts"), formatHomeController);


  const homeContrlelrTest = `
import { AvleonTest } from "@avleon/core";
import { HomeController } from "./home.controller"

describe('Home Controller', () => {
    let controller!: HomeController;

    beforeAll(()=>{
        controller = AvleonTest.getController(HomeController);
    })

    it('should be defined', () => {
        expect(controller).toBeDefined()
    })

    it('should have sayhello function', () => {
        expect(controller.sayHello).toBeDefined
    })

    it('should return sayhello', () => {
        expect(controller.sayHello()).toBe("Hello World!");
    })
})
`;

  const formatHomeControllerTest = await prettier.format(homeContrlelrTest, {
    singleQuote: true,
    singleAttributePerLine: true,
    parser: "typescript",
  });

  await fs.writeFile(path.join(appPaths.controllers, "home.controller.spec.ts"), formatHomeControllerTest);











// openapi config file
  const openapiConfigFile = `
import { AppConfig, Environment, IConfig } from "@avleon/core";

@AppConfig
export class OpenApiConfig implements IConfig {

    config(env: Environment) {
        return {
            info: {
                title: '${capitalize(fname)}',
                version: '0.0.1',
            },
        }
    }
}
`;

  const formatConfigFile = await prettier.format(openapiConfigFile, {
    singleQuote: true,
    singleAttributePerLine: true,
    parser: "typescript",
  });

  await fs.writeFile(path.join(appPaths.configs, "openapi.config.ts"), formatConfigFile);

  // main file 
  const mainFunc = `
import { Avleon } from '@avleon/core';
import { OpenApiConfig } from './config/openapi.config';
import { HomeController } from './controllers/home.controller';


const app = Avleon.createApplication();

if(app.isDevelopment()){
  app.useOpenApi(OpenApiConfig);
}

app.useControllers([ HomeController ]);
app.useStaticFiles();

export default app;
`;

  const formatMainFunc = await prettier.format(mainFunc, {
    singleQuote: true,
    singleAttributePerLine: true,
    parser: "typescript",
  });

  await fs.writeFile(path.join(appPaths.src, "app.ts"), formatMainFunc);



  // create serve.ts 
  const serveFunc = `
import app from "./app";

async function start(){
  app.run(); // default run on :4000
}

start();
`;

  const formatServeFunc = await prettier.format(serveFunc, {
    singleQuote: true,
    singleAttributePerLine: true,
    parser: "typescript",
  });

  await fs.writeFile(path.join(appPaths.src, "serve.ts"), formatServeFunc);

  // create package.json
  const packageJson = `
{
  "name": "${snakeCase(fname)}",
  "version": "0.0.1",
  "description": "Basic avleon application",
  "main": "dist/serve.js",
  "scripts": {
    "start:dev": "nodemon ./src/serve.ts",
    "start:debug": "nodemon --watch ./src --ext ts --exec node --inspect=0.0.0.0:9229 -r ts-node/register ./src/serve.ts",
    "clean": "rimraf ./dist",
    "build": "npm run clean & tsc --project ./tsconfig.build.json",
    "start": "node ./dist/serve.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/e2e-spec.json"
  },
  "keywords": ["avleon","nodejs","typescript"],
  "license": "ISC",
  "dependencies": {
    "@avleon/core": "^0.0.36",
    "@avleon/cli": "^0.0.42",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "rimraf": "^6.0.1",
    "reflect-metadata": "^0.2.2"
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "@types/node": "^24.0.3",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.6",
    "nodemon": "^3.1.7",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.2"
  },
    "jest": {
    "preset": "ts-jest",
    "rootDir": "src",
    "testRegex": ".*.spec.ts$",
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }

}
`;

  const formattedPackageJson = await prettier.format(packageJson, {
    parser: "json",
  });
  await fs.writeFile(
    path.join(appPaths.root, "package.json"),
    formattedPackageJson
  );
  const tsconfigJson = await prettier.format(
    `{
  "compilerOptions": {
    "target": "ES2017",
    "module": "CommonJS",
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "outDir": "./dist",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,
    { parser: "json" }
  );
  await fs.writeFile(path.join(appPaths.root, "tsconfig.json"), tsconfigJson);

  const tsconfigBuildJson = await prettier.format(
    `{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules","coverage", "test", "dist", "**/*spec.ts"]
}
`,
    { parser: "json" }
  );
  await fs.writeFile(path.join(appPaths.root, "tsconfig.build.json"), tsconfigBuildJson);


  // write e2e-test.json
  const e2eJson = await prettier.format(
    `{
  "moduleFileExtensions": [
    "js",
    "json",
    "ts"
  ],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+/\/\.(t|j)s$": "ts-jest"
  }
}`,
    { parser: "json" }
  );
  await fs.writeFile(path.join(appPaths.root, "test/e2e-spec.json"), e2eJson);


  await fs.writeFile(
    path.join(appPaths.root, ".gitignore"),
    `node_modules/\ndist/\n.env`
  );
  try {
    console.log(`Running ${pm} install...`);
    await execAsync(`cd ${fname}`);
    await installDependencies(pm, fname);
  } catch (error) {
    console.error('❌ Installation failed:', error);
  }
  console.info("Enjoy :D");
}

export { createApplication };
