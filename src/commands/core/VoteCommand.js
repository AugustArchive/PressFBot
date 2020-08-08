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
    const embed = this.bot.getEmbed()
      .setTitle('[ Voting for PressFBot ]')
      .setImage('https://discord.boats/api/v2/widget/477594964742635531')
      .setDescription([
        'You can vote for me on [**discord.boats**](https://discord.boats/bot/pressfbot)',
        '',
        'Only perks you really get is that annoying pop-up to vote which comes 0.3% of the time (it can be disabled with legacy mode, `F legacy`)',
        '',
        `Want to suggest more? Join my [support server](${Support}) and suggest some to my owner!`
      ]);

    return ctx.embed(embed);
  }
};