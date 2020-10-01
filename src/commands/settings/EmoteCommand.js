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

module.exports = class EmoteCommand extends Command {
  constructor() {
    super({
      description: 'Sets a custom emote when you press F in chat',
      category: 'Settings',
      aliases: ['emoji', 'set-emote'],
      usage: '<emoji>',
      name: 'emote'
    });
  }

  /**
   * Runs the command
   * @param {import('../../structures/Message')} ctx The command's context
   */
  async run(ctx) {
    if (!ctx.member.permission.has('manageGuild')) return ctx.send('You are missing the **Manage Server** permission!');
    if (!ctx.args.has(0)) return ctx.send('Missing emote argument');

    const emote = ctx.args.get(0);
    const data = JSON.parse(await this.bot.redis.hget('guild', ctx.guild.id));
    await this.bot.redis.hset('guild', ctx.guild.id, JSON.stringify({ id: ctx.guild.id, legacy: data.legacy, emote }));
    
    return ctx.send(`Emote for **${ctx.guild.name}** when pressing F is now ${emote}, this will be at the end of the sentence, but legacy mode should be disabled before using it.`);
  }
};
