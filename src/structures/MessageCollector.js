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

/**
 * Creates a new [MessageCollector], which awaits new messages
 * to be received from the user with [MessageCollector.awaitMessage]
 */
module.exports = class MessageCollector {
  /**
   * Creates a new [MessageCollector]
   * @param {improt('./PressFBot')} bot The bot instance
   * @param {MessageCollectorDefaults} opts The defaults to use
   */
  constructor(bot, opts) {
    bot.client.on('messageCreate', m => this.verify.apply(this, [m]));

    /**
     * The collectors
     * @type {Collection<{ accept: (value: Message | PromiseLike<Message>) => void; filter: Filter }>}
     */
    this.collectors = new Collection();

    /**
     * The defaults to use
     * @type {MessageCollectorDefaults}
     */
    this.defaults = opts;
  }

  /**
   * Verifies the message
   * @param {Message} msg The message
   */
  verify(msg) {
    // If it's not a valid message (requires `author`)
    if (!msg.author) return;

    const collector = this.collectors.get(`${msg.channel.id}:${msg.author.id}`);
    if (collector && collector.filter(msg)) return collector.accept(msg);
  }

  /**
   * Awaits an message in 60 seconds and returns it
   * @param {Filter} filter The filter to use
   * @returns {Promise<Message>} A promise of the resolved message
   */
  awaitMessage(filter) {
    return new Promise(accept => {
      if (this.collectors.has(`${this.defaults.channelID}:${this.defaults.authorID}`)) this.collectors.delete(`${this.defaults.channelID}:${this.defaults.authorID}`);

      this.collectors.set(`${this.defaults.channelID}:${this.defaults.authorID}`, { accept, filter });
      setTimeout(accept.bind(null, false), this.defaults.timeout < 1000 ? this.defaults.timeout * 1000 : this.defaults.timeout);
    });
  }
};

/**
 * @typedef {import('eris').Message<import('eris').TextChannel>} Message The message with the channel as [TextChannel]
 * @typedef {(m: Message) => boolean} Filter The filter to use
 * @typedef {object} MessageCollectorDefaults Default stuff
 * @prop {string} channelID The channel's ID
 * @prop {string} authorID The author's ID
 * @prop {number} timeout The timeout to use
 */
