
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
import {
  Builder,
  env
} from "@avleon/core";


// create builder
const builder = Builder.createAppBuilder();

// registering all services and dependencies here
// builder.addDataSource({
//   type: "better-sqlite3",
//   database: path.join(process.cwd(), "mydb.db"),
//   entities: [Category, Product],
//   synchronize: true,
// });

// build app
const app = builder.build();

app.useSwagger({
  info: {
    title: "${fname}",
    description: "Your description here",
    version: "0.0.1",
  },
  servers: [
    {
      url: "http://localhost:"+env.PORT,
      description: "Development",
    }
 ]

});


app.mapGet('/', ()=> "Welcome");

app.listen(env.PORT);

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
}`, { parser: 'json' })
  await fs.writeFile(path.join(appPaths.root, 'tsconfig.json'), tsconfigJson);
  await fs.writeFile(path.join(appPaths.root, '.gitignore'), `node_modules/\ndist/\n.env`);
  // create basic service
  // create basic controller


  console.info("Running pnpm install");

  console.log(`cd ${fname}&& pnpm install`);

  //execSync(`cd ${fname}&& pnpm install && pnpm add @avleon/core`, { stdio: 'inherit' })

  console.info("App create successfully.");


}



export { createApplication }
