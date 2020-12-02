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

const { version } = require('../../package.json');

module.exports = {
  /**
   * Gateway version for Discord
   */
  GatewayVersion: 8,

  /**
   * The user agent
   */
  UserAgent: `PressFBot (v${version}, https://github.com/auguwu/PressFBot)`,

  /**
   * Rest version for Discord
   */
  RestVersion: 8,

  /**
   * Minimal library version
   */
  Version: '1.0.0',

  /**
   * List of statuses
   */
  Status: {
    Connected: 'connected',
    Connecting: 'connecting',
    AwaitingGuilds: 'awaiting_guilds',
    Disposed: 'disposed'
  },

  /**
   * List of unrecoverable codes
   */
  UnrecoverableCodes: [
    1005, // idk?
    4004, // failed to log in
    4010, // invalid shard
    4011, // shard included too many guilds
    4013, // invalid intents
    4014  // disallowed intents
  ],
};
