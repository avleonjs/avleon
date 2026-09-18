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
| `new` | | `--minimal`, `-m` | Create a new application |
| `serve` | | | Start the dev server with watch + rebuild |
| `build` | | | Compile with `tsconfig.build.json` |
| `make:model` | `m:m` | `-f`, `--orm` | Create a model / TypeORM entity |
| `make:controller` | `m:c` | `-f`, `-r`, `-m <model>`, `-rt <dir>`, `--orm`, `--base-path` | Create a controller |
| `make:service` | `m:s` | `-f`, `-r`, `-m <model>`, `-rt <dir>`, `--orm` | Create a service |
| `make:config` | `m:cnf` | `-f` | Create a config class |
| `make:middleware` | `m:mlwr` | `-f` | Create a middleware |

`-f` / `--force` overwrites an existing file. `-r` / `--resource` generates a
full REST skeleton.

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
change. The entry file is taken from `avleon.entry` in `package.json`, falling
back to `main`.
