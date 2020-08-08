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

const CommandMessage = require('../Message');
const { Support } = require('../../util/Constants');

/**
 * Represents a service for running commands
 */
module.exports = class CommandService {
  /**
   * Creates a new [CommandService]
   * @param {import('../PressFBot')} bot The bot instance
   */
  constructor(bot) {
    /**
     * The bot instance
     */
    this.bot = bot;
  }

  /**
   * Runs the command service
   * @param {import('eris').Message<import('eris').TextChannel>} msg The message
   */
  async invoke(msg) {
    this.bot.statistics.messages++;

    if (msg.author.bot || msg.channel.type !== 0) return;
    if (!msg.channel.permissionsOf(this.bot.client.user.id).has('sendMessages')) return;

    let user = await this.bot.database.getUser(msg.author.id);
    if (user === null) {
      await this.bot.database.createUser(msg.author.id);
      user = await this.bot.database.getUser(msg.author.id);
    }

    let guild = await this.bot.database.getGuild(msg.channel.guild.id);
    if (guild === null) {
      await this.bot.database.createGuild(msg.channel.guild.id);
      guild = await this.bot.database.getGuild(msg.channel.guild.id);
    }

    if (msg.content === 'f' || msg.content === 'F' || msg.content === '01000110') {
      const random = Math.random();
      if (!user.voted && guild.legacy === 'false' && random <= 0.3) msg.channel.createMessage('Consider supporting PressFBot, run `F_vote` for more information.');
      return msg.channel.createMessage({
        content: `**${msg.member ? msg.member.nick ? msg.member.nick : msg.author.username : msg.author.username}** has paid their respect. :hibiscus:`,
        allowedMentions: {
          everyone: false,
          roles: false,
          users: false
        }
      });
    }

    let prefix = null;
    const mention = new RegExp(`^<@!?${this.bot.client.user.id}> `).exec(msg.content);
    const prefixes = [
      'F_',
      'f ',
      'F '
    ].filter(Boolean);
    if (mention !== null) prefixes.push(`${mention}`);

    for (const pre of prefixes) if (msg.content.startsWith(pre)) prefix = pre;
    if (prefix === null) return;

    const args = msg.content.slice(prefix.length).split(/ +/g);
    const commandName = args.shift();
    const commands = this.bot.commands.filter(cmd =>
      cmd.name === commandName || cmd.aliases.includes(cmd)  
    );

    const ctx = new CommandMessage(this.bot, msg, args);

    if (commands.length > 0) {
      const command = commands[0];
      if (command.ownerOnly && !this.bot.config.owners.includes(msg.author.id)) return;

      try {
        await command.run(ctx);
        this.bot.statistics.inc(command);
      } catch(ex) {
        const embed = this.bot.getEmbed()
          .setTitle(`[ Command ${command.name} failed ]`)
          .setDescription([
            `If this command keeps failing, report it to <@280158289667555328> at <${Support}>`,
            '',
            '```js',
            `[${ex.name}] ${ex.message.slice(ex.message.indexOf(ex.name) + 1)}`,
            '```'
          ].join('\n'));

        this.bot.logger.error(`Unable to run ${command.name}:`, ex);
        return ctx.embed(embed);
      }
    }
  }
};