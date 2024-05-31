import { GetByIdQuery } from './cq/GetById.query';
import { GetByIdHandler } from './cq/GetById.handler';

import { CreateCommand } from './cq/Create.command';
import { CreateHandler } from './cq/Create.handler';

export const getById = {
  action: GetByIdQuery,
  handler: GetByIdHandler,
};

export const create = {
  action: CreateCommand,
  handler: CreateHandler,
};
