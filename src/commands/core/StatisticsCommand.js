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
    let commits;
    try {
      const res = await this.bot.http.request({
        method: 'get',
        url: 'https://api.github.com/repos/auguwu/PressFBot/commits',
        headers: {
          'Accept': 'application/json'
        }
      });

      const data = res.json();
      commits = [].concat(data);
    } catch(ex) {
      commits = [];
    }

    const memory = process.memoryUsage();
    const hash = util.getCommitHash();
    const guilds = this.bot.client.guilds.size.toLocaleString();
    const members = this.bot.client.guilds.reduce((a, b) => a + b.memberCount, 0).toLocaleString();
    const rss = util.formatSize(memory.rss);
    const heap = util.formatSize(memory.heapTotal - memory.heapUsed);
    const channels = Object.keys(this.bot.client.channelGuildMap).length.toLocaleString();
    const shardPing = this.bot.client.shards.reduce((a, b) => a + b.latency, 0);
    const { command, uses } = this.bot.statistics.getCommandUsages();

    const embed = this.bot.getEmbed()
      .setAuthor(`${this.bot.client.user.username}#${this.bot.client.user.discriminator} [v${version} / ${hash}]`, 'https://pressfbot.augu.dev', this.bot.client.user.dynamicAvatarURL('png', 1024))
      .setDescription(commits.length ? commits.slice(0, 5).map(commit => {
        const sha = commit.sha.slice(0, 8);
        const date = new Date(commit.commit.author.date);

        return `[**\`${sha}\`**](${commit.html_url}) **${commit.commit.message}** - ${commit.commit.author.name} at ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${util.escapeTime(date.getHours())}:${util.escapeTime(date.getMinutes())}:${date.getSeconds()}${date.getHours() >= 12 ? 'PM' : 'AM'}`;
      }).join('\n') : 'Couldn\'t get commits at this time.')
      .addField('❯ Miscellaneous', [
        `• **Guilds**: ${guilds}`,
        `• **Users**: ${members}`,
        `• **Channels**: ${channels}`,
        `• **Uptime**: ${util.humanize(Math.floor(process.uptime()) * 1000)}`,
        `• **Shards**: ${ctx.guild.shard.id} / ${this.bot.client.shards.size} (~${shardPing}ms)`,
        `• **Memory Usage (RSS/Heap)**: ${rss} / ${heap}`,
        `• **Messages Seen**: ${this.bot.statistics.messages.toLocaleString()}`,
        `• **Commands Executed**: ${this.bot.statistics.commandsExecuted.toLocaleString()}`,
        `• **Most Used Command**: ${command} (${uses} Executions)`
      ].join('\n'), true);

    return ctx.embed(embed);
  }
};