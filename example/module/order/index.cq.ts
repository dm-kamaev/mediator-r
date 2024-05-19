import { GetByIdQuery } from './cq/GetById.query';
import { GetByIdHandler } from './cq/GetById.handler';

import { CreateCommand } from './cq/Create.command';
import { CreateHandler } from './cq/Create.handler';

export default {
  getById: {
    action: GetByIdQuery,
    handler: GetByIdHandler,
  },
  create: {
    action: CreateCommand,
    handler: CreateHandler,
  },
};
