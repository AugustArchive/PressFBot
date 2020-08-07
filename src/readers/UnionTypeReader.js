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

const TypeReader = require('../structures/arguments/TypeReader');

/**
 * Represents a [UnionTypeReader], which basically
 * is 2 or more types conjoined into one type reader
 */
module.exports = class UnionTypeReader extends TypeReader {
  /**
   * Creates a new UnionTypeReader
   * @param {import('../structures/managers/CommandManager')} manager The command manager
   * @param {string} id The ID
   */
  constructor(manager, id) {
    super(id);

    /**
     * The types avaliable
     * @type {TypeReader[]}
     */
    this.types = [];

    for (const type of id.split('|')) {
      if (!manager.readers.has(type)) throw new TypeError(`Reader "${type}" is not registered`);
      this.types.push(manager.readers.get(type));
    }
  } 

  /**
   * Validates this union type reader
   * @param {string} val The value
   * @param {import('../structures/Message')} msg The command message
   */
  validate(val, msg) {
    return (this.types.map(reader => reader.validate(val, msg))).some(Boolean);
  }

  /**
   * Parses the type reader
   * @param {string} val The value
   * @param {import('../structures/Message')} msg The command message
   */
  parse(val, msg) {
    const results = this.types.map(type => type.validate(val, msg));
    for (let i = 0; i < results.length; i++) {
      if (results[i]) return this.types[i].parse(arg);
    }

    throw new TypeError(`Couldn't parse value "${arg}" with union type "${this.id}"`);
  }
};