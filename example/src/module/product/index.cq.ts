import { GetByIdsQuery } from './cq/GetByIds.query';
import { GetByIdsHandler } from './cq/GetByIds.handler';

import { ToBookCommand } from './cq/ToBook.command';
import { ToBookHandler } from './cq/ToBook.handler';

export const getByIds = {
  action: GetByIdsQuery,
  handler: GetByIdsHandler,
};

export const toBook = {
  action: ToBookCommand,
  handler: ToBookHandler,
};
