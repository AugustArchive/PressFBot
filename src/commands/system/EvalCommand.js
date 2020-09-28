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

const { duration } = require('../../util');
const { inspect } = require('util');
const { Command } = require('../../structures');

module.exports = class EvalCommand extends Command {
  constructor() {
    super({
      description: 'Runs arbitray JavaScript code and returns the result',
      ownerOnly: true,
      category: 'System',
      aliases: ['ev', 'js', 'evl'],
      usage: '[...code]',
      name: 'eval'
    });
  }

  /**
   * Runs the command
   * @param {import('../../structures/Message')} ctx The command's context
   */
  async run(ctx) {
    if (ctx.args.empty) return ctx.send('What script do you want me to execute?');
    let script = ctx.args.join(' ');

    if (script.startsWith('```js') && script.endsWith('```')) {
      script = script.replace('```js', '');
      script = script.replace('```', '');
    }

    const isAsync = script.includes('return') || script.includes('await');
    const isSlient = script.includes('--slient') || script.includes('-s');
    const time = process.hrtime();
    let result;

    // Sets a custom depth for util.inspect
    // Credit: https://github.com/AmandaDiscord/Amanda/blob/rained-in/commands/admin.js#L48-L56
    const depth = script.split('--depth=')[1];
    let length = depth ? depth.substring(0).split(' ')[0] : undefined;

    if (!depth) length = 1;
    else {
      length = Math.floor(Number(length));
      if (isNaN(length)) length = 1;

      script = script.replace(`--depth=${script.split('--depth')[1].substring(1).split(' ')[0]}`, '');
    }

    if (isSlient) {
      script = script.replace(/--slient|-s/g, '');
    }

    try {
      result = eval(isAsync ? `(async () => {${script})();` : script);
      if (result instanceof Promise) result = await result;
      if (typeof result !== 'string') {
        result = inspect(result, {
          depth: length,
          showHidden: false
        });
      }

      const res = this.redactTokens(result);
      if (isSlient) return;

      return ctx.send([
        `> Script took **${duration(time).toFixed(2)}ms** to execute`,
        '',
        '```js',
        res,
        '```'
      ].join('\n'));
    } catch(ex) {
      if (isSlient) return;

      return ctx.send([
        `> Script took **${duration(time).toFixed(2)}ms** to execute`,
        '',
        '```js',
        `[${ex.name}] ${ex.message.slice(ex.message.indexOf(ex.name) + 1)}`,
        '```'
      ].join('\n'));
    }
  }

  /**
   * Redacts any tokens
   * @param {string} script The script
   */
  redactTokens(script) {
    let tokens = [
      this.bot.config.token,
      this.bot.config.redis.host,
      this.bot.config.sentryDSN,
      this.bot.config.voteLogUrl
    ];

    if (this.bot.config.laffey.enabled) tokens.push(this.bot.config.laffey.secret);
    if (this.bot.config.redis.password !== null) tokens.push(this.bot.config.redis.password);
    if (this.bot.config.botlists) tokens.push(this.bot.config.botlists.boats);

    tokens = tokens.filter(Boolean);
    const cancellationToken = new RegExp(tokens.join('|'), 'gi');
    return script.replace(cancellationToken, '--snip-- Uwu');
  }
};
