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

import { Module, Command, Context, StringBuilder } from '../struct';
import type { ShardArgs } from '../struct/clustering/types/data';
import { OPCodes, Misc } from '../struct/clustering/types';
import { formatSize } from '../util';

interface ModCategories {
  [x: string]: string[];
}

export default class CoreModule extends Module {
  constructor() {
    super({
      description: 'Some miscellaneous commands, nothing much',
      visible: true,
      name: 'core'
    });
  }

  @Command({
    description: 'Shows a list of commands avaliable',
    ownerOnly: false,
    cooldown: 5,
    aliases: ['halp', 'cmds', 'commands', '?'],
    usage: '[command]',
    name: 'help'
  })
  async help(ctx: Context) {
    if (ctx.args.has(0)) {
      const name = ctx.args.get(0)!;
      const found = this.bot.modules.filter(m => m.hasCommand(name));

      if (found.length) {
        const command = found[0].getCommand(name)!;
        const builder = new StringBuilder([
          `__**Command ${command.info.name}**__`,
          `> :pencil2: **${command.info.description}**`,
          '```apache',
          `Owner Only : ${command.info.ownerOnly ? 'Yes': 'No'}`,
          `Cooldown   : ${command.info.cooldown} seconds`,
          `Aliases    : ${command.info.aliases.join(', ') || 'None'}`,
          `Syntax     : F ${command.info.name}${command.info.usage !== '' ? ` ${command.info.usage}` : ''}`,
          `Module     : ${found[0].name}`,
          '```'
        ]);
        
        return ctx.send(builder.build());
      } else {
        return ctx.send(`Command "${name}" was not found?`);
      }
    } else {
      const categories: ModCategories = {};
      const embed = this.bot.getEmbed()
        .setTitle('[ Command List ]')
        .setDescription([
          'To use a command, run `F <commandName>` to execute it\'s command',
          'Example: `F help help`'
        ].join('\n'));

      for (const mod of this.bot.modules.values()) {
        if (!mod.visible) continue;
        if (!categories.hasOwnProperty(mod.name)) categories[mod.name] = [];

        for (const c of mod.commands.values()) {
          categories[mod.name].push(c.info.name);
        }
      }

      for (const category in categories) {
        embed.addField(`${category} (${categories[category].length} Commands)`, categories[category].map(s => `\`${s}\``).join(', '), false);
      }

      return ctx.embed(embed);
    }
  }

  @Command({
    description: 'Gives an invite link and the support server',
    ownerOnly: false,
    cooldown: 5,
    aliases: ['inv', 'invite'],
    usage: '',
    name: 'invite'
  })
  async invite(ctx: Context) {
    return ctx.embed(
      this.bot.getEmbed()
        .setTitle('[ Invite Links ]')
        .setDescription([
          `:link: **<https://discordapp.com/oauth2/authorize?client_id=${this.bot.client.user.id}&scope=bot>**`,
          ':island: **<https://discord.gg/7TtMP2n>**'
        ].join('\n'))
    );
  }

  @Command({
    description: 'Shows the message latency and Discord latency',
    ownerOnly: false,
    cooldown: 5,
    aliases: ['pong'],
    usage: '',
    name: 'ping'
  })
  async ping(ctx: Context) {
    const started = Date.now();
    const message = await ctx.send(':ping_pong: **Ping, pong?**');

    const msgLat = Date.now() - started;
    const shardLat = ctx.guild ? ctx.guild.shard.latency : 0;

    await message.delete();
    return ctx.send(`:ping_pong: **Message: ${msgLat}ms / Shard #${ctx.guild ? ctx.guild.shard.id : 0}: ${shardLat}ms**`);
  }

  @Command({
    description: 'Shows some information about shards, nothing special',
    ownerOnly: false,
    cooldown: 5,
    aliases: ['shard', 'shards'],
    usage: '',
    name: 'shardinfo'
  })
  async shardinfo(ctx: Context) {
    this.bot.cluster.send(OPCodes.CollectStats).then(console.log).catch(console.error);
    return ctx.send('sent stats, look at console');
  }
}

/*
    this.bot.cluster.send<ShardArgs>(OPCodes.CollectStats, (data) => {
      builder = new StringBuilder([
        '```ini',
        `[Heap]: ${formatSize(data.heap)}`,
        `[RSS]:  ${formatSize(data.rss)}`,
        ''
      ]);

      for (const shard of data.shards) {
        const cluster = this.bot.cluster.get(this.bot.cluster.getClusterByShard(shard.id)!);
        builder.appendln([
          `[ Shard #${shard.id} ]`,
          `G: ${shard.guilds} / U: ${shard.users} / S: ${Misc.status(shard.status)} / L: ${shard.latency}ms / C: ${cluster ? `#${cluster.id} (${cluster.status})` : '???'}`,
          ''
        ]);
      }
    });

    return ctx.send(builder != null ? (builder as StringBuilder).build() : 'Unable to fetch shard statistics');*/