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

module.exports = class PingCommand extends Command {
  constructor() {
    super({
      description: 'Shows the gateway and message latency from Discord',
      aliases: ['pong'],
      name: 'ping'
    });

    // make this immutable
    this.static = Object.freeze({
      vowels: ['a', 'e', 'i', 'o', 'u']
    });
  }

  /**
   * Runs this command
   * @param {import('../../structures/Message')} msg The message
   */
  async run(msg) {
    const message = await msg.send(':ping_pong: **Pong?**');
    const startedAt = process.hrtime();

    await message.delete();

    const duration = util.duration(startedAt);
    const gateway = this.bot.client.shards.reduce((a, b) => a + b.latency, 0);

    return msg.send(`:ping_pong: **Gateway: \`${gateway}ms\` | Message: \`${duration.toFixed()}ms\`**`);
  }
};
