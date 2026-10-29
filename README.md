<p align="center">
  <img src="resources/logo.png" alt="Avleon" width="120" />
</p>

# Avleon

Avleon is a TypeScript-first web framework built on [Fastify](https://fastify.dev). It provides decorator-based controllers, dependency injection, class-validator DTOs, generated OpenAPI docs, and first-party integrations for databases, queues, scheduling, caching, events and WebSockets.

```ts
import { Avleon, ApiController, Get, Param } from "@avleon/core";

@ApiController("/users")
class UserController {
  @Get("/:id")
  find(@Param("id") id: string) {
    return { id };
  }
}

const app = Avleon.createApplication();
app.useControllers([UserController]);
app.run(4000);
```

Documentation: **https://avleonjs.github.io**

## Repository layout

This monorepo holds the source for every Avleon package and the docs site, so a change to the framework, its CLI templates and its documentation can land in one commit.

| Folder           | Package / site                                                | Published from                                                                 |
|------------------|---------------------------------------------------------------|--------------------------------------------------------------------------------|
| `packages/core/` | [`@avleon/core`](https://www.npmjs.com/package/@avleon/core)  | [avleonjs/avleon-core](https://github.com/avleonjs/avleon-core)                |
| `packages/cli/`  | [`@avleon/cli`](https://www.npmjs.com/package/@avleon/cli)    | [avleonjs/avleon-cli](https://github.com/avleonjs/avleon-cli)                  |
| `docs/`          | https://avleonjs.github.io (VitePress)                        | [avleonjs/avleonjs.github.io](https://github.com/avleonjs/avleonjs.github.io)  |
| `resources/`     | Logos and favicons                                            | n/a                                                                            |
| `scripts/`       | `mirror.sh`, which syncs each folder to its standalone repo   | n/a                                                                            |

`1.0-CHECKLIST.md` tracks the work for the 1.0 release; the current roadmap is in [`packages/core/README.md`](packages/core/README.md#roadmap-to-100).

Each package stays independent: its own `package.json`, lockfile, scripts and CI. There are no npm workspaces, so installing one package never changes another's lockfile.

## Getting started

```bash
npm install -g @avleon/cli
avleon new my-api
cd my-api
npm run dev        # or: avleon serve
```

To add Avleon to an existing project:

```bash
npm install @avleon/core reflect-metadata class-validator class-transformer
```

`tsconfig.json` needs `"experimentalDecorators": true` and `"emitDecoratorMetadata": true`.

## Working on Avleon

Requirements: Node.js 20 or newer, npm and git.

```bash
npm run setup       # npm ci in packages/core, packages/cli and docs
npm run build       # build core and cli
npm run typecheck
npm test            # core and cli tests
npm run lint        # core
npm run docs:dev    # docs site at http://localhost:5173
npm run docs:build  # fails on dead links
```

Each package can also be worked on directly, for example `cd packages/core && npm test`.

To try local changes to `core` in a generated app, run `npm run build` in `packages/core/`, then `npm install <path-to>/packages/core` in the app.

## Publishing and deployment

Publishing and deployment run from the standalone repositories, unchanged from before the monorepo. `scripts/mirror.sh` pushes each folder's history to its repository with `git subtree split`, which reproduces the same commits, so every push is a normal fast-forward:

| Target | Command                       | What the standalone repo then does                      |
|--------|-------------------------------|---------------------------------------------------------|
| core   | `npm run mirror -- core`      | Runs CI on `main`                                       |
| core   | `npm run mirror -- --tag core v0.3.0` | Publishes `@avleon/core` to npm (tag must match `package.json`) |
| cli    | `npm run mirror -- cli`       | Bumps the patch version, tags it and publishes `@avleon/cli` to npm. Every mirror with new CLI commits is a release. |
| docs   | `npm run mirror -- docs`      | Deploys https://avleonjs.github.io                      |

`npm run mirror` with no arguments mirrors all three. Mirroring a folder with no new commits is a no-op, so it triggers nothing. Only committed changes are pushed.

Commit and push to the standalone repositories only through `mirror.sh`. A commit made directly in one of them makes the next mirror push fail (it is rejected rather than overwritten) until the commit is brought into the monorepo.

## Releases and versioning

- **Semver.** Patch releases fix bugs. Minor releases add backwards-compatible features. Breaking changes wait for the next major release and are deprecated (with a warning) for at least one minor release first, unless the change fixes a security issue.
- **Release order.** Release `core` first, then `cli`, then update the version in `docs`.

## Security

Please report vulnerabilities privately to the maintainer ([GitHub @xtareq](https://github.com/xtareq)) rather than in a public issue.

## License

MIT © Tareq Hossain
