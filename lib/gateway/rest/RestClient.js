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

const { HttpClient, middleware } = require('@augu/orchid');
const EventBus = require('../../util/EventBus');

/**
 * Returns the offset from Discord to us
 * @param {number} date The date
 */
const getApiOffset = (date) => new Date(date).getTime() - Date.now();

/**
 * Calculates the reset date
 * @param {number} reset The reset time
 * @param {number} serverDate The server date for Discord
 */
const calculateResetTime = (reset, serverDate) => new Date(Number(reset) * 1000).getTime() - getApiOffset(serverDate);

module.exports = class RestClient extends EventBus {
  /**
   * Creates a new [RestClient] instance
   * @param {import('../WebSocketClient')} client The client instance
   */
  constructor(client) {
    super();

    /**
     * The last dispatched call
     * @type {number}
     */
    this.lastDispatched = -1;

    /**
     * If we are being ratelimited or not
     * @type {boolean}
     */
    this.ratelimited = false;

    /**
     * The remaining requests before we lock this [RestClient]
     * @type {number}
     */
    this.remaining = -1;

    /**
     * The reset time
     * @type {number}
     */
    this.resetTime = -1;
  }
};
