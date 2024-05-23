import { ICommand } from '../index';

interface ICreateCommand extends ICommand<'user.create', { id: number; role: string[] }> { };

class CreateCommand implements ICreateCommand {
  readonly __tag = 'command:user.create';

  constructor(public readonly payload: { id: number, role: string[] }) { }

  middlewares() {
    return [this.checkRole.bind(this), this.isUser.bind(this)];
  }

  async checkRole() {
    if (!this.payload.role.includes('admin')) {
      throw new Error('Not enough access rights');
    }
  }

  async isUser() {
    // @ts-expect-error
    if (!this.payload.id !== 1) {
      throw new Error('Not enough access rights');
    }
  }
}

class CreateCommand2 implements ICreateCommand {
  readonly __tag = 'command:user.create';

  middlewares = [this.checkRole.bind(this), this.isUser.bind(this)];

  constructor(public readonly payload: { id: number, role: string[] }) { }

  async checkRole() {
    if (!this.payload.role.includes('admin')) {
      throw new Error('Not enough access rights');
    }
  }

  async isUser() {
    // @ts-expect-error
    if (!this.payload.id !== 1) {
      throw new Error('Not enough access rights');
    }
  }
}


