import { existsSync } from "fs";
import path from "path";
import { pathHelper } from "./helpers/path-helper";
import fs from 'node:fs/promises'
import { fh, resolveNames } from "./helpers/file-helper";
import { kebabCase } from "lodash";

function capitalize(str: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function lower(str: string) {

  return str.toLowerCase();
}
async function createController(
  name: string,
  options = { force: false, resource: false, rest: false, model: null },
  p?: string
) {
  if (!name) {
    throw new Error(
      "Controller name not found. use --name or npx avleon make:controller HomeController",
    );
  }
  let stubPath = pathHelper.stubPath('controllers/basic-controller.stub');
  if (options.rest) {
    stubPath = pathHelper.stubPath('controllers/rest-controller.stub');
    if (options.model) {
      stubPath = pathHelper.stubPath('controllers/orm-rest-controller.stub');
    }
  }

  if (name.split("/").length > 1) {
    if (!existsSync(path.join('src/controllers/', name.split("/").splice(-1, 1).join("/")))) {
      await fs.mkdir(path.join('src/controllers/', name.replace('/' + fh.filenameFromPath(name), '')), { recursive: true })
    }
  }

  const content = await fs.readFile(stubPath, 'utf8')
  const names = resolveNames(fh.filenameFromPath(name), 'Controller');
  const className = names.className.replace("Controller", '');

  console.log('STUB_CON', content);
  if (options.model) {

    await createRestService(className, options.model);
  }


  let replacedContent = content
    .replaceAll('{Controller}', className)
    .replaceAll('{controller}', names.varName)
  if (options.model) {
    replacedContent = replacedContent
      .replaceAll('{Model}', capitalize(options.model))
      .replaceAll('{model}', lower(options.model));
  }


  await fs.writeFile(path.join('src/controllers/', kebabCase(className) + '.controller.ts'), replacedContent, 'utf8');
  console.log("Controller created succssessfully!");
}

async function createRestService(
  name: string,
  model?: string
) {

  let stubPath = pathHelper.stubPath('services/rest-service.stub');
  const content = await fs.readFile(stubPath, 'utf8')
  const names = resolveNames(fh.filenameFromPath(name), 'Controller');
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
export { createController };
