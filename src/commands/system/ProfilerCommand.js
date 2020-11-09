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

const { formatSize, duration } = require('../../util');
const { Command }              = require('../../structures');
const v8                       = require('v8');
const { start } = require('repl');

module.exports = class ProfilerCommand extends Command {
  constructor() {
    super({
      description: 'Shows heap statistics from Node and v8',
      ownerOnly: true,
      category: 'System',
      aliases: ['v8', 'heap'],
      name: 'profiler'
    });
  }

  /**
   * Runs this command
   * @param {import('../../structures/Message')} msg The command's message context
   */
  async run(msg) {
    const message   = await msg.send(':pencil2: **| Now fetching statistics...**');
    const startedAt = process.hrtime();

    const snapshot = v8.getHeapStatistics();
    const embed = this.bot.getEmbed()
      .setTitle('[ v8 Snapshot ]')
      .setDescription([
        '```prolog',
        `Peaked Allocated Memory: ${formatSize(snapshot.peak_malloced_memory)}`,
        `Allocated Memory       : ${formatSize(snapshot.malloced_memory)}`,
        `Heap Size Limit        : ${formatSize(snapshot.heap_size_limit)}`,
        `Current Heap Size      : ${formatSize(snapshot.used_heap_size)}/${formatSize(snapshot.total_heap_size)} (executable: ${formatSize(snapshot.total_heap_size_executable)})`,
        `Physical Size          : ${formatSize(snapshot.total_physical_size)}`,
        '```'
      ])
      .setFooter(`Lasted for ${duration(startedAt).toFixed(2)}ms`);

    await message.delete();
    return msg.embed(embed);
  }
};
