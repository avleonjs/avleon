---
title: Introduction
description: What Avleon is.
---

# Introduction

## Overview

Avleon is a TypeScript-first web framework built on [Fastify](https://fastify.dev),
for building REST APIs with minimal boilerplate. It gives you:

- Decorator-based controllers and routes
- Dependency injection
- Request validation with class-validator DTOs
- Authentication and deny-by-default authorization
- Automatic OpenAPI documentation with Swagger UI or Scalar
- TypeORM and Knex integrations with one pagination shape
- Events, BullMQ queues, task scheduling and caching
- Socket.IO integration
- Structured logging and test utilities

Integrations are optional peer dependencies, so you install only what you use.

> **Upgrading from 0.2?** 0.3 changes authorization, validation, pagination,
> file storage and dependencies. See [Upgrading to 0.3](/getting-started/upgrading).
