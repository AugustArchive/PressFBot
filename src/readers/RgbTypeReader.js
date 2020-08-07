/**
 * Copyright (c) 2020 August
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const { TypeReader } = require('../structures');
const { rgbToInt } = require('../util');

/**
 * Represents a [RgbTypeReader], which basically
 * validates a string that has 3 values as an Array
 */
module.exports = class StringTypeReader extends TypeReader {
  constructor() {
    super('rgb');
  }

  /**
   * Validates this type reader
   * @param {string} val The value
   * @param {import('../structures/Message')} msg The command message
   */
  validate(val, msg) {
    const arr = val.split(', ');

    if (arr.length < 3) return false;
    else if (arr.some(a => isNaN(Number(a)))) return false;
    else if (arr.some(a => Number(a) > 255)) return false;
    return true;
  }

  /**
   * Parses this type reader
   * @param {string} val The value
   * @param {import('../structures/Message')} msg The command message
   */
  parse(val, msg) {
    const arr = val.split(', ');
    return rgbToInt(arr[0], arr[1], arr[2]);
  }
};