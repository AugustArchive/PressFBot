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

const { Support } = require('../util/Constants');
const { Event } = require('../structures');

module.exports = class VoteEvent extends Event {
  constructor() {
    super('laffey', 'vote');
  }

  /**
   * Emits when a vote has been received
   * @param {import('laffey').laffey.BotPacket} bot The bot
   * @param {import('laffey').laffey.UserPacket} user The user
   */
  async emit(bot, user) {
    if (bot.name !== 'PressFBot') return;

    this.bot.logger.info(`User ${user.username}#${user.discriminator} has voted for PressFBot, now at ${this.bot.webhook.requests.toLocaleString()} requests received`);
    await this.bot.database.setVote(user.id, true);
    await this.bot.timeouts.apply(user.id);

    const u = this.bot.client.users.get(user.id);
    if (!u) return;

    const votes = await this.bot.redis.hkeys('timeouts');
    const embed = this.bot.getEmbed()
      .setAuthor(`[ ${user.username}#${user.discriminator} | Voted for ${bot.name} ]`, bot.url, bot.avatar)
      .setDescription([
        `:pencil2: **Now at ${votes.length} votes and ${this.bot.webhook.requests.toLocaleString()} requests received!**`
      ].join('\n'));

    if (this.bot.config.voteLogUrl !== null) await this.bot.http.request({
      method: 'POST',
      url: `${this.bot.config.voteLogUrl}?wait=true`,
      data: { embeds: [embed.build()] }
    });

    try {
      const channel = await u.getDMChannel();
      const embed = this.bot.getEmbed(u.id);

      embed
        .setTitle('[ Thanks for voting! ]')
        .setDescription([
          ':hibiscus: **| Enjoy your perks! It\'s not much, but it helps in the long run.**',
          ':question: **| Want to suggest more perks? Join the support server and send some to the owner!**',
          '',
          Support
        ]);

      return channel.createMessage({
        embed
      });
    } catch(ex) {
      // ignore lol
    }
  }
};