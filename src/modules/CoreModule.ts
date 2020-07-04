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

import { Module, Command, Context } from '../struct';
import { stripIndents } from 'common-tags';
import { formatSize } from '../util';

export default class CoreModule extends Module {
  constructor() {
    super({
      description: 'Some miscellaneous commands, nothing much',
      visible: true,
      name: 'core'
    });
  }

  @Command({
    description: 'Retrives cluster information',
    ownerOnly: false,
    cooldown: 5,
    aliases: ['cluster', 'clu', 'cluster-info'],
    usage: '',
    name: 'clusterinfo'
  })
  async clusterinfo(ctx: Context) {
    const message = await ctx.send('Fetching cluster information...');
    const info = await this.bot.cluster.getInfo();

    if (info === null) return message.edit('Unable to fetch information, was it parsed correctly?');
    else {
      const infos: string[] = [];
      for (const data of info) {
        infos.push(
          `[ Cluster #${data.cluster} ]`, 
          '',
          `Heap Used: ${formatSize(data.heap)}`,
          `RSS: ${formatSize(data.rss)}`,
          'Shards: ',
          ''
        );

        for (const shard of data.shards) infos.push(stripIndents`
          #${shard.id} (${shard.id === (ctx.guild ? ctx.guild.shard.id : 0) ? 'current' : ''}):
          G: ${shard.guilds} / U: ${shard.users} / L: ${shard.latency} / S: ${shard.status}
        `);

        infos.push('');
      }

      const embed = this.bot.getEmbed()
        .setTitle('[ Cluster Information ]')
        .setDescription(stripIndents`
          \`\`\`prolog
          ${infos.join('\n')}
          \`\`\`
        `).build();

      return ctx.embed(embed);
    }
  }
}