import fs from 'fs-extra';
import { appPaths as getAppPaths } from './paths';
import * as prettier from 'prettier';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';
import { spawn } from 'child_process';
import { capitalize, kebabCase } from 'lodash';

// ─── Colors ───────────────────────────────────────────────────────────────────

const C = {
    reset:   '\x1b[0m',
    dim:     '\x1b[90m',
    bold:    '\x1b[1m',
    cyan:    '\x1b[36m',
    green:   '\x1b[32m',
    yellow:  '\x1b[33m',
    red:     '\x1b[31m',
    white:   '\x1b[37m',
};

const icon = {
    success: `${C.green}✔${C.reset}`,
    error:   `${C.red}✖${C.reset}`,
    warn:    `${C.yellow}⚠${C.reset}`,
    arrow:   `${C.dim}→${C.reset}`,
};

function step(label: string, detail?: string) {
    const pad = label.padEnd(30, ' ');
    console.log(`  ${icon.arrow} ${C.white}${pad}${C.reset}${detail ? C.dim + detail + C.reset : ''}`);
}

function success(msg: string) {
    console.log(`  ${icon.success} ${C.green}${msg}${C.reset}`);
}

function fail(msg: string) {
    console.log(`  ${icon.error} ${C.red}${msg}${C.reset}`);
}

function section(title: string) {
    console.log(`\n${C.bold}${C.cyan}  ${title}${C.reset}`);
    console.log(`  ${'─'.repeat(40)}`);
}

// ─── Version resolver ─────────────────────────────────────────────────────────

function resolveDepVersion(pkgName: string, fallback = 'latest'): string {
    try {
        const pkgJsonPath = require.resolve(`${pkgName}/package.json`);
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        return `^${pkg.version}`;
    } catch {
        return fallback;
    }
}

function getAvleonVersions(): { core: string; cli: string } {
    try {
        // Read CLI's own package.json (this file lives inside @avleon/cli)
        const cliPkgPath = path.resolve(__dirname, '../../package.json');
        const cliPkg = JSON.parse(fs.readFileSync(cliPkgPath, 'utf8'));

        // Core version — resolve from installed node_modules
        const corePkgPath = require.resolve('@avleon/core/package.json');
        const corePkg = JSON.parse(fs.readFileSync(corePkgPath, 'utf8'));

        return {
            core: `^${corePkg.version}`,
            cli:  `^${cliPkg.version}`,
        };
    } catch {
        return { core: 'latest', cli: 'latest' };
    }
}

// ─── Banner ───────────────────────────────────────────────────────────────────

function banner(fname: string) {
    const { core } = getAvleonVersions();
    console.clear();
    console.log();
    console.log(`${C.bold}${C.cyan}  ╔═══════════════════════════════════════╗${C.reset}`);
    console.log(`${C.bold}${C.cyan}  ║         AVLEON APPLICATION CLI        ║${C.reset}`);
    console.log(`${C.bold}${C.cyan}  ╚═══════════════════════════════════════╝${C.reset}`);
    console.log();
    console.log(`  ${C.dim}Creating project :${C.reset} ${C.bold}${C.white}${fname}${C.reset}`);
    console.log(`  ${C.dim}Avleon version   :${C.reset} ${C.bold}${C.cyan}${core}${C.reset}`);
    console.log();
}

// ─── Shell ────────────────────────────────────────────────────────────────────

const getShell = () =>
    os.platform() === 'win32'
        ? process.env.ComSpec || 'cmd.exe'
        : process.env.SHELL || '/bin/sh';

// ─── Prompts ──────────────────────────────────────────────────────────────────

async function askForPackageManager(): Promise<'npm' | 'yarn' | 'pnpm'> {
    const { packageManager } = await inquirer.prompt([
        {
            type: 'list',
            name: 'packageManager',
            message: 'Package manager:',
            choices: [
                { name: 'npm',               value: 'npm'  },
                { name: 'yarn',              value: 'yarn' },
                { name: 'pnpm (recommended)', value: 'pnpm' },
            ],
            default: 'npm',
        },
    ]);
    return packageManager;
}

async function askForFeatures(): Promise<string[]> {
    const { features } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'features',
            message: 'Select features to include:',
            choices: [
                { name: 'OpenAPI / Swagger docs',          value: 'openapi', checked: true  },
                { name: 'CORS support',                    value: 'cors',    checked: false },
                { name: 'TypeORM database',                value: 'typeorm', checked: false },
                { name: 'Scalar UI (replaces Swagger UI)', value: 'scalar',  checked: false },
            ],
        },
    ]);
    return features;
}

