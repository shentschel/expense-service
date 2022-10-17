/** @format */

import Decimal from 'decimal.js';
import { DecimalToString, DecimalTransformer } from './decimal.transformer';

describe('DecimalTransformer', () => {
  const transformer: DecimalTransformer = new DecimalTransformer();
  const decimalString = DecimalToString;

  describe('Class', () => {
    it('should transform a string with 4 decimal places', () => {
      expect.assertions(1);

      // given
      const decimals = 4;
      const number = 100;

      // when
      const transformerWith4decimals = new DecimalTransformer(decimals);
      const stringValue = transformerWith4decimals.to(number);

      // then
      expect(stringValue).toBe(number.toFixed(decimals));
    });

    it('should transform a decimal to a string', () => {
      expect.assertions(1);

      // given
      const value = 100;

      // when
      const valueAsString = transformer.to(new Decimal(value));

      // then
      expect(valueAsString).toBe('100.00');
    });

    it('should transform a number to a string', () => {
      expect.assertions(1);

      // given
      const value = 100;

      // when
      const valueAsString = transformer.to(value);

      // then
      expect(valueAsString).toBe('100.00');
    });

    it('should transform an undefined decimal to undefined', () => {
      expect.assertions(1);

      // when
      const valueAsString = transformer.to(undefined);

      // then
      expect(valueAsString).toBeUndefined();
    });

    it('should transform a string to a decimal', () => {
      expect.assertions(1);

      // given
      const valueString = '100.01';

      // when
      const valueAsString = transformer.from(valueString);

      // then
      expect(valueAsString).toBe(100.01);
    });

    it('should transform an undefined to 0', () => {
      expect.assertions(1);

      // when
      const valueAsString = transformer.from(undefined);

      // then
      expect(valueAsString).toBe(0);
    });

    it('should fail to transform an non-number', () => {
      expect.assertions(2);

      try {
        // when
        transformer.from('Lorem');
      } catch (e) {
        // then
        expect(e).toBeDefined();
        expect(e.message).toBe('[DecimalError] Invalid argument: Lorem');
      }
    });
  });

  describe('Function', () => {
    it('should transform a decimal value to a fixed string', () => {
      expect.assertions(1);

      // given
      const decimal: Decimal = new Decimal(100.01);

      // when
      const valueString = decimalString(2)({ value: decimal });

      // then
      expect(valueString).toBe('100.01');
    });

    it('should transform a number value to a fixed string', () => {
      expect.assertions(1);

      // given
      const decimal = 100.01;

      // when
      const valueString = decimalString()({ value: decimal });

      // then
      expect(valueString).toBe('100.01');
    });

    it('should transform an undefined value to fixed string', () => {
      expect.assertions(1);

      // when
      const valueString = decimalString(4)({ value: undefined });

      // then
      expect(valueString).toBe('0.0000');
    });
  });
});
