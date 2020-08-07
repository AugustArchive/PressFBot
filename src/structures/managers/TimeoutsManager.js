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

const { Day } = require('../../util/Constants');

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

      setTimeout(async() => {
        const exists = await this.bot.redis.hexists('timeouts', id);
        if (exists) {
          await this.bot.redis.hdel('timeouts', date);
          await this.bot.database.setVote(value.split(':')[0], false);
        }
      }, start - (Date.now() + Day));
    }
  }

  /**
   * Applies a new timeout
   * @param {string} id The user's ID
   */
  async apply(id) {
    const date = Date.now();
    await this.bot.redis.hset('timeouts', id, date);

    setTimeout(async() => {
      if (await this.bot.redis.hexists('timeouts', id)) {
        await this.bot.redis.hdel('timeouts', id);
        await this.bot.database.setVote(id, false);
      }
    }, Day);
  }
};