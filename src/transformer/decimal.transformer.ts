/** @format */

import { ValueTransformer } from 'typeorm';
import Decimal from 'decimal.js';

/**
 * Transforms a Decimal or number value to string with fixed decimal places
 *
 * @param {number} decimals Number of decimal places
 * @constructor
 */
export const DecimalToString =
  (decimals = 2) =>
  ({ value }: { value?: Decimal | number }) => {
    if (typeof value === 'number') {
      value = new Decimal(value);
    }

    return value?.toFixed?.(decimals) || new Decimal(0).toFixed(decimals);
  };

export class DecimalTransformer implements ValueTransformer {
  private readonly decimals: number;

  constructor(decimals = 2) {
    this.decimals = decimals;
  }

  /**
   * Transforms a decimal or number value into a string
   *
   * @param {Decimal | number | undefined} decimal to transform
   *
   * @return {string | undefined} the converted string or {undefined} when no decimal or number was provided
   */
  to(decimal?: Decimal | number): string | undefined {
    if (typeof decimal === 'number') {
      decimal = new Decimal(decimal);
    }

    return decimal?.toFixed(this.decimals);
  }

  /**
   * Transforms a string into a number value
   *
   * @param {string | undefined} decimal to transform into a number
   *
   * @throws Error when decimal-string is not a number value.
   *
   * @return {number} Converted Number or 0 when number was undefined
   */
  from(decimal?: string): number | undefined {
    return decimal ? new Decimal(decimal).toNumber() : 0;
  }
}
