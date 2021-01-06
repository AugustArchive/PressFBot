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

import { Client } from 'wumpcord';
import { parse } from '@augu/dotenv';
import { join } from 'path';
import Logger from './logger';
import orchid from '@augu/orchid';

import * as events from './events';

const pkg = require('../package.json');

interface EnvConfig {
  BOATS_TOKEN?: string;
  NODE_ENV: 'development' | 'production';
  TOKEN: string;
}

const logger = new Logger('PressFBot');
async function main() {
  parse<EnvConfig>({
    file: join(__dirname, '..', '.env'),
    populate: true,
    schema: {
      BOATS_TOKEN: {
        type: 'string',
        default: undefined
      },

      NODE_ENV: {
        type: 'string',
        oneOf: ['development', 'production'],
        default: 'development'
      },

      TOKEN: 'string'
    }
  });

  if (process.env.NODE_ENV === 'development')
    logger.warn('You are running PressFBot in development mode, if any issues occur, report them! (https://github.com/auguwu/PressFBot)');

  const client = new Client({
    token: process.env.TOKEN,
    ws: {
      intents: ['guilds', 'guildMessages']
    }
  });

  client.on('ready', async () => {
    logger.info(`Ready-ed up as ${client.user.tag}!`);
    client.setStatus('online', {
      name: `to f in chat in ${client.guilds.cache.size.toLocaleString()} guilds`,
      type: 2
    });

    if (process.env.BOATS_TOKEN !== undefined) {
      logger.info('Found discord.boats token! Now posting statistics...');
      await orchid.post({
        method: 'POST',
        url: `https://discord.boats/api/bot/${client.user.id}`,

        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `PressFBot (v${pkg.version}, https://github.com/auguwu/PressFBot)`,
          Authorization: process.env.BOATS_TOKEN
        }
      });
    }
  });

  client.on('guildDelete', events.onGuildDelete);
  client.on('guildCreate', events.onGuildCreate);
  client.on('shardReady', events.onShardReady);
  client.on('message', events.onMessageCreate);

  try {
    await client.connect();
    logger.info('Connected to Discord successfully.');
  } catch(ex) {
    logger.error('Unable to connect to Discord!', ex);
  }

  process.on('SIGINT', () => {
    client.disconnect();
    process.exit(0);
  });

  process.on('unhandledRejection', error => logger.error(error));
  process.on('uncaughtException', error => logger.error(error));
}

main();
