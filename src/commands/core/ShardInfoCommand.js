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

const { Command } = require('../../structures');
const util = require('../../util');

module.exports = class ShardInfoCommand extends Command {
  constructor() {
    super({
      description: 'Shows information about the shards running',
      aliases: ['shards', 'shard', 'si'],
      name: 'shardinfo'
    });
  }

  /**
   * Runs the command
   * @param {import('../../structures/Message')} ctx The command's context
   */
  async run(ctx) {
    const info = [];
    for (const shard of this.bot.client.shards.values()) {
      const memory = process.memoryUsage();
      const current = ctx.guild.shard.id === shard.id ? '(current)' : '';
      const guilds = this.bot.client.guilds.filter(g => g.shard.id === shard.id);
      const members = guilds.reduce((a, b) => a + b.memberCount, 0);
      const memoryRSS = util.formatSize(memory.rss);
      const memoryHeap = util.formatSize(memory.heapTotal - memory.heapUsed);

      const prefix = shard.status === 'disconnected' ? '-' : shard.status === 'connecting' || shard.status === 'handshaking' || shard.status === 'resuming' ? '*' : '+';
      info.push(`${prefix} #${shard.id} ${current} | G: ${guilds.length} | U: ${members} | L: ${shard.latency}ms | RSS: ${memoryRSS} | H: ${memoryHeap}`);
    }

    return ctx.send(`\`\`\`diff\n${info.join('\n')}\n\`\`\``);
  }
};