// ─── Installer ────────────────────────────────────────────────────────────────

async function installDependencies(pm: string, cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn(pm, ['install'], {
            cwd,
            shell: getShell(),
            stdio: 'inherit',
        });
        child.on('exit', (code) => {
            code === 0
                ? resolve()
                : reject(new Error(`Install failed with exit code ${code}`));
        });
        child.on('error', reject);
    });
}

// ─── Format helper ────────────────────────────────────────────────────────────

async function fmt(
    source: string,
    parser: prettier.BuiltInParserName = 'typescript',
) {
    return prettier.format(source, {
        singleQuote: true,
        singleAttributePerLine: true,
        parser,
    });
}

// ─── File writer ──────────────────────────────────────────────────────────────

async function writeFile(filePath: string, content: string, label?: string) {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content);
    if (label) step(label, path.relative(process.cwd(), filePath));
}

// ─── Templates ────────────────────────────────────────────────────────────────

function homeServiceTemplate() {
    return `
import { AppService } from '@avleon/core';

@AppService
export class HomeService {
    sayHello() {
        return { message: 'Hello World!' };
    }
}
`;
}

function homeControllerTemplate() {
    return `
import { ApiController, Get } from '@avleon/core';
import { HomeService } from '../services/home.service';

@ApiController('/')
export class HomeController {
    constructor(private readonly homeService: HomeService) {}

    @Get()
    sayHello() {
        return this.homeService.sayHello();
    }
}
`;
}

function homeControllerTestTemplate() {
    return `
import { AvleonTest } from '@avleon/core';
import { HomeController } from './home.controller';

describe('HomeController', () => {
    let controller!: HomeController;

    beforeAll(() => {
        controller = AvleonTest.getController(HomeController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should have sayHello method', () => {
        expect(typeof controller.sayHello).toBe('function');
    });

    it('should return hello message', () => {
        expect(controller.sayHello()).toEqual({ message: 'Hello World!' });
    });
});
`;
}

function openApiConfigTemplate(fname: string, useScalar: boolean) {
    return `
import { AppConfig, Environment, IConfig } from '@avleon/core';

@AppConfig
export class OpenApiConfig implements IConfig {
    config(env: Environment) {
        return {
            info: {
                title: '${capitalize(fname)} API',
                version: '0.0.1',
                description: 'API documentation for ${capitalize(fname)}',
            },
            ${useScalar ? "provider: 'scalar'," : ''}
            routePrefix: '/docs',
        };
    }
}
`;
}

function appTemplate(features: string[]) {
    const hasOpenApi = features.includes('openapi');
    const hasCors    = features.includes('cors');
    const hasTypeorm = features.includes('typeorm');

    const imports: string[] = [`import { Avleon } from '@avleon/core';`];
    imports.push(`import { HomeController } from './controllers/home.controller';`);
    if (hasOpenApi) {
        imports.push(`import { OpenApiConfig } from './config/openapi.config';`);
    }

    const body: string[] = [`const app = Avleon.createApplication();`, ''];

    if (hasCors) {
        body.push(`app.useCors({ origin: '*' });`);
    }
    if (hasOpenApi) {
        body.push(`if (app.isDevelopment()) {`);
        body.push(`    app.useOpenApi(OpenApiConfig);`);
        body.push(`}`);
        body.push('');
    }
    if (hasTypeorm) {
        body.push(`// TODO: configure datasource in src/config/database.config.ts`);
        body.push(`// app.useDatasource(AppDataSource);`);
        body.push('');
    }

    body.push(`app.useControllers([HomeController]);`);
    body.push('');
    body.push(`export default app;`);

    return `${imports.join('\n')}\n\n${body.join('\n')}\n`;
}

function serveTemplate() {
    return `
import app from './app';

async function start() {
    await app.run(); // default port: 4000
}

start();
`;
}

