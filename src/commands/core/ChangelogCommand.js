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

const { getPath, duration, getCommitHash } = require('../../util');
const { promises: fs, existsSync } = require('fs');
const { version } = require('../../../package.json');
const { Command } = require('../../structures');

module.exports = class ChangelogCommand extends Command {
  constructor() {
    super({
      description: 'Shows the current changelog of PressFBot',
      aliases: ['changes'],
      name: 'changelog'
    });
  }

  /**
   * Runs the command
   * @param {import('../../structures/Message')} msg The command message
   */
  async run(msg) {
    const message = await msg.send(':pencil2: **Grabbing changelog...**');
    const started = process.hrtime();
    const path = getPath('assets', 'changelog');

    if (!existsSync(path)) {
      const time = duration(started);
      return message.edit(`Unable to get changelog due to no changelog to read from (**${time}**ms)`);
    }

    const changelog = await fs.readFile(getPath('assets', 'changelog'), { encoding: 'utf-8' });
    const logs = changelog.split('\n');
    const lines = [];

    for (let i = 0; i < logs.length; i++) {
      if (i === 0) {
        const line = logs[i].replace('$COMMIT$', getCommitHash());
        lines.push(line);
        continue;
      }

      const line = logs[i];
      if (line.startsWith('#')) continue; // comments

      lines.push(line);
    }

    const time = duration(started);
    await message.delete();

    const embed = this.bot.getEmbed()
      .setTitle(`Changelog for v${version}`)
      .setDescription(lines)
      .setFooter(`Took ${time.toFixed(2)}ms to retrieve information`);

    return msg.embed(embed);
  }
};
