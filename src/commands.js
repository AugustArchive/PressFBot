/**
 * Copyright (c) 2020-2021 August
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

const { EmbedBuilder, version: wumpVer } = require('wumpcord');
const { version } = require('../package.json');
const { inspect } = require('util');
const utils = require('@augu/utils');
const redis = require('./redis');

const filterOut = (client, script) => script.replace(new RegExp([
  client.token,
  process.env.BOATS_TOKEN,
  process.env.REDIS_HOST,
  process.env.REDIS_PASSWORD
].filter(Boolean).join('|'), 'gi'), 'uwu my owo?');

/**
 * list of commands available
 * @type {{ [x: string]: CommandExecutor; }}
 */
module.exports = {
  async stats(event, args) {
    if (args[0] === 'gateway') {
      const shards = this.shards.map(shard => {
        const isCurr = shard.id === event.guild.shardID;
        return `${shard.status === 'connected' ? '+' : shard.status === 'handshaking' || shard.status === 'nearly' ? '*' : '-'} Shard #${shard.id}${isCurr ? ' (current)' : ''} | G: ${this.guilds.cache.size} / U: ${this.users.cache.size} / C: ${this.channels.cache.size} / L: ${shard.ping}ms / S: ${shard.status}`;
      });

      return event.channel.send(`\`\`\`diff\n${shards.join('\n')}\`\`\``);
    }

    const counter = await redis.get('pressfbot:counter').then(Number).catch(() => 0);
    const guildCount = await redis.get(`pressfbot:counter:${event.guild.id}`).then(Number).catch(() => 0);

    const embed = new EmbedBuilder()
      .setColor(0x9AB4D0)
      .setTitle(`PressFBot v${version}`)
      .setDescription([
        `❯ **Global Counter** ~ ${counter.toLocaleString()} (${guildCount.toLocaleString()} in guild)`,
        `❯ **Channels**       ~ ${this.channels.cache.size.toLocaleString()}`,
        `❯ **Library**        ~ [Wumpcord v${wumpVer}](https://github.com/auguwu/Wumpcord)`,
        `❯ **Creator**        ~ ${process.env.OWNERS.split(',').map(r => this.users.get(r)).filter(r => r !== null).map(u => u.tag).join(', ')}`,
        `❯ **Guilds**         ~ ${this.guilds.cache.size.toLocaleString()}`,
        `❯ **Shards**         ~ ${event.guild.shardID}/${this.shards.size} (${this.shards.ping}ms avg.)`,
        `❯ **Users**          ~ ${this.users.cache.size.toLocaleString()}`
      ]);

    return event.channel.send({ embed: embed.build() });
  },

  async eval(event, args) {
    if (!args.length)
      return event.message.reply('gimme stuff to eval >w<', { // could care less tbh
        mentions: { replied: true }
      });

    const script = args.join(' ');
    let result;
    let customScope = script.includes('return') || script.includes('await');

    if (script.startsWith('```js') && script.endsWith('```')) {
      script = script.replace('```js', '');
      script = script.replace('```', '');

      customScope = true; // force to be in custom scope
    }

    const start = process.hrtime();
    try {
      result = eval(customScope ? `const __main__ = () => {${script}}; __main__();` : script);
      if (result instanceof Promise) result = await result;
      if (typeof result !== 'string')
        result = inspect(result, {
          depth: 2,
          showHidden: false,
        });

      const returned = filterOut(this, result);
      const endTime = utils.calculateHRTime(start);
      return event.channel.send(`:thumbsup: **${endTime}ms**\n\`\`\`js\n${returned ?? '// Nothing was returned.'}\`\`\``);
    } catch(ex) {
      return event.channel.send(`:x: **${utils.calculateHRTime(start)}ms**\n\`\`\`js\n${ex.stack}\`\`\``);
    }
  },

  invite(event) {
    return event.channel.send(`:link: **<https://discord.com/oauth2/authorize?client_id=${this.user.id}&scope=bot>** / https://discord.gg/JjHGR6vhcG`);
  }
};

/**
 * @typedef {(this: import('wumpcord').Client, event: import('wumpcord').MessageCreateEvent<import('wumpcord').TextChannel>, args: string[]) => any} CommandExecutor The command's executor
 */
