import { ICommand } from '../../../../../src';

import { z } from 'zod';
import type { Provider } from '../../../cqrs';

interface ICreateCommand extends ICommand<'order.create', Array<{ product_id: number; quantity: number }>> {}

export class CreateCommand implements ICreateCommand {
  readonly __tag = 'command:order.create';
  public payload: ICreateCommand['payload'];

  constructor(
    listBooked: ICreateCommand['payload'],
    private readonly productModule: { getByIds: Provider['product']['getByIds'] },
  ) {
    this.payload = z
      .array(
        z.object({
          product_id: z.number({
            required_error: 'Requiring id of product',
            invalid_type_error: 'Id of product must be number',
          }),
          quantity: z.number({
            required_error: 'Requiring quantity of product',
            invalid_type_error: 'Quantity of product must be number',
          }),
        }),
      )
      .parse(listBooked);
  }

  async validate() {
    const setProductId = new Set((await this.productModule.getByIds(this.payload.map((el) => el.product_id))).map((el) => el.id));
    for (const el of this.payload) {
      if (!setProductId.has(el.product_id)) {
        throw new Error(`Not found product with id = ${el.product_id}`);
      }
    }
  }
}
