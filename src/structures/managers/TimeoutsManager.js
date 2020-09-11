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

const { Collection } = require('@augu/immutable');
const { Timeout } = require('../../util/Constants');
const Logger = require('../Logger');
const Util = require('../../util');
const { humanize } = require('../../util');

/**
 * Represents a [TimeoutsManager], which basically
 * creates a timer until a day to remove the vote from
 * discord.boats (made with Laffey)
 */
module.exports = class TimeoutsManager {
  /**
   * Creates a new [TimeoutsManager]
   * @param {import('../PressFBot')} bot The bot instance
   */
  constructor(bot) {
    /**
     * List of timers
     * @type {Collection<NodeJS.Timeout>}
     */
    this.timers = new Collection();

    /**
     * Logger instance
     */
    this.logger = new Logger('Timeouts');

    /**
     * The bot instance
     */
    this.bot = bot;
  }

  /**
   * Reapplies all of the timeouts cached by Redis
   */
  async reapply() {
    const all = await this.bot.redis.hkeys('timeouts');
    for (const id of all) {
      const value = await this.bot.redis.hget('timeouts', id);
      const start = Number(value);
      this.createTimeout(`timeouts:${id}`, start - Date.now() + Timeout);
    }
  }

  /**
   * Applies a new timeout
   * @param {string} id The user's ID
   * @param {number} date The time
   */
  async apply(id, date) {
    await this.bot.redis.hset('timeouts', id, date);
    this.createTimeout(`timeouts:${id}`, Timeout);
  }

  /**
   * Creates a new timeout
   * @param {string} key The key to use
   * @param {number} start The start time, if any
   */
  createTimeout(key, start) {
    const timeout = setTimeout(() => {
      this.bot.redis.hexists('timeouts', key.split(':')[1])
        .then((exists) => {
          if (this.timers.has(key) && exists) {
            this.logger.info(`Timeout for user ${key.split(':')[1]} exists, now clearing...`);
            this.bot.redis.hdel('timeouts', key.split(':')[1])
              .then(() => this.logger.info(`Cleared timeout successfully for user ${key.split(':')[1]}`))
              .catch(this.logger.error)
              .finally(async() => {
                const user = await this.bot.redis.hget('users', key.split(':')[1]);
                const data = JSON.parse(user);
                const payload = JSON.stringify({ id: key.split(':')[1], voted: false, times: data.times, expiresAt: '' });

                await this.bot.redis.hset('users', id, payload);
                clearTimeout(this.timers.get(key));
              });
          }
        }).catch(this.bot.logger.error);
    }, start);

    timeout.unref();
    this.timers.set(key, timeout);
    this.logger.info(`Created timer ${key} for ${Util.humanize(start)}`);
  }
};
