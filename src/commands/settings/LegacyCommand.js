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

const { pipelines } = require('@augu/maru');
const { Command } = require('../../structures');

module.exports = class LegacyCommand extends Command {
  constructor() {
    super({
      description: 'Enables or disables legacy mode',
      category: 'Settings',
      name: 'legacy'
    });
  }

  /**
   * Runs the command
   * @param {import('../../structures/Message')} ctx The command's context
   */
  async run(ctx) {
    if (!ctx.member.permission.has('manageGuild')) return ctx.send('You are missing the **Manage Server** permission');

    const settings = await this.bot.database.getGuild(ctx.guild.id);
    const bool = !settings.legacy;

    const { legacy: enabled } = await this.bot.database.connection.query(pipelines.Update({
      returning: ['legacy'],
      values: { legacy: bool },
      query: ['id', ctx.guild.id],
      table: 'guilds',
      type: 'set'
    }));

    const emote = enabled ? ':white_check_mark:' : ':question:';
    return ctx.send(`${emote} **Legacy mode is ${enabled ? 'enabled' : 'disabled'}**`);
  }
};