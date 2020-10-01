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
const { Command } = require('../../structures');

module.exports = class HelpCommand extends Command {
  constructor() {
    super({
      description: 'Gives a list of PressFBot\'s avaliable commands or gives more information on how to use a specific command',
      aliases: ['halp', 'h', 'cmds', 'commands'],
      usage: '[command]',
      name: 'help'
    });

    this.categories = {};
    this.hasCats = false;
  }

  /**
   * Runs the command
   * @param {import('../../structures/Message')} ctx The command's context
   */
  async run(ctx) {
    if (ctx.args.empty) {
      if (!this.hasCats) {
        this.hasCats = true;

        const commands = this.bot.commands.filter(owo => !owo.ownerOnly);
        commands.forEach(cmd => {
          if (!(cmd.category in this.categories)) this.categories[cmd.category] = [];
          this.categories[cmd.category].push(cmd.name);
        });
      }

      const cmds = this.bot.commands.filter(owo => !owo.ownerOnly);
      /** @type {Collection<import('../../structures/Command')>} */
      const coll = new Collection();

      for (const cmd of cmds) coll.set(cmd.name, cmd);
      const random = coll.random();

      const embed = this.bot.getEmbed()
        .setAuthor(`[ ${this.bot.client.user.username}#${this.bot.client.user.discriminator} | Commands List ]`, 'https://pressfbot.augu.dev', this.bot.client.user.dynamicAvatarURL('png', 1024))
        .setDescription([
          'To use a command, run **F <command>** (`<command>` being the command you want to execute from this list)',
          `Example: ${random.format()}`,
          '',
          'To get documentation of a command, run **F help <command>** (`<command>` being the command you want more information on)',
          `Example: F help ${random.name}`
        ]);

      for (const [category, commands] of Object.entries(this.categories)) {
        if (category === 'System') continue;
        embed.addField(`❯ ${category} [${commands.length} Commands]`, commands.length ? commands.map(s => `**\`${s}\`**`).join(', ') : 'Nothing... :ghost:');
      }

      return ctx.embed(embed);
    } else {
      const name = ctx.args.get(0);
      const command = this.bot.commands.filter(c => c.name === name || c.aliases.includes(name));

      if (!command.length) return ctx.send(`Command **${name}** wasn't found.`);
      else {
        const embed = this.bot.getEmbed()
          .setTitle(`[ Command "${command[0].name}" ]`)
          .setDescription([
            `> **${command[0].description}** `,
            '',
            '```apache',
            `Owner Only: ${command[0].ownerOnly ? 'Yes' : 'No'}`,
            `Aliases   : ${command[0].aliases.length ? command[0].aliases.join(', ') : 'None'}`,
            `Category  : ${command[0].category}`,
            '```'
          ]);

        return ctx.embed(embed);
      }
    }
  }
};
