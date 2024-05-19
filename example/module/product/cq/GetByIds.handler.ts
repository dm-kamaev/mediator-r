import { IQueryHandler } from '../../../../index';
import dbProduct from '../db/dbProduct';

import type { GetByIdsQuery } from './GetByIds.query';

export class GetByIdsHandler implements IQueryHandler<GetByIdsQuery, Array<{ id: number; name: string; price: number; quantity: number }>> {
  readonly __tag = 'query:product.get-by-ids';

  async exec({ payload: ids }: GetByIdsQuery) {
    const list = dbProduct.getByIds(ids);
    return list;
  }
}
