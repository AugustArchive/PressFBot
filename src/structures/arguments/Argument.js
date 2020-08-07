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
 * Represents a [Argument] of a command, which can be resolved to anything
 */
module.exports = class Argument {
  /**
   * Creates a new [Argument] instance
   * @param {import('../Message')} message The command message
   * @param {ArgumentInfo} info The argument's information
   */
  constructor(message, info) {
    /**
     * If the argument is required
     * @type {boolean}
     */
    this.required = info.required;

    /**
     * The command message
     * @type {import('../Message')}
     */
    this.message = message;

    /**
     * The beginninng prompt
     */
    this.prompt = info.prompt;

    /**
     * The argument's label
     * @type {string}
     */
    this.label = info.label;

    /**
     * The type reader to use (use `|` to create a union type)
     */
    this.type = info.type;
  }

  /**
   * Gets the type reader
   */
  getTypeReader() {
    return this.message.bot.commands.getTypeReader(this.type);
  }

  /**
   * Parses the argument
   * @param {string} value The value
   * @param {number} limit The limit of prompts
   * @returns {ParseResult} The result
   */
  async parse(value, limit) {
    const answers = [];
    const reader = this.getTypeReader();
    if (reader === undefined) return {
      reason: `Invalid type reader "${this.type}"`,
      success: false,
      value: undefined
    };

    const valid = reader.validate(this.message, value);
    let val;
    let index = 0;

    while (!valid) {
      if (index > limit) return {
        success: false,
        reason: 'Reached the max limit of prompts.',
        value: undefined
      };

      const message = await this.message.send([
        this.prompt,
        '',
        'Respond with `cancel` to cancel this prompt.',
        'This prompt will cancel in 60 seconds.'
      ].join('\n'));

      const res = await this.message.awaitMessage(m => m.author.id === this.message.sender.id);
      if (res) {
        answers.push(reader.parse(res.content, this.message));
        val = res.content;
        await message.delete();
      } else {
        return {
          success: false,
          reason: 'Prompt has timed out.',
          value: undefined
        };
      }

      if (val.toLowerCase() === 'cancel') return {
        sucess: false,
        reason: `**${this.message.sender.username}#${this.message.sender.discriminator}** has ended this prompt.`,
        value: undefined
      };

      valid = reader.validate(value, this.message);
      index++;
    }

    return {
      success: true,
      reason: undefined,
      value: reader.parse(value)
    };
  }
};

/**
 * @typedef {object} ArgumentInfo The argument's information
 * @prop {boolean} required If the argument is required
 * @prop {string} prompt The argument's prompt
 * @prop {string} label The argument's label or "name"
 * @prop {string} type The type reader to use (use `|` to create a union type reader)
 * 
 * @typedef {object} ParseResult The result of [Argument.parse]
 * @prop {string} [reason=undefined] The reason why it failed
 * @prop {boolean} success If the parsing was a success or not
 * @prop {any[]} values The values to use
 */