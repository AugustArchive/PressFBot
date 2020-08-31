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
 * Represents an [ArgumentParser], basically
 * an utility class for checking arguments
 */
module.exports = class ArgumentParser {
  /**
   * Creates a new [ArgumentParser]
   * @param {string[]} args The arguments
   */
  constructor(args) {
    /**
     * The arguments provided by the user
     * @type {string[]}
     */
    this.raw = args;
  }

  /**
   * Checks if the argument list isn't empty
   */
  get empty() {
    return this.raw.length === 0;
  }

  /**
   * Gets an argument or returns `undefined` if the list is shorter then `i`
   * @param {number} i The index to check from
   */
  get(i) {
    if (this.raw.length < i) return undefined;
    return this.raw[i];
  }

  /**
   * Checks if `i` is included in the argument list
   * @param {number} i The index to check
   */
  has(i) {
    return !!this.raw[i];
  }

  /**
   * Slices all of the arguments by `start` (or `end`) and returns a new [ArgumentParser]
   * @param {number} start The start
   * @param {number} [end] The end point
   */
  slice(start, end) {
    return new ArgumentParser(this.raw.slice(start, end));
  }

  /**
   * Joins the arguments by a seperator
   * @param {string} [sep=', '] The seperator
   */
  join(sep = ', ') {
    return this.raw.join(sep);
  }
};
