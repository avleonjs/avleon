
import fs from 'fs-extra';
import { appPaths as getAppPaths } from './paths';
import * as prettier from 'prettier';
import path from 'path/win32';
import { execSync } from 'child_process';



async function createApplication(fname: any) {

  const appPaths = getAppPaths(fname);
  const dirs = Object.values(appPaths);
  for (let i = 0; i < dirs.length; i++) {
    await fs.ensureDir(dirs[i]);
  }

  await fs.ensureDir(appPaths.root + "/public");
  // copy 
  //
  const mainFunc = `
import 'reflect-metadata';
import { AppBuilder } from '@avleon/core';

async function main() {
  const builder = AppBuilder.createBuilder();
//  builder.useLogger();
  builder.useDatabase();

  const app = await builder.build();
  await app.mapControllers();
  await app.run();

}
main().catch(err=> console.log(err));
`

  const formatMainFunc = await prettier.format(
    mainFunc,
    {
      singleQuote: true,
      singleAttributePerLine: true,
      parser: "typescript",
    },
  );

  await fs.writeFile(path.join(appPaths.src, 'app.ts'), formatMainFunc);

  // create package.json
  const packageJson = `
{
  "name": "${fname}",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \\"Error: no test specified\\" && exit 1",
    "dev": "nodemon src/app.ts",
    "start": "node dist/app.js",
    "build": "rimraf dist && tsc"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "reflect-metadata": "^0.2.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.7",
    "ts-node": "^10.9.2",
    "tsc-watch": "^6.2.1",
    "typescript": "^5.7.2"
  }

}
`

  const formattedPackageJson = await prettier.format(
    packageJson,
    {
      parser: "json",
    },
  );
  await fs.writeFile(path.join(appPaths.root, 'package.json'), formattedPackageJson);
  const tsconfigJson = await prettier.format(`{
  "compilerOptions": {
    "target": "ES2017",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`, { parser: 'json' })
  await fs.writeFile(path.join(appPaths.root, 'tsconfig.json'), tsconfigJson);
  await fs.writeFile(path.join(appPaths.root, '.gitignore'), `node_modules/\ndist/\n.env`);
  // create basic service
  // create basic controller


  console.info("Running pnpm install");
  execSync(`cd ${fname}&& pnpm install && pnpm link @avleon/core && pnpm link @avleon/data`, { stdio: 'inherit' })

  console.info("App create successfully.");


}



export { createApplication }
