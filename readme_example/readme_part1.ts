import EventEmitter from 'events';

import MediatorR, { ICommand, IQuery, ICommandHandler, IQueryHandler, CreateProvider } from '../index';

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

const eventEmitter = new EventEmitter();
eventEmitter.on('user.created', ({ id, name }) => {
  console.log('user was created', { id, name });
});

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

  async afterExec() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        eventEmitter.emit('user.created', this.user)
        resolve();
      }, 5000);
    });
  }
}

/**
 * first argument is unique indeteficator of query, second is payload data
 * second argument is return data from query
*/
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









