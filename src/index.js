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

/* eslint-disable camelcase */

// im about to be a skid and use switch cases for commands
// because this bot is basic as fuck

require('@augu/dotenv').parse({
  schema: {
    DISCORD_TOKEN: {
      type: 'string',
      default: undefined
    },
    OWNERS: {
      type: 'array',
      default: []
    },
    BOATS_TOKEN: {
      type: 'string',
      default: undefined
    },
    REDIS_HOST: {
      type: 'string',
      default: 'localhost'
    },
    REDIS_PORT: {
      type: 'int',
      default: 6379
    },
    REDIS_PASSWORD: {
      type: 'string',
      default: undefined
    },
    NODE_ENV: {
      type: 'string',
      oneOf: ['development', 'production'],
      default: undefined
    }
  },

  populate: true,
  delimiter: ',',
  file: (require('path')).join(__dirname, '..', '.env')
});

const { Client, EmbedBuilder } = require('wumpcord');
const commands = require('./commands');
const logger = require('./logger');
const orchid = require('@augu/orchid');
const redis = require('./redis');

// create the client
const client = new Client({
  getAllUsers: false,
  shardCount: 'auto',
  token: process.env.DISCORD_TOKEN,
  ws: { intents: ['guilds', 'guildMessages'] }
});

// listen when the bot is ready
client.on('ready', () => {
  logger.log(`Logged in as ${client.user.tag}!`);
  client.setStatus('online', {
    type: 2,
    name: `to f in chat | ${client.guilds.cache.size.toLocaleString()} Guilds`
  });

  postStats();
});

// listen for messages
client.on('message', async event => {
  // ignore bots
  if (event.message.author.bot) return;

  // check if it's a text or news channel
  if (!['text', 'news'].includes(event.channel.type))
    return;

  // check if they reacted with F
  if (
    event.message.content === 'f' ||
    event.message.content === 'F' ||
    event.message.content === ':regional_indicator_f:'
  ) {
    const count = (await redis.get('pressfbot:counter').then(Number).catch(() => 0)) + 1;
    const guildCount = (await redis.get(`pressfbot:counter:${event.guild.id}`).then(Number).catch(() => 0)) + 1;

    await redis.set('pressfbot:counter', `${count}`); // force to be string
    await redis.set(`pressfbot:counter:${event.guild.id}`, `${guildCount}`);

    return event.channel.send({
      content: [
        `<@!${event.message.author.id}> has paid respects.`,
        '',
        `> **Global Counter**: ${count.toLocaleString()}`,
        `> **${event.guild.name}**: ${guildCount.toLocaleString()}`
      ].join('\n'),

      mentions: { users: [] }
    });
  }

  // check for commands
  if (event.message.content.startsWith('f ')) {
    const args = event.message.content.slice('f '.length).split(/ +/g);
    const name = args.shift();

    // ignore on no command
    if (!commands.hasOwnProperty(name))
      return;

    // run the command
    try {
      await commands[name].call(client, event, args);
    } catch(ex) {
      const embed = new EmbedBuilder()
        .setTitle(`Unable to run command '${name}'`)
        .setDescription(`\`\`\`js\n${ex.stack ?? '// No callstack is available'}\`\`\``)
        .setColor(0x9AB4D0)
        .build();

      logger.error(ex);
      return event.channel.send({ embed });
    }
  }
});

// listen on guild events
client.on('guildCreate', async event => {
  logger.log(`Joined ${event.guild.name}!`);
  await postStats();

  const channel = client.channels.get(process.env.GUILD_POST_CHANNEL);
  channel?.send({
    embed: new EmbedBuilder()
      .setTitle(`Joined ${event.guild.name}! :smiley:`)
      .setColor(0x9AB4D0)
      .build()
  });
});

client.on('guildDelete', async event => {
  logger.warn(`Left ${event.guild.name}!`);
  await postStats();

  const channel = client.channels.get(process.env.GUILD_POST_CHANNEL);
  channel?.send({
    embed: new EmbedBuilder()
      .setTitle(`Left ${event.guild.name}... :sob:`)
      .setColor(0x9AB4D0)
      .build()
  });
});

// listen on shard events
client.on('shardReady', id => logger.log(`[#${id}] Shard is ready.`));
client.on('shardClose', (id, error) => logger.error(`[#${id}] Shard has closed connection with Discord\n`, error));
client.on('debug', console.debug);

// listen to redis shit
redis.on('ready', () => logger.log('Redis has connected successfully'));

// now run everything
async function main() {
  logger.log('Now connecting to Discord...');

  await redis.connect();
  await client.connect();

  process.on('SIGINT', () => {
    logger.warn('told to disconnect');

    redis.disconnect();
    client.disconnect(false);
    process.exit(0);
  });
}

async function postStats() {
  if (process.env.NODE_ENV === 'development')
    return;

  if (process.env.BOATS_TOKEN !== undefined) {
    const res = await orchid.post({
      baseUrl: 'https://discord.boats/api',
      url: `/bot/${client.user.id}`,

      headers: {
        Authorization: process.env.BOATS_TOKEN
      },

      data: {
        server_count: client.guilds.cache.size
      }
    });

    logger.log(`Posted to discord.boats (${res.status})\n${JSON.stringify(res.json(), null, 2)}`);
  }
}

main();
