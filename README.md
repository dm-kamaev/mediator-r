# CQRS

[![Actions Status](https://github.com/dm-kamaev/cqrs/workflows/Build/badge.svg)](https://github.com/dm-kamaev/cqrs/actions)

Library for realization of CQRS in your applicaton.

```sh
npm i @ignis-web/cqrs -S
```

## Table of Contents:

- [Example](#example)
- [Return value](#command-may-return-value)
- [Validation](#validation)
- [Async build command/query](#async-build-commandquery)
- [Middlewares](#middlewares)
- [After exec](#after-exec)
- [Bus typing and convinent invoke command/query](#bus-typing-and-convinent-invoke-commandquery)
- [Invoke command/query from another command/query](#invoke-commandquery-from-another-commandquery)
- [Code Generation](#code-generation)

### Example
```ts
import Bus, { ICommand, IQuery, ICommandHandler, IQueryHandler } from '@ignis-web/cqrs';

// first argument is unique indeteficator of command, second is payload data
interface ICreateCommand extends ICommand<'user.create', { id: number; name: string }> {};
interface ICreateHandler extends ICommandHandler<ICreateCommand> {};

// first argument is unique indeteficator of query, second is payload data
interface IGetByIdQuery extends IQuery<'user.get-by-id', number> {};
// second argument is return data from query
interface IGetByIdHandler extends IQueryHandler<IGetByIdQuery, { id: number, name: string }> {};


class CreateCommand implements ICreateCommand {
  readonly __tag = 'command:user.create';

  constructor(public readonly payload: { id: number; name: string }) { }
}

class CreateHandler implements ICreateHandler {
  public readonly __tag = 'command:user.create';


  async exec({ payload: user }: ICreateCommand) {
    console.log('user was created =>', {
      id: user.id,
      name: user.name,
    });
  }
}

class GetByIdQuery implements IGetByIdQuery {
  readonly __tag = 'query:user.get-by-id';

  constructor(public payload: number) { }
}


class GetByIdHandler implements IGetByIdHandler {
  readonly __tag = 'query:user.get-by-id';

  async exec({ payload: id }: IGetByIdQuery) {
    return {
      id: id,
      name: 'John',
    };
  }
}

const bus = new Bus({
  user: {
    create: {
      action: (payload) => new CreateCommand(payload),
      handler: () => new CreateHandler(),
    },
    getById: {
      action: (id) => new GetByIdQuery(id),
      handler: () => new GetByIdHandler()
    },
  }
});

void async function () {
  const userId = 123;
  await bus.exec(bus.action.user.create({ id: userId, name: 'John' }));
  // { id: 123 }
  const user = await bus.exec(bus.action.user.getById(userId));
  // { id: 123, name: 'John' }
}();
```
[Example app](https://github.com/dm-kamaev/cqrs/tree/master/example)

### Command may return value
Often we need that handler of command return result of operation. For example, id of entity or status of operation. For this you can pass second argument to `ICommandHandler`, it's type of returned value.
```ts
interface ICreateCommand extends ICommand<'user.create', { id: number; name: string }> {};
interface ICreateHandler extends ICommandHandler<ICreateCommand, { id: number }> {};

class CreateHandler implements ICreateHandler {
  readonly __tag = 'command:user.create';

  async exec({ payload: user }: ICreateCommand) {
    const userId = 1;
    console.log('create', {
      userId,
      name: user.name,
    });
    return { id: userId };
  }
}
```


### Validation
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
interface ICreateCommand extends ICommand<'user.create', { id: number; role: string[] }> {};

class CreateCommand implements ICreateCommand {
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
interface ICreateCommand extends ICommand<'user.create', { id: number; role: string[] }> { };

class CreateCommand implements ICreateCommand {
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

class CreateHandler implements ICreateHandler {
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

### Bus typing and convinent invoke command/query
If you want to pass bus of command and query as dependencies (DI) instead of direct import in your codebase, you can create neccessary types:
```ts
import { IBus as ICQBus } from '@ignis-web/cqrs';

type TModule = {
  user: {
    create: {
      action: (payload: ICreateCommand['payload']) => ICreateCommand,
      handler: () => ICreateHandler,
    },
    getById: {
      action: (payload: IGetByIdQuery['payload']) => IGetByIdQuery,
      handler: () => IGetByIdHandler,
    },
  }
};

interface IBus extends ICQBus<TModule> {};

void async function () {

  const bus: IBus = new Bus<TModule>({
    user: {
      create: {
        action: (payload) => new CreateCommand(payload),
        handler: () => new CreateHandler(),
      },
      getById: {
        action: (id) => new GetByIdQuery(id),
        handler: () => new GetByIdHandler()
      },
    }
  });

  await example(bus);
}();

async function example (bus: IBus) {
  const userId = 123;
  await bus.exec(bus.action.user.create({ id: userId, name: 'John' }));
  // { id: 123 }
  const user = await bus.exec(bus.action.user.getById(userId));
  // { id: 123, name: 'John' }
}
```

You can use less verbose code for calling command and query:
```ts
// Instead of
await bus.exec(bus.action.user.create({ id: userId, name: 'John' }));
// That is
await provider.user.create({ id: userId, name: 'John' });
```
Example:
```ts
import { IBus as ICQBus, ResultOfAction } from '@ignis-web/cqrs';

type TProvider = {
  user: {
    create: (payload: ICreateCommand['payload']) => ResultOfAction<TModule, ICreateCommand>,
    getById: (payload: IGetByIdQuery['payload']) => ResultOfAction<TModule, IGetByIdQuery>,
  },
};

type TModule = {
  user: {
    create: {
      action: (payload: ICreateCommand['payload']) => ICreateCommand,
      handler: () => ICreateHandler,
    },
    getById: {
      action: (payload: IGetByIdQuery['payload']) => IGetByIdQuery,
      handler: () => IGetByIdHandler,
    },
  }
};

interface IBus extends ICQBus<TModule> {};

interface IProvider extends TProvider {};

void async function () {

  const provider: IProvider = {
    user: {
      create: async (payload) => await bus.exec(bus.action.user.create(payload)),
      getById: async (payload) => await bus.exec(bus.action.user.getById(payload)),
    },
  };

  const bus: IBus = new Bus<TModule>({
    user: {
      create: {
        action: (payload) => new CreateCommand(payload),
        handler: () => new CreateHandler(),
      },
      getById: {
        action: (id) => new GetByIdQuery(id),
        handler: () => new GetByIdHandler()
      },
    }
  });

  await example(provider);
}();

async function example(provider: IProvider) {
  const userId = 123;
  await provider.user.create({ id: userId, name: 'John' });
  // { id: 123 }
  const user = await provider.user.getById(userId);
  // { id: 123, name: 'John' }
}
```

### Invoke command/query from another command/query
If you want to invoke command/query from another command/query. You can pass neccessary command/query as dependency into the constructor of handler.
```ts
import Bus, { IBus as ICQBus, ICommand, IQuery, ICommandHandler, IQueryHandler, ResultOfAction } from '@ignis-web/cqrs';

interface ICreateCommand extends ICommand<'user.create', { id: number; name: string }> {};
interface ICreateHandler extends ICommandHandler<ICreateCommand> {};

interface IGetByIdQuery extends IQuery<'user.get-by-id', number> {};
interface IGetByIdHandler extends IQueryHandler<IGetByIdQuery, { id: number, name: string }> {};

type TProvider = {
  user: {
    create: (payload: ICreateCommand['payload']) => ResultOfAction<TModule, ICreateCommand>,
    getById: (payload: IGetByIdQuery['payload']) => ResultOfAction<TModule, IGetByIdQuery>,
  },
};

type TModule = {
  user: {
    create: {
      action: (payload: ICreateCommand['payload']) => ICreateCommand,
      handler: () => ICreateHandler,
    },
    getById: {
      action: (payload: IGetByIdQuery['payload']) => IGetByIdQuery,
      handler: () => IGetByIdHandler,
    },
  }
};
interface IBus extends ICQBus<TModule> {};
interface IProvider extends TProvider {};

class CreateCommand implements ICreateCommand {
  readonly __tag = 'command:user.create';
  constructor(public readonly payload: { id: number; name: string }) {}
}

class CreateHandler implements ICreateHandler {
  public readonly __tag = 'command:user.create';

  constructor(
    /**
     * Injection query
    */
    private readonly providerUserModule: { getById: IProvider['user']['getById'] }
  ) {}

  async exec({ payload: user }: ICreateCommand) {
    /**
     * Calling query
    */
    if (await this.providerUserModule.getById(user.id)) {
      throw new Error(`User with id = ${user.id} already exist`);
    }

    console.log('create user =>', {
      id: user.id,
      name: user.name,
    });
  }

}

class GetByIdQuery implements IGetByIdQuery {
  readonly __tag = 'query:user.get-by-id';
  constructor(public payload: number) {}
}


class GetByIdHandler implements IGetByIdHandler {
  readonly __tag = 'query:user.get-by-id';

  async exec({ payload: id }: IGetByIdQuery) {
    return {
      id: id,
      name: 'John',
    };
  }
}

const provider: IProvider = {
  user: {
    create: async (payload) => await bus.exec(bus.action.user.create(payload)),
    getById: async (payload) => await bus.exec(bus.action.user.getById(payload)),
  },
};

const bus: IBus = new Bus<TModule>({
  user: {
    create: {
      action: (payload) => new CreateCommand(payload),
      /**
       * Injection query
      */
      handler: () => new CreateHandler({ getById: provider.user.getById }),
    },
    getById: {
      action: (id) => new GetByIdQuery(id),
      handler: () => new GetByIdHandler()
    },
  }
});


void async function () {
  const userId = 123;
  await provider.user.create({ id: userId, name: 'John' });
  // { id: 123 }
  const user = await provider.user.getById(userId);
  // { id: 123, name: 'John' }
}();
```

### Code generation
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

