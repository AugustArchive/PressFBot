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

const { CommandMessage } = require('..');
const { Support } = require('../../util/Constants');
const Argument = require('../arguments/Argument');

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

    if (msg.content === 'f' || msg.content === 'F' || msg.content === '01000110') {
      // TODO: implement legacy shit
      const random = Math.random();
      if (!user.voted && random >= 0.9) msg.channel.createMessage('Consider supporting PressFBot, run `F_vote` for more information.');
      return msg.channel.createMessage(`**${msg.member ? msg.member.nick ? msg.member.nick : msg.author.username : msg.author.username}** has paid their respect. :hibiscus:`);
    }

    let prefix = null;
    const mention = new RegExp(`^<@!?${this.bot.client.user.id}> `).exec(m.content);
    const prefixes = [
      'F_',
      'f ',
      'F '
    ].filter(Boolean);
    if (mention !== null) prefixes.push(`${mention}`);

    for (const pre of prefixes) if (m.content.startsWith(pre)) prefix = pre;
    if (prefix === null) return;

    const args = msg.content.slice(prefix.length).split(/ +/g);
    const commandName = args.shift();
    const commands = this.bot.commands.filter(cmd =>
      cmd.name === commandName || cmd.aliases.includes(cmd)  
    );

    const ctx = new CommandMessage(this.bot, msg);

    if (commands.length > 0) {
      const command = commands[0];
      if (command.ownerOnly && !this.bot.config.owners.includes(msg.author.bot)) return;

      // handle arguments oWo
      const allArgs = [];

      if (command.args.length) {
        const argMap = command.args.map(arg => new Argument(ctx, arg));

        for (let i = 0; i < args.length; i++) {
          const argument = argMap[i];
          if (argument.required && args.length < i) return ctx.send(`Missing the "${argument.label}" argument.\n> Usage: **${command.format()}**`);
        
          const { reason, success, value } = argument.parse(args[i], args.length);
          if (!success) return ctx.send(reason);

          allArgs.push(value);
        }
      }

      try {
        await command.run(ctx, ...allArgs);
        this.bot.statistics.inc(command);
      } catch(ex) {
        const embed = await this.bot.getEmbed(ctx.sender.id)
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