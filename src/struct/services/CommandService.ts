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

import { User, TextChannel, Message } from 'eris';
import { Collection } from '@augu/immutable';
import type PressFBot from '../internals/PressFBot';
import Context from '../internals/Context';
import Command from '../internals/Command';

export default class CommandService {
  private ratelimits: Collection<Collection<number>> = new Collection();
  private cmdRegex: RegExp = /^(F_|F |F-)/i;
  private bot: PressFBot;

  constructor(bot: PressFBot) {
    this.bot = bot;
  }

  private handleRatelimit(ctx: Context, cmd: Command, user: User) {
    if (!this.ratelimits.has(cmd.info.name)) this.ratelimits.set(cmd.info.name, new Collection());

    const amount = cmd.info.cooldown < 1000 ? cmd.info.cooldown * 1000 : cmd.info.cooldown;
    const ratelimits = this.ratelimits.get(cmd.info.name)!;
    const curr = Date.now();

    if (!ratelimits.has(user.id)) {
      ratelimits.set(user.id, curr);
      setTimeout(() => ratelimits.delete(user.id), amount);
    } else {
      const time = ratelimits.get(user.id)!;
      if (curr < time) {
        const left = (time - curr) / 1000;
        return ctx.send(`Woah! Command \`${cmd.info.name}\` is on cooldown for **${left > 1 ? `${left.toFixed()} seconds` : `${left.toFixed()} second`}**`);
      }

      ratelimits.set(user.id, curr);
      setTimeout(() => ratelimits.delete(user.id), curr);
    }
  }

  async invoke(m: Message<TextChannel>) {
    this.bot.statistics.messagesSeen++;
    if (m.author.bot || m.channel.type !== 0) return;
    if (!m.channel.permissionsOf(this.bot.client.user.id).has('sendMessages')) return;

    if (
      m.content === 'f' ||
      m.content === 'F' ||
      m.content === '01000110'
    ) {
      //const user = await this.bot.database.getUser(m.author.id);
      const random = Math.random();

      if (random >= 0.9) m.channel.createMessage('Consider supporting PressFBot, run `F_vote` for more information.'); 
      return m.channel.createMessage(`**${m.member ? m.member.nick ? m.member.nick! : m.author.username : m.author.username}** has paid their respect.`);
    }

    let prefix: string | null = null;
    const mention = new RegExp(`^<@!?${this.bot.client.user.id}> `).exec(m.content);
    const prefixes = [
      'F_',
      'f ',
      'F '
    ].filter(Boolean);
    if (mention !== null) prefixes.push(`${mention}`);

    for (const pre of prefixes) if (m.content.startsWith(pre)) prefix = pre;
    if (prefix === null) return;

    const args = m.content.slice(prefix.length).split(/ +/g);
    const cmd = args.shift()!;
    const module = this.bot.modules.filter(mod => mod.hasCommand(cmd));
    const ctx = new Context(this.bot, m, args);

    if (module.length > 0) {
      const command = module[0].getCommand(cmd);
      if (command.info.ownerOnly && !['280158289667555328'].includes(m.author.id)) return;

      this.handleRatelimit(ctx, command, m.author);
      try {
        await command.run.apply(module, [ctx]);
        this.bot.statistics.inc(command);
      } catch (ex) {
        const embed = this.bot.getEmbed()
          .setTitle(`[ Command ${command.info.name} failed ]`)
          .setDescription([
            'If this command keeps failing, report it to <@280158289667555328> at <https://discord.gg/yDnbEDH>',
            '',
            '```js',
            `[${ex.name}] ${ex.message.slice(ex.message.indexOf(ex.name) + 1)}`,
            '```'
          ].join('\n'));

        this.bot.logger.error(`Unable to run ${command.info.name}:`, ex);
        return ctx.embed(embed);
      }
    }
  }
}