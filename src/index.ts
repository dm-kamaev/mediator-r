type ActionName = `${'query' | 'command'}:${string}`;

interface BaseAction {
  middlewares?: Array<(...arg: any) => Promise<any>> | (() => Array<(...arg: any) => Promise<any>>);
  validate?: () => Promise<any>;
  build?: () => Promise<any>;
}

interface Action<Payload> extends BaseAction {
  readonly __tag: ActionName;
  payload: Payload;
}

export interface IQuery<Name extends string, Payload> extends Action<Payload> {
  readonly __tag: `query:${Name}`;
}

export interface ICommand<Name extends string, Payload> extends Action<Payload> {
  readonly __tag: `command:${Name}`;
}

interface BaseHandler<Action> {
  // eslint-disable-next-line no-unused-vars
  validate?: (action: Action) => Promise<any>;
  afterExec?: () => Promise<void>;
}

interface ActionHandler<TAction extends Action<any> = Action<any>, Output = void> extends BaseHandler<TAction> {
  readonly __tag: ActionName;
  exec: (action: TAction) => Promise<Output>;
}

export interface IQueryHandler<TAction extends Action<any> = Action<any>, Output = void> extends ActionHandler<TAction, Output> {
  readonly __tag: `${TAction['__tag']}`;
  exec: (action: TAction) => Promise<Output>;
}

export interface ICommandHandler<TAction extends Action<any> = Action<any>, Output = void> extends ActionHandler<TAction, Output> {
  readonly __tag: `${TAction['__tag']}`;
  exec: (action: TAction) => Promise<Output>;
}

type Handler<A extends Action<any>, B> = () => ActionHandler<A, B>;

interface Component {
  action: (...arg: any[]) => Action<any>;
  handler: Handler<any, any>;
  exec: (...arg: any[]) => any;
}

// export interface IBus<HashModule extends Record<string, Record<string, {
//   action: (...arg: any[]) => Action<any>,
//   handler: Handler<any, any>,
//   exec: (...arg: any[]) => ResultOfAction<HashModule, ReturnType<any>>
// }>> = Record<string, Record<string, any>>> {
//   readonly action: ExtractActions<HashModule>;
//   readonly mediator: CreateProvider<HashModule>;
//   exec<TCommand extends Action<any> = any>(action: TCommand): Promise<ResultOf<ExtractHandlers<HashModule>, TCommand>>;
//   // exec<TCommand extends Action<any> = any>(action: TCommand): Promise<ResultOf<ExtractHandlers<HashModule>, TCommand>>;
//   // exec<TAction extends Action<any> = any>(action: TAction): ResultOf<ExtractHandlers<HashModule>, TAction>;
//   // exec<TAction extends Action<any> = any>(action: TAction): ResultOf<ExtractHandlers<HashModule>, TAction>;
//   // exec<TAction extends Action<any> = any>(action: TAction): ExtractHandlers<HashModule>;
//   // exec<TAction extends Action<any> = any>(action: TAction): any;
// }

// export type ResultOf<TRegisteredCommandHandlers extends Handler<any, any>, TCommand extends Action<any>> = Awaited<
//   ReturnType<
//     ReturnType<
//       Extract<TRegisteredCommandHandlers, (...arg: any[]) => { exec: (cmd: TCommand) => Promise<any> }>
//     >['exec']
//   >>;

type ExcludeNeverFieldsOnFirstLevel<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
};

type ExcludeNeverFieldsOnSecondLevel<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K][keyof T[K]];
};

type GetValueOfObject<T> = T[keyof T];

// type Debug1234 = ValueOf<RemoveNever<RemoveNever2<{
//     product: {
//         toBook: never;
//         getByIds: {
//             id: number;
//             name: string;
//             price: number;
//             quantity: number;
//         }[];
//     };
//     order: {
//         create: never;
//         getById: never;
//     };
// }>>>;

