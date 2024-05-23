# MediatorR

[![Actions Status](https://github.com/dm-kamaev/mediator-r/workflows/Build/badge.svg)](https://github.com/dm-kamaev/mediator-r/actions)

Library for realization of CQS/CQRS in your applicaton.

```sh
npm i mediator-r -S
```

## Table of Contents:

- [Example](#example)
- [Return value](#command-may-return-value)
- [Validation](#validation)
- [Async build command/query](#async-build-commandquery)
- [Middlewares](#middlewares)
- [After exec](#after-exec)
- [Invoke command/query from another command/query](#invoke-commandquery-from-another-commandquery)
<!-- - [Code Generation](#code-generation) -->

## Example
```ts
import MediatorR, { ICommand, IQuery, ICommandHandler, IQueryHandler, CreateProvider } from 'mediator-r';

// first argument is unique indeteficator of command, second is payload data
class CreateCommand implements ICommand<'user.create', { id: number; name: string }> {
  readonly __tag = 'command:user.create';

  constructor(public readonly payload: { id: number; name: string }) {}

  async validate() {
    if (this.payload.name.length < 2) {
      throw new Error('Incorrect name');
    }
  }

  async build() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.payload.name = 'John';
        resolve();
      }, 5000);
    });
  }
}

class CreateHandler implements ICommandHandler<CreateCommand> {
  public readonly __tag = 'command:user.create';
  private user: { id: number; name: string };

  async validate({ payload: user }: CreateCommand) {
    if (user.name.length < 2) {
      throw new Error('Incorrect name');
    }
  }

  async exec({ payload: user }: CreateCommand ) {
    console.log('create user =>', {
      id: user.id,
      name: user.name,
    });
    this.user = user;
  }
}

/**
 * first argument is unique indeteficator of query, second is payload data
 * second argument is return data from query
*/
class GetByIdQuery implements IQuery<'user.get-by-id', number> {
  readonly __tag = 'query:user.get-by-id';

  constructor(public payload: number) {}
}


class GetByIdHandler implements IQueryHandler<GetByIdQuery, { id: number, name: string }> {
  readonly __tag = 'query:user.get-by-id';

  async exec({ payload: id }: GetByIdQuery) {
    return {
      id: id,
      name: 'John',
    };
  }
}

const schema = {
  user: {
    create: {
      action: (id: CreateCommand['payload']) => new CreateCommand(id),
      handler: () => new CreateHandler(),
      exec: (userData: CreateCommand['payload']) => mediatorR.exec(mediatorR.action.user.create(userData))
    },
    getById: {
      action: (id: GetByIdQuery['payload']) => new GetByIdQuery(id),
      handler: () => new GetByIdHandler(),
      exec: (userId: number) => mediatorR.exec(mediatorR.action.user.getById(userId))
    },
  }
};

// Declare types
export type Mediator = MediatorR<typeof schema>;
export type Provider = CreateProvider<typeof schema>;

// Initilization
export const mediatorR: Mediator = new MediatorR(schema);
export const provider: Provider = mediatorR.provider;


void (async function (mediatorR: Mediator, provider: Provider) {
  const userId = 123;

  // Manual call
  {
    await mediatorR.exec(mediatorR.action.user.create({ id: userId, name: 'John' }));
    // { id: 123 }
    const user = await mediatorR.exec(mediatorR.action.user.getById(userId));
    // { id: 123, name: 'John' }
  }

  // Call via provider
  {
    await provider.user.create({ id: userId, name: 'John' });
    // { id: 123 }
    const user = await provider.user.getById(userId);
    // { id: 123, name: 'John' }
  }
})(mediatorR, provider);
```
[Example app](https://github.com/dm-kamaev/cqrs/tree/master/example)

## Command may return value
Often we need that handler of command return result of operation. For example, id of entity or status of operation. For this you can pass second argument to `ICommandHandler`, it's type of returned value.
```ts
class CreateHandler implements ICommandHandler<ICreateCommand, { id: number }> {
  readonly __tag = 'command:user.create';

  async exec({ payload: user }: CreateCommand) {
    const userId = 1;
    console.log('create', {
      userId,
      name: user.name,
    });
    return { id: userId };
  }
}
```


## Validation
You can use method `validate` for validation of input data in command or query:
```ts
class CreateCommand implements ICreateCommand {
  readonly __tag = 'command:user.create';

  constructor(public readonly payload: string) {}

  async validate() {
    if (this.payload.name.length < 2) {
      throw new Error('Incorrect name');
    }
  }
}
```
The method `validate` is asyncronous and called after `constructor`.

It's also available in handler of command/query. Command or query is passed as the first argument:
```ts
class CreateHandler implements ICreateHandler {
  readonly __tag = 'command:user.create';

  async validate({ payload: user }: ICreateCommand) {
    if (user.name.length < 2) {
      throw new Error('Incorrect name');
    }
  }

  async exec({ payload: user }: ICreateCommand) {
     console.log('create', {
      id: user.id,
      name: user.name,
    });
  }
}
```

### Async build command/query
TypeScript can't support asyncronous constructor for class but sometimes you may be want to execute asyncronous actions for building command/query. The method `build` comes to rescue:
```ts
class CreateCommand implements ICreateCommand {
  public readonly __tag = 'command:user.create';

  constructor(public readonly payload: { id: number; name: string }) {}

  async build() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.payload.name = 'John';
        resolve();
      }, 5000);
    });
  }
}
```
It's asyncronous and called after `validate`.


### Middlewares
You can use concept of middleware in command/query.
The first variant is to override method `middlewares` which must return array of functions:
```ts
class CreateCommand implements ICommand<'user.create', { id: number; role: string[] }> {
  readonly __tag = 'command:user.create';

  constructor(public readonly payload: { id: number, role: string[] }) {}

  middlewares() {
    return [this.checkRole.bind(this), this.isUser.bind(this)];
  }

  async checkRole() {
    if (!this.payload.role.includes('admin')) {
      throw new Error('Not enough access rights');
    }
  }

  async isUser() {
    if (!this.payload.id !== 1) {
      throw new Error('Not enough access rights');
    }
  }
}
```

The second variant is to create property `middlewares` which be array of functions:
```ts
class CreateCommand implements ICommand<'user.create', { id: number; role: string[] }> {
  readonly __tag = 'command:user.create';

  middlewares = [this.checkRole.bind(this), this.isUser.bind(this)];

  constructor(public readonly payload: { id: number, role: string[] }) { }

  async checkRole() {
    if (!this.payload.role.includes('admin')) {
      throw new Error('Not enough access rights');
    }
  }

  async isUser() {
    if (!this.payload.id !== 1) {
      throw new Error('Not enough access rights');
    }
  }
}
```
Middlewares are called before methods `validate` and `build`.

### After exec
This method in handler is intended for executing asynchronous action after executing method `exec`. For example, sending emails or notifications to another service, emitting domain events etc.
```ts
import EventEmitter from 'events';

const eventEmitter = new EventEmitter();

eventEmitter.on('user.created', ({ id, name }) => {
  console.log('User was created', { id, name });
});

class CreateHandler implements ICommandHandler<CreateCommand> {
  readonly __tag = 'command:user.create';
  private user: { id: number; name: string };

  async exec({ payload: user }: ICreateCommand) {
     console.log('create', {
      id: user.id,
      name: user.name,
    });
    this.user = user;
  }

  async afterExec() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        eventEmitter.emit('user.created', this.user)
        resolve();
      }, 5000);
    });
  }
}
```
It's asyncronous and called after `exec`.

## Invoke command/query from another command/query
If you want to pass bus of command and query as dependencies (DI) instead of direct import in your codebase, you can create neccessary types:
```ts
import MediatorR, { ICommand, IQuery, ICommandHandler, IQueryHandler, CreateProvider } from 'mediator-r';

class CreateCommand implements ICommand<'user.create', { id: number; name: string }> {
  readonly __tag = 'command:user.create';

  constructor(public readonly payload: { id: number; name: string }) {}

  async validate() {
    if (this.payload.name.length < 2) {
      throw new Error('Incorrect name');
    }
  }
}


class CreateHandler implements ICommandHandler<CreateCommand> {
  public readonly __tag = 'command:user.create';

  constructor(private readonly providerUserModule: { getById: Provider['user']['getById'] }) {}

  async exec({ payload: user }: CreateCommand) {

    if (await this.providerUserModule.getById(user.id)) {
      throw new Error(`User with id = ${user.id} already exist`);
    }

    console.log('create user =>', {
      id: user.id,
      name: user.name,
    });
  }

}

class GetByIdQuery implements IQuery<'user.get-by-id', number> {
  readonly __tag = 'query:user.get-by-id';

  constructor(public payload: number) { }
}


class GetByIdHandler implements IQueryHandler<GetByIdQuery, { id: number, name: string }> {
  readonly __tag = 'query:user.get-by-id';

  async exec({ payload: id }: GetByIdQuery) {
    return {
      id: id,
      name: 'John',
    };
  }
}

const schema = {
  user: {
    create: {
      action: (id: CreateCommand['payload']) => new CreateCommand(id),
      handler: () => new CreateHandler({ getById: provider.user.getById }),
      exec: (userData: CreateCommand['payload']) => mediatorR.exec(mediatorR.action.user.create(userData))
    },
    getById: {
      action: (id: GetByIdQuery['payload']) => new GetByIdQuery(id),
      handler: () => new GetByIdHandler(),
      exec: (userId: number) => mediatorR.exec(mediatorR.action.user.getById(userId))
    },
  }
};


export type Mediator = MediatorR<typeof schema>;
export type Provider = CreateProvider<typeof schema>;
export const mediatorR: Mediator = new MediatorR(schema);
export const provider: Provider = mediatorR.provider;


void (async function (mediatorR: Mediator, provider: Provider) {
  const userId = 123;

  // Manual call
  {
    await mediatorR.exec(mediatorR.action.user.create({ id: userId, name: 'John' }));
    // { id: 123 }
    const user = await mediatorR.exec(mediatorR.action.user.getById(userId));
    // { id: 123, name: 'John' }
  }

  // Call via provider
  {
    await provider.user.create({ id: userId, name: 'John' });
    // { id: 123 }
    const user = await provider.user.getById(userId);
    // { id: 123, name: 'John' }
  }
})(mediatorR, provider);
```

<!-- ### Code generation
Package `@ignis-web/cqrs-cli` helps to create bolerplate code for command and query from declared types.

Install:
```sh
npm i @ignis-web/cqrs-cli -D
```

Creating file with types for command and query:
```ts
# example/module/user/type.ts

import { ICommand, IQuery, ICommandHandler, IQueryHandler } from '@ignis-web/cqrs';

export interface ICreateCommand extends ICommand<'user.create', { id: number; name: string }> { };
export interface ICreateHandler extends ICommandHandler<ICreateCommand> { };

export interface IGetByIdQuery extends IQuery<'user.get-by-id', number> { };
export interface IGetByIdHandler extends IQueryHandler<IGetByIdQuery, { id: number, name: string }> { };
```

Generate code:
```sh
npx create-cq -m example/module/user

Output:
example/module/user/
├── cq
│   ├── Create.command.ts
│   ├── Create.handler.ts
│   ├── GetById.handler.ts
│   └── GetById.query.ts
├── index.ts
└── type.ts
```

[More details](https://www.npmjs.com/package/@ignis-web/cqrs-cli)
 -->
