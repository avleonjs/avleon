import { existsSync } from "fs";
import path from "path";
import { pathHelper } from "./helpers/path-helper";
import fs from 'node:fs/promises'
import { fh, getFilePathWithoutName, resolveNames } from "./helpers/file-helper";
import { camelCase, kebabCase, upperFirst } from 'lodash';

function capitalize(str: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function lower(str: string) {
  return str.toLowerCase();
}

const servicesStubs = {
  basic: pathHelper.stubPath('services/basic-service.stub'),
  rest: pathHelper.stubPath('services/rest-service.stub'),
  ormRest: pathHelper.stubPath('services/orm-rest-service.stub')
}

async function createService(
  name: string,
  options = { force: false, resource: false, prefix: true, rest: false, model: null, root: null, orm: false },
  p?: string
) {
  if (!name) {
    throw new Error(
      "Service name not found. use --name or npx avleon make:service HomeService",
    );
  }
  if((options.rest || options.resource) && !options.model){
    throw new Error("Model not found. Plese ensure you pass --model or -m to create resouce service");
  }

  // determine stub for generate
  let stubPath = servicesStubs.basic;
  if (options.rest || options.resource) {
    stubPath = options.orm ? servicesStubs.ormRest : servicesStubs.rest;
  }

  const rootPath = options.root ? 'src/' + options.root + '/' : 'src/services/';
  const outDir = path.join(rootPath, getFilePathWithoutName(name));
  if (!existsSync(outDir)) {
    await fs.mkdir(outDir, { recursive: true })
  }
  const content = await fs.readFile(stubPath, 'utf8')
  const names = resolveNames(fh.filenameFromPath(name), 'Service');
  const className = names.className.replace("Service", '');

  let replacedContent = content
    .replaceAll('{Service}', className)
    .replaceAll('{service}', names.varName)
  if (options.model) {
    replacedContent = replacedContent
      .replaceAll('{Model}', capitalize(options.model))
      .replaceAll('{model}', lower(options.model));
  }

  await fs.writeFile(path.join(outDir, kebabCase(className) + '.service.ts'), replacedContent, 'utf8');
  console.log("Service created successfully!");
}

async function createRestService(
  name: string,
  model?: string
) {

  let stubPath = pathHelper.stubPath('services/rest-service.stub');
  const content = await fs.readFile(stubPath, 'utf8')
  let replacedContent = content
    .replaceAll('{Service}', name);

  if (model) {
    replacedContent = replacedContent
      .replaceAll('{Model}', capitalize(model))
      .replaceAll('{model}', lower(model));
  }
  await fs.writeFile(path.join('src/services/', kebabCase(name) + '.service.ts'), replacedContent, 'utf8');
  console.log("Service created succssessfully!");
}
export { createService };
