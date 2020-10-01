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

const { Support } = require('../../util/Constants');
const { Command } = require('../../structures');
const { humanize } = require('../../util');

module.exports = class VoteCommand extends Command {
  constructor() {
    super({
      description: 'Shows what you get out of voting',
      name: 'vote'
    });
  }

  /**
   * Runs the command
   * @param {import('../../structures/Message')} ctx The command's context
   */
  async run(ctx) {
    const data = await this.bot.redis.hget('users', ctx.sender.id);
    const status = JSON.parse(data);

    const message = status.voted ? `Vote is currently on-going and will be non-existent in **${humanize(Date.now() - status.expiresAt)}**` : 'You did not vote in the past 12 hours.';
    const embed = this.bot.getEmbed()
      .setTitle('[ Voting for PressFBot ]')
      .setImage('https://discord.boats/api/v2/widget/477594964742635531?type=png')
      .setDescription([
        '> You can vote on [**discord.boats**](https://discord.boats/bot/477594964742635531)!',
        '',
        'If you do read this, please do so or remove the annoying pop up with the **legacy** command!',
        'It helps with the bot since it\'s non-profit and always will be free.',
        '',
        `**Vote Status**: ${message}`
      ]);

    return ctx.embed(embed);
  }
};