function packageJsonTemplate(fname: string, features: string[]) {
    // ✅ Always resolve current installed versions at generation time
    const { core, cli } = getAvleonVersions();

    const deps: Record<string, string> = {
        '@avleon/core':       core,
        '@avleon/cli':        cli,
        'class-transformer':  resolveDepVersion('class-transformer',  '^0.5.1'),
        'class-validator':    resolveDepVersion('class-validator',    '^0.14.1'),
        'rimraf':             resolveDepVersion('rimraf',             '^6.0.1'),
        'reflect-metadata':   resolveDepVersion('reflect-metadata',   '^0.2.2'),
    };

    if (features.includes('cors')) {
        deps['@fastify/cors'] = resolveDepVersion('@fastify/cors', '^10.0.0');
    }
    if (features.includes('typeorm')) {
        deps['typeorm'] = resolveDepVersion('typeorm', '^0.3.20');
        deps['pg']      = resolveDepVersion('pg',      '^8.11.0');
    }
    if (features.includes('scalar')) {
        deps['@scalar/fastify-api-reference'] = resolveDepVersion(
            '@scalar/fastify-api-reference',
            '^1.0.0',
        );
    }

    const devDeps: Record<string, string> = {
        '@types/jest': resolveDepVersion('@types/jest', '^29.5.14'),
        '@types/node': resolveDepVersion('@types/node', '^24.0.3'),
        'jest':        resolveDepVersion('jest',        '^29.7.0'),
        'ts-jest':     resolveDepVersion('ts-jest',     '^29.2.6'),
        'typescript':  resolveDepVersion('typescript',  '^5.7.2'),
    };

    return JSON.stringify(
        {
            name:        kebabCase(fname),
            version:     '0.0.1',
            description: `${capitalize(fname)} API built with Avleon`,
            main:        'dist/serve.js',
            scripts: {
                'start:dev':  'avleon serve',
                'clean':      'rimraf ./dist',
                'build':      'npm run clean && tsc --project ./tsconfig.build.json',
                'start':      'node ./dist/serve.js',
                'test':       'jest',
                'test:watch': 'jest --watch',
                'test:cov':   'jest --coverage',
                'test:e2e':   'jest --config ./test/e2e-spec.json',
            },
            keywords:     ['avleon', 'nodejs', 'typescript'],
            license:      'ISC',
            dependencies: deps,
            devDependencies: devDeps,
            jest: {
                preset:               'ts-jest',
                rootDir:              'src',
                testRegex:            '.*.spec.ts$',
                collectCoverageFrom:  ['**/*.(t|j)s'],
                coverageDirectory:    '../coverage',
                testEnvironment:      'node',
            },
        },
        null,
        2,
    );
}

function tsconfigTemplate() {
    return JSON.stringify(
        {
            compilerOptions: {
                target:                           'ES2017',
                module:                           'CommonJS',
                moduleResolution:                 'node',
                experimentalDecorators:           true,
                emitDecoratorMetadata:            true,
                outDir:                           './dist',
                esModuleInterop:                  true,
                allowSyntheticDefaultImports:     true,
                forceConsistentCasingInFileNames: true,
                skipLibCheck:                     true,
                strict:                           false,
            },
            include: ['src/**/*'],
            exclude: ['node_modules', 'dist'],
        },
        null,
        2,
    );
}

function tsconfigBuildTemplate() {
    return JSON.stringify(
        {
            extends: './tsconfig.json',
            exclude: ['node_modules', 'coverage', 'test', 'dist', '**/*spec.ts'],
        },
        null,
        2,
    );
}

function e2eConfigTemplate() {
    return JSON.stringify(
        {
            moduleFileExtensions: ['js', 'json', 'ts'],
            rootDir:              '.',
            testEnvironment:      'node',
            testRegex:            '.e2e-spec.ts$',
            transform:            { '^.+\\.(t|j)s$': 'ts-jest' },
        },
        null,
        2,
    );
}

function gitignoreTemplate() {
    return `node_modules/\ndist/\n.env\n.env.local\ncoverage/\n`;
}

function envTemplate() {
    return `NODE_ENV=development\nPORT=4000\n`;
}

