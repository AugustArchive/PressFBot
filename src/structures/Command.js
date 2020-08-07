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
 * Represents a [Command] class. Basically to register an class instance
 * as an command.
 */
module.exports = class Command {
  /**
   * Creates a new [Command] class.
   * @param {CommandInfo} info The command's information
   */
  constructor(info) {
    /**
     * The description of the command
     * @type {string}
     */
    this.description = info.description;

    /**
     * If this command should be ran by the owners
     * @type {boolean}
     */
    this.ownerOnly = info.hasOwnProperty('ownerOnly') ? info.ownerOnly : false;

    /**
     * The command's external names
     * @type {string[]}
     */
    this.aliases = info.hasOwnProperty('aliases') ? info.aliases : [];

    /**
     * The command's external arguments
     * @type {import('./arguments/Argument').ArgumentInfo[]}
     */
    this.args = info.hasOwnProperty('args') ? info.args : [];

    /**
     * The command's name
     * @type {string}
     */
    this.name = info.name;
  }
  
  /**
   * Adds `bot` to the command's constructor
   * @param {import('./PressFBot')} bot The bot instance
   * @returns {this} This instance to chain methods
   */
  init(bot) {
    this.bot = bot;
    return this;
  }

  /**
   * Runs the command
   * @param {import('./Message')} msg The extended message
   * @param  {...any} args The arguments (if provided by [Command.args])
   */
  async run(msg, ...args) {
    throw new SyntaxError(`Command ${this.name} didn't override method "run"`);
  }

  /**
   * Format the command's usage
   */
  format() {
    const usage = this.args.length ? this.args.map(arg => {
      const prefix = arg.required ? '<' : '[';
      const suffix = arg.required ? '>' : ']';

      return `${prefix}${arg.label}${suffix}`;
    }) : '';

    return `${this.bot.config.prefix}${this.name}${usage === '' ? '' : ` ${usage}`}`;
  }
};

/**
 * @typedef {object} CommandInfo Represents information to pass in for [Command]
 * @prop {string} description The description of the command
 * @prop {boolean} [ownerOnly=false] If this command should be ran by the owners
 * @prop {string[]} [aliases=[]] The command's external names
 * @prop {import('./arguments/Argument').ArgumentInfo[]} [args=[]] The command's external arguments
 * @prop {string} name The command's name
 */