export type ResultOfAction<Components extends Record<string, Record<string, Component>>, InputAction extends Action<any>> = Promise<
  GetValueOfObject<
    ExcludeNeverFieldsOnFirstLevel<
      ExcludeNeverFieldsOnSecondLevel<{
        [ComponentName in keyof Components]: {
          [ActionName in keyof Components[ComponentName]]: Components[ComponentName][ActionName] extends {
            action: (...arg: any) => InputAction;
          }
            ? Awaited<ReturnType<ReturnType<Components[ComponentName][ActionName]['handler']>['exec']>>
            : never;
        };
      }>
    >
  >
>;

// type ExtractHandlers<Components extends Record<string, Record<string, Component>>> =
//   Components extends Record<string, Record<string, infer R>> ?
//     R extends Component ? R['handler'] : never
//   : never;

type ExtractActions<
  Components extends Record<string, Record<string, { action: (...arg: any[]) => Action<any>; handler: Handler<any, any> }>>,
> = {
  [ComponentName in keyof Components]: {
    [ActionName in keyof Components[ComponentName]]: Components[ComponentName][ActionName]['action'];
  };
};

// export type ResultOfAction<Components extends Record<string, Record<string, Component>>, InputAction extends Action<any> = any> = Promise<
//   ResultOf<ExtractHandlers<Components>, InputAction>
// >

export type CreateProvider<Components extends Record<string, Record<string, Component>>> = {
  [ComponentName in keyof Components]: {
    [ActionName in keyof Components[ComponentName]]: Components[ComponentName][ActionName]['exec'];
  };
};

export default class MediatorR<Components extends Record<string, Record<string, Component>> = Record<string, Record<string, any>>> {
  readonly action: ExtractActions<Components> = {} as ExtractActions<Components>;
  readonly provider: CreateProvider<Components> = {} as CreateProvider<Components>;
  private readonly _fabricHandlers: Record<string, Handler<any, any>>;

  constructor(hashModule: Components) {
    this._fabricHandlers = {};

    (Object.entries(hashModule) as Array<[keyof Components, Components[keyof Components]]>).forEach(([moduleName, hashAction]) => {
      if (!this.action[moduleName]) {
        this.action[moduleName] = {} as ExtractActions<Components>[keyof ExtractActions<Components>];
      }

      if (!this.provider[moduleName]) {
        this.provider[moduleName] = {} as any;
      }

      (Object.entries(hashAction) as Array<[keyof Components[keyof Components], Component]>).forEach(([actionName, actionAndHandler]) => {
        const handler = actionAndHandler.handler();
        this.action[moduleName][actionName] = actionAndHandler.action;
        const tag = handler.__tag;
        if (this._fabricHandlers[tag]) {
          throw new HandlerDuplicateError(`Handler already exist with name ${tag}`);
        }

        this._fabricHandlers[tag] = actionAndHandler.handler;

        this.provider[moduleName][actionName] = (payload: any) => this.exec(actionAndHandler.action(payload));
      });
    });
  }

  async exec<InputAction extends Action<any> = any>(action: InputAction): ResultOfAction<Components, InputAction> {
    const fabric = this._fabricHandlers[action.__tag];
    if (!fabric) {
      const [type, name] = action.__tag.split(':');
      if (isType(type)) {
        this._commandOrQueryNotFound(type, name);
      } else {
        throw new Error(`Invalid type: ${type}`);
      }
    }

    if (action.middlewares) {
      const middlewares = action.middlewares instanceof Function ? action.middlewares() : action.middlewares;
      for await (const middleware of middlewares) {
        await middleware();
      }
    }

    if (action.validate) {
      await action.validate();
    }

    if (action.build) {
      await action.build();
    }

    const handler = fabric();
    if (handler.validate) {
      await handler.validate(action);
    }

    const result = await handler.exec(action);

    if (handler.afterExec) {
      await handler.afterExec();
    }

    return result;
  }

  private _commandOrQueryNotFound(type: 'command' | 'query', name: string) {
    if (type === 'command') {
      throw new CommandNotFoundError(`Command: ${name} is not found.`);
    } else {
      throw new QueryNotFoundError(`Query: ${name} is not found.`);
    }
  }
}

function isType(input: string): input is 'command' | 'query' {
  return input === 'command' || input === 'query';
}

export class CommandNotFoundError extends Error {}

export class QueryNotFoundError extends Error {}

export class HandlerDuplicateError extends Error {}
