import fs from "fs-extra";
import { appPathsMinimal, appPaths as getAppPaths } from "./paths";
import * as prettier from "prettier";
import path from "path/win32";
import { execSync } from "child_process";

async function createApplication(fname: any, flags:any={}) {
  let appPaths = getAppPaths(fname);
  const dirs = Object.values(appPaths);
  for (let i = 0; i < dirs.length; i++) {
    await fs.ensureDir(dirs[i]);
  }

  await fs.ensureDir(appPaths.root + "/public");
  // copy
  //
  const mainFunc = `
import {
  Avleon
} from "@avleon/core";
import {HomeController} from './controllers/home.controller';


const app = Avleon.createApplication();
app.useOpenApi({
  info:{
    title: '${fname} Api',
    version: '0.0.1'
  }
});

app.useControllers([HomeController]);
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

async function serve(){
  app.run();
}

serve();
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
  "name": "${fname}",
  "version": "0.0.0",
  "description": "Basic avleon application",
  "main": "index.js",
  "scripts": {
    "start:dev": "nodemon /src/serve.ts",
    "start:debug": "nodemon --watch src --ext ts --exec node --inspect=0.0.0.0:9229 -r ts-node/register src/serve.ts",
    "clean": "rimraf ./dist",
    "build": "npm run clean & tsc --project ./tsconfig.build.json",
    "start": "node dist/serve.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/e2e-spec.json"
  },
  "keywords": ["avleon","nodejs","typescript"],
  "license": "ISC",
  "dependencies": {
    "@avleon/core": "^0.0.25",
    "@avleon/cli": "^0.0.25",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "reflect-metadata": "^0.2.2"
  },
  "devDependencies": {
      "@types/jest": "^29.5.14",
      "jest": "^29.7.0",
      "ts-jest": "^29.2.6",
    "nodemon": "^3.1.7",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.2"
  },
    "jest": {
    "preset": "ts-jest",
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
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
    "^.+\\.(t|j)s$": "ts-jest"
  }
}`,
    { parser: "json" }
  );
  await fs.writeFile(path.join(appPaths.root, "test/e2e-spec.json"), e2eJson);


  await fs.writeFile(
    path.join(appPaths.root, ".gitignore"),
    `node_modules/\ndist/\n.env`
  );
  // create basic service
  // create basic controller
  console.info("App created successfully. Run the following command to get start.");
  console.log(`cd ${fname} && pnpm install`);
  console.log(`npm run start:dev`);

  //execSync(`cd ${fname} && pnpm install && pnpm add @avleon/core`, { stdio: 'inherit' })

  console.info("Enjoy :D");
}

export { createApplication };
