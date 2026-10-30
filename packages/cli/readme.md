### ⚠️ WARNING: NOT FOR PRODUCTION USE

> **🚧 This project is in active development.**
>
> It is **not stable** and **not ready** for live environments.  
> Use **only for testing, experimentation, or internal evaluation**.
>
> #### ❗ Risks of using this in production:
>
> - 🔄 Breaking changes may be introduced at any time
> - 🧪 Features are experimental and may be unstable
> - 🔐 Security has not been audited
> - 💥 Potential for data loss or critical errors
>
> **Please do not deploy this in production environments.**

# Avleon CLI

Scaffold and run [Avleon](https://github.com/avleonjs/avleon-core) applications.

## Create an Application

```sh
npx @avleon/cli new my_api
```

You are prompted for a package manager and for optional features (OpenAPI,
CORS, TypeORM, Knex, Scalar UI). The generated project uses `@avleon/core`'s
`Avleon.createApplication()` and is ready to run:

```sh
cd my_api
npm run start:dev
```

## Commands

| Command | Alias | Options | Description |
|---------|-------|---------|-------------|
| `new <name>` | | `-m`, `-f`, `-y`, `--pm <npm\|yarn\|pnpm>`, `--features <list>`, `--skip-install` | Create a new application |
| `serve` | | `--entry <file>`, `--no-type-check`, `--debounce <ms>` | Dev server: SWC compile, run, reload on change |
| `build` | | `-p <tsconfig>` | Compile with `tsconfig.build.json` and copy assets |
| `start` | | `--entry <file>` | Run the compiled app with `NODE_ENV=production` |
| `doctor` | | | Check Node.js, `@avleon/core`, `reflect-metadata` and decorator settings |
| `route:list` | `routes` | `--json`, `--static` | List the app's routes |
| `make:model` | `m:m` | `-f`, `--orm`, `--root <dir>` | Create a model / TypeORM entity |
| `make:controller` | `m:c` | `-f`, `-r`, `-m <model>`, `--orm`, `--root <dir>`, `--base-path` | Create a controller |
| `make:service` | `m:s` | `-f`, `-r`, `-m <model>`, `--orm`, `--root <dir>` | Create a service |
| `make:config` | `m:cnf` | `-f`, `--root <dir>` | Create an `@AppConfig` class |
| `make:middleware` | `m:mlwr` | `-f`, `--root <dir>` | Create a middleware |
| `make:dto` | `m:dto` | `-f`, `--root <dir>` | Create a class-validator DTO |

`-f` / `--force` overwrites an existing file. `-r` / `--resource` generates a
full REST skeleton. `--root <dir>` (also `-rt`) writes under `src/<dir>`
instead of the default folder. Names may be nested, e.g. `admin/User`.
Run `avleon <command> --help` for details.

Generated controllers must be registered in your app with
`app.useControllers([...])`.

### Controller

```sh
npx avleon make:controller product
# shorthand
npx avleon m:c product

# REST controller — also generates the matching service
npx avleon m:c product -m product -r

# REST controller backed by a TypeORM repository
npx avleon m:c product -m product -r --orm
```

With `-m`, the generated controller delegates to `src/services/<model>.service.ts`,
which is created alongside it.

### Model / Entity

```sh
# plain class
npx avleon make:model product

# TypeORM entity
npx avleon m:m product --orm
```

### Service

```sh
# basic service
npx avleon make:service product

# resource service backed by an in-memory Collection
npx avleon make:service product -m product -r

# resource service backed by a TypeORM repository
npx avleon make:service product -m product -r --orm
```

### Middleware

```sh
npx avleon make:middleware auth
```

Generates a class extending `AvleonMiddleware` with an `invoke(req, res)` method.

### Config

```sh
npx avleon make:config jwt
```

Generates a class extending `AvleonConfig`, registered via `@AppConfig`.

## Development Server

```sh
npx avleon serve
```

Compiles `src/` with SWC into `dist/`, starts the entry point, and restarts on
change to sources, assets or `.env*` files. The entry file is taken from
`--entry`, `avleon.entry` in `package.json`, `main`, then `dist/serve.js`,
`server.js`, `main.js` or `index.js`.

Type errors are reported by a parallel `tsc --noEmit --watch` (disable with
`--no-type-check`) and never block a reload. Syntax errors stop the app until
they are fixed, so stale code never keeps serving.

## Build and Run

```sh
npx avleon build   # tsc with tsconfig.build.json, then copy non-TS assets
npx avleon start   # node dist/serve.js with NODE_ENV=production
```

## Routes

```sh
npx avleon route:list          # compile and read Avleon's route metadata
npx avleon route:list --static # scan decorators in the source, no dependencies
npx avleon routes --json
```

## Doctor

```sh
npx avleon doctor
```

Checks the Node.js version, that `@avleon/core` matches the CLI's version,
that `reflect-metadata` is installed, and that `experimentalDecorators` and
`emitDecoratorMetadata` are enabled. Exits non-zero if a check fails.
