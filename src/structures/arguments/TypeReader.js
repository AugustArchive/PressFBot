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

/**
 * Creates a new [TypeReader] instance, which validates
 * and parses a result for the [Argument] class
 */
module.exports = class TypeReader {
  /**
   * Creates a new [TypeReader]
   * @param {string} id The type reader's ID
   */
  constructor(id) {
    /**
     * The ID of this [TypeReader]
     */
    this.id = id;
  }

  /**
   * Validates the type reader
   * @param {string} value The raw value
   * @param {import('../CommandMessage')} msg The command message
   * @returns {boolean} True/false value that it can be parsed or not
   */
  validate(value, msg) {
    throw new TypeError('Missing override function in TypeReader: "validate(value, msg)"');
  }

  /**
   * Parses the type reader
   * @param {string} value The raw value
   * @param {import('../CommandMessage')} msg The command message
   * @returns {any} The value itself
   */
  parse(value, msg) {
    throw new TypeError('Missing override function in TypeReader - "parse(value, msg)"');
  }
};