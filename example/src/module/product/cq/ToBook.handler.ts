import { ICommandHandler } from '../../../../../src';
import type { ToBookCommand } from './ToBook.command';

import dbProduct from '../db/dbProduct';

export class ToBookHandler implements ICommandHandler<ToBookCommand, { quantityBooked: number }> {
  readonly __tag = 'command:product.to-book';

  async exec({ payload: { id, quantity } }: ToBookCommand) {
    const product = dbProduct.getById(id);

    if (!product) {
      throw new Error('Not found product');
    }
    const wantedQuantity = quantity;
    let notEnough = true;
    while (product.quantity !== 0 && quantity !== 0) {
      product.quantity--;
      quantity--;
      notEnough = false;
    }

    let quantityBooked = wantedQuantity - quantity;
    if (notEnough) {
      quantityBooked = 0;
    }

    dbProduct.update({ id }, { quantity: product.quantity });

    return { quantityBooked };
  }
}
