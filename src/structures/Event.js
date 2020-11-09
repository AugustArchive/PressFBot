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
 * Represents an [Event] class. The class will inherit
 * this instance to create a new "Event" marker.
 *
 * Basically, it's a class for running events from Eris.
 */
module.exports = class Event {
  /**
   * Creates a new [Event] class.
   * @param {'laffey' | 'eris' | 'redis'} emitter The emitter to use
   * @param {string} event The event name
   */
  constructor(emitter, event) {
    /**
     * The event's name
     * @type {string}
     */
    this.event = event;

    /**
     * The event emitter to use
     * @type {'laffey' | 'eris' | 'redis'}
     */
    this.emitter = emitter;
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
   * Emits the events
   * @param  {...any} args Additional arguments provided by Eris or Laffey
   */
  async emit(...args) {
    throw new SyntaxError(`Event ${this.event} didn't override method "emit"`);
  }
};
