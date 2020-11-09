/**
 * Copyright (c) 2020 August
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const Logger = require('../Logger');

/**
 * Represents a [BotlistService], basically
 * a service to post to certain Bot Lists.
 *
 * __**Botlists Avaliable**__
 * - [discord.boats](https://discord.boats)
 */
module.exports = class BotlistService {
  /**
   * Creates a new [BotlistService]
   * @param {import('../PressFBot')} bot The bot instance
   */
  constructor(bot) {
    /**
     * The logger
     * @private
     * @type {Logger}
     */
    this.logger = new Logger('Botlists');

    /**
     * The bot instance
     * @private
     * @type {import('../PressFBot')}
     */
    this.bot = bot;
  }

  /**
   * Starts the timer
   */
  async start() {
    if (this.interval) {
      this.logger.warn('Cron interval is already working...');
      return;
    }

    await this.postStats(false);
    this.interval = setInterval(() => this.postStats(true), 86400000);
  }

  /**
   * Stops the interval
   */
  stop() {
    if (!this.interval) {
      this.logger.error('Interval is already stopped.');
      return;
    }

    clearInterval(this.interval);
    this.interval = undefined;
  }

  /**
   * Posts guild stats
   * @param {boolean} isFirst If it's the first iteration
   */
  async postStats(isFirst) {
    if (this.bot.config.env === 'development') {
      if (!isFirst) {
        this.logger.error('Environment is in development, timer will stop in the next iteration.');
        return;
      } else {
        this.stop();
        return;
      }
    }

    if (this.bot.config.hasOwnProperty('botlists')) {
      if (this.bot.config.botlists.hasOwnProperty('boats') && this.bot.config.botlists.boats !== undefined) {
        this.logger.info('Found discord.boats key! Now posting...');
        try {
          const res = await this.bot.http.request({
            method: 'POST',
            url: `https://discord.boats/api/v2/bot/${this.bot.client.user.id}`,
            headers: {
              Authorization: this.bot.config.botlists.boats
            },
            data: {
              server_count: this.bot.client.guilds.size // eslint-disable-line
            }
          });

          const data = res.json();
          const level = res.statusCode === 200 ? 'info' : 'warn';
          this.logger[level].apply(this.logger, [`Made a request (${res.statusCode}): ${data}`]);
        } catch(ex) {
          this.logger.error('Unable to post to discord.boats:', ex);
        }
      }
    }
  }
};
