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

const { version } = require('../../util/Constants');
const { Command } = require('../../structures');
const util = require('../../util');

/** Object of the months from `Date#getMonth` */
const MONTHS = {
  // All of the months are 0-indexed
  0: 'Jan',
  1: 'Feb',
  2: 'Mar',
  3: 'Apr',
  4: 'May',
  5: 'Jun',
  6: 'Jul',
  7: 'Aug',
  8: 'Sept',
  9: 'Oct',
  10: 'Nov',
  11: 'Dec'
};

module.exports = class StatisticsCommand extends Command {
  constructor() {
    super({
      description: 'Shows realtime statistics, kinda boring',
      aliases: ['statistics', 'info', 'bot', 'botinfo', 'me'],
      name: 'stats'
    });
  }

  /**
   * Runs the command
   * @param {import('../../structures/Message')} ctx The command's context
   */
  async run(ctx) {
    const memory = process.memoryUsage();
    const hash = util.getCommitHash();
    const guilds = this.bot.client.guilds.size.toLocaleString();
    const members = this.bot.client.guilds.reduce((a, b) => a + b.memberCount, 0).toLocaleString();
    const rss = util.formatSize(memory.rss);
    const heap = util.formatSize(memory.heapUsed);
    const channels = Object.keys(this.bot.client.channelGuildMap).length.toLocaleString();
    const shardPing = this.bot.client.shards.reduce((a, b) => a + b.latency, 0);
    const { command, uses } = this.bot.statistics.getCommandUsages();

    const embed = this.bot.getEmbed()
      .setAuthor(`${this.bot.client.user.username}#${this.bot.client.user.discriminator} [v${version} | ${hash}]`, 'https://pressfbot.augu.dev', this.bot.client.user.dynamicAvatarURL('png', 1024))
      .setDescription([
        `• **Guilds**: ${guilds}`,
        `• **Users**: ${members}`,
        `• **Channels**: ${channels}`,
        `• **Uptime**: ${util.humanize(Math.floor(process.uptime()) * 1000)}`,
        `• **Shards**: ${ctx.guild.shard.id} / ${this.bot.client.shards.size} (~${shardPing}ms)`,
        `• **Messages Seen**: ${this.bot.statistics.messages.toLocaleString()}`,
        `• **Webhook Requests**: ${this.bot.webhook ? this.bot.webhook.requests.toLocaleString() : 'Not Enabled'}`,
        `• **Commands Executed**: ${this.bot.statistics.commandsExecuted.toLocaleString()}`,
        `• **Most Used Command**: ${command} (${uses} Executions)`,
        `• **Memory Usage (RSS/Heap)**: ${rss} / ${heap}`,
        `• **Webhook Votes before restart**: ${this.bot.webhook ? this.bot.webhook.votes.toLocaleString() : 'Not Enabled'}`,
        `• **How many times F was received**: ${this.bot.statistics.pressF.toLocaleString()}`
      ])
      .setFooter('Made by August#5820 | https://augu.dev')
      .setTimestamp();

    return ctx.embed(embed);
  }
};