function readmeTemplate(fname: string, pm: string) {
    const runCmd = pm === 'npm' ? 'npm run start:dev' : `${pm} start:dev`;
    return `# ${capitalize(fname)}

Built with [Avleon](https://github.com/xtareq/avleon).

## Getting Started

\`\`\`bash
${runCmd}
\`\`\`

## Scripts

| Script | Description |
|--------|-------------|
| \`start:dev\` | Start development server with hot reload |
| \`build\`     | Compile TypeScript to JavaScript |
| \`start\`     | Start production server |
| \`test\`      | Run unit tests |

## Project Structure

\`\`\`
src/
├── controllers/   # Route controllers
├── services/      # Business logic
├── config/        # App configuration
├── app.ts         # App setup
└── serve.ts       # Entry point
\`\`\`
`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function createApplication(fname: string, flags: any = {}) {
    const appPaths = getAppPaths(fname);

    banner(fname);

    // ── Prompts ───────────────────────────────────────────────────────────────
    const pm        = await askForPackageManager();
    const features  = await askForFeatures();
    const useScalar = features.includes('scalar');

    // ── Directories ───────────────────────────────────────────────────────────
    section('Scaffolding project structure');

    const dirs = [
        appPaths.root + '/src',
        appPaths.root + '/src/controllers',
        appPaths.root + '/src/config',
        appPaths.root + '/src/services',
        appPaths.root + '/test',
        appPaths.root + '/public',
    ];

    for (const dir of dirs) {
        await fs.ensureDir(dir);
        step('Created directory', path.relative(process.cwd(), dir));
    }

    // ── Source files ──────────────────────────────────────────────────────────
    section('Generating source files');

    await writeFile(
        path.join(appPaths.services, 'home.service.ts'),
        await fmt(homeServiceTemplate()),
        'HomeService',
    );
    await writeFile(
        path.join(appPaths.controllers, 'home.controller.ts'),
        await fmt(homeControllerTemplate()),
        'HomeController',
    );
    await writeFile(
        path.join(appPaths.controllers, 'home.controller.spec.ts'),
        await fmt(homeControllerTestTemplate()),
        'HomeController spec',
    );
    if (features.includes('openapi')) {
        await writeFile(
            path.join(appPaths.configs, 'openapi.config.ts'),
            await fmt(openApiConfigTemplate(fname, useScalar)),
            'OpenApiConfig',
        );
    }
    await writeFile(
        path.join(appPaths.src, 'app.ts'),
        await fmt(appTemplate(features)),
        'app.ts',
    );
    await writeFile(
        path.join(appPaths.src, 'serve.ts'),
        await fmt(serveTemplate()),
        'serve.ts',
    );

    // ── Config files ──────────────────────────────────────────────────────────
    section('Generating config files');

    await writeFile(
        path.join(appPaths.root, 'package.json'),
        await fmt(packageJsonTemplate(fname, features), 'json'),
        'package.json',
    );
    await writeFile(
        path.join(appPaths.root, 'tsconfig.json'),
        await fmt(tsconfigTemplate(), 'json'),
        'tsconfig.json',
    );
    await writeFile(
        path.join(appPaths.root, 'tsconfig.build.json'),
        await fmt(tsconfigBuildTemplate(), 'json'),
        'tsconfig.build.json',
    );
    await writeFile(
        path.join(appPaths.root, 'test/e2e-spec.json'),
        await fmt(e2eConfigTemplate(), 'json'),
        'e2e-spec.json',
    );
    await writeFile(path.join(appPaths.root, '.gitignore'), gitignoreTemplate(), '.gitignore');
    await writeFile(path.join(appPaths.root, '.env'),       envTemplate(),       '.env');
    await writeFile(path.join(appPaths.root, 'README.md'),  readmeTemplate(fname, pm), 'README.md');

    // ── Install ───────────────────────────────────────────────────────────────
    section('Installing dependencies');

    try {
        await installDependencies(pm, appPaths.root);
        success('Dependencies installed');
    } catch (error) {
        fail(`Installation failed: ${error instanceof Error ? error.message : error}`);
        console.log(`\n  ${C.yellow}Install manually:${C.reset}`);
        console.log(`  ${C.dim}cd ${fname} && ${pm} install${C.reset}\n`);
    }

    // ── Done ──────────────────────────────────────────────────────────────────
    const runCmd = pm === 'npm' ? 'npm run start:dev' : `${pm} start:dev`;

    console.log();
    console.log(`${C.bold}${C.green}  ✔ Project created successfully!${C.reset}`);
    console.log();
    console.log(`  ${C.dim}Next steps:${C.reset}`);
    console.log(`  ${C.cyan}  cd ${fname}${C.reset}`);
    console.log(`  ${C.cyan}  ${runCmd}${C.reset}`);
    if (features.includes('openapi')) {
        console.log();
        console.log(`  ${C.dim}API docs:${C.reset} ${C.white}http://localhost:4000/docs${C.reset}`);
    }
    console.log();
}

export { createApplication };