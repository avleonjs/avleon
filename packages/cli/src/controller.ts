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


function exportNamesAndPath(input: string): {
  className: string;
  fileName: string;
  filePath: string;
} {
  const parts = input.split('/');
  const lastPart = parts.pop()!;
  const filePath = parts.length ? parts.join('/') + '/' : '.';

  // Normalize base name by removing trailing "Controller" (case-insensitive)
  const rawName = lastPart.replace(/controller$/i, '');

  // Create className in PascalCase + Controller
  const className = upperFirst(camelCase(rawName));

  // Create fileName in kebab-case + .controller.ts
  const fileName = `${kebabCase(rawName)}.controller.ts`;

  return { className, fileName, filePath };
}


const controllersStubs = {
  basic: pathHelper.stubPath('controllers/basic-controller.stub'),
  rest: pathHelper.stubPath('controllers/rest-controller.stub'),
  ormRest: pathHelper.stubPath('controllers/orm-rest-controller.stub')
}

async function createController(
  name: string,
  options = { force: false, resource: false, prefix: true, rest: false, model: null, root: null, orm: false },
  p?: string
) {
  if (!name) {
    throw new Error(
      "Controller name not found. use --name or npx avleon make:controller HomeController",
    );
  }

  // determine stub for generate
  // A model means the controller can delegate to a generated service; without
  // one there is nothing to call, so emit the unimplemented REST skeleton.
  let stubPath = controllersStubs.basic;
  if (options.rest || options.resource) {
    stubPath = options.model ? controllersStubs.ormRest : controllersStubs.rest;
  }

  // determine root path for create controller file 
  const rootPath = options.root ? 'src/' + options.root + '/' : 'src/controllers/';

  // ensure the output directory exists
  const outDir = path.join(rootPath, getFilePathWithoutName(name));
  if (!existsSync(outDir)) {
    await fs.mkdir(outDir, { recursive: true })
  }

  // read stub content from stub file
  const content = await fs.readFile(stubPath, 'utf8')


  const names = resolveNames(fh.filenameFromPath(name), 'Controller');
  const className = names.className.replace("Controller", '');

  if (options.model) {
    await createRestService(className, options.model, options.orm);
  }

  let replacedContent = content
    .replaceAll('{Controller}', className)
    .replaceAll('{controller}', names.varName)
  if (options.model) {
    replacedContent = replacedContent
      .replaceAll('{Model}', capitalize(options.model))
      .replaceAll('{model}', lower(options.model));
  }

  if (!options.prefix) {
    replacedContent = replacedContent.replace(/@ApiController\s*\(([^)]*)\)/g, '@ApiController');
  }

  await fs.writeFile(path.join(outDir, kebabCase(className) + '.controller.ts'), replacedContent, 'utf8');
  console.log("Controller created successfully!");
}

async function createRestService(
  name: string,
  model?: string,
  orm = false,
) {

  const stubPath = pathHelper.stubPath(
    orm ? 'services/orm-rest-service.stub' : 'services/rest-service.stub',
  );
  const content = await fs.readFile(stubPath, 'utf8')

  // The generated controller imports `{Model}Service` from
  // `../services/{model}.service`, so the file must be named after the model.
  const serviceName = model ? capitalize(model) : name;

  let replacedContent = content
    .replaceAll('{Service}', serviceName);

  if (model) {
    replacedContent = replacedContent
      .replaceAll('{Model}', capitalize(model))
      .replaceAll('{model}', lower(model));
  }

  const serviceDir = path.join('src', 'services');
  if (!existsSync(serviceDir)) {
    await fs.mkdir(serviceDir, { recursive: true });
  }

  await fs.writeFile(path.join(serviceDir, lower(serviceName) + '.service.ts'), replacedContent, 'utf8');
  console.log("Service created successfully!");
}
export { createController };
