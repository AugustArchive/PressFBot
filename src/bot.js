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

const { PressFBot, Logger } = require('./structures');
const { existsSync } = require('fs');
const { isNode10 } = require('./util');
const { parse } = require('@augu/dotenv');
const { join } = require('path');

const logger = new Logger('Master');
if (!isNode10()) {
  logger.fatal(`Sorry but version ${logger.styles.bold(process.version)} is not an avaliable version to run PressFBot. Please update your Node.js installation to v10 or higher.`);
  process.exit(1);
}

if (!existsSync(join(__dirname, '..', '.env'))) {
  logger.fatal('Missing .env file in root directory');
  process.exit(1);
}

const config = parse({
  delimiter: ',',
  populate: false,
  file: join(__dirname, '..', '.env'),
  schema: {
    REDIS_PASSWORD: {
      type: 'string',
      default: undefined
    },
    DEBUG_INFO: {
      type: 'boolean',
      default: false
    },
    REDIS_DB_ID: {
      type: 'int',
      default: 2
    },
    SENTRY_DSN: {
      type: 'string',
      default: undefined
    },
    LAFFEY_SECRET: {
      type: 'string',
      default: null
    },
    REDIS_HOST: {
      type: 'string',
      default: 'localhost'
    },
    REDIS_PORT: {
      type: 'int',
      default: 6379
    },
    BOATS_TOKEN: {
      type: 'string',
      default: null
    },
    VOTE_LOGS_URL: {
      type: 'string',
      default: null
    },
    LAFFEY_PORT: {
      type: 'int',
      default: 4200
    },
    LAFFEY_ENABLED: {
      type: 'boolean',
      default: false
    },
    NODE_ENV: {
      type: 'string',
      oneOf: ['development', 'production'],
      default: 'development'
    },
    OWNERS: {
      type: 'array',
      default: []
    },
    TOKEN: 'string'
  }
});

if (config.NODE_ENV === 'development') logger.warn('You\'re running a development instance of PressFBot, report bugs if you find any: https://github.com/auguwu/PressFBot');

const bot = new PressFBot(config);
if (bot.docker) logger.warn('Running bot as a Docker container, this is in prototype stages!');

bot.start()
  .then(() => logger.info('PressFBot is all set.'))
  .catch((error) => {
    logger.error('Unable to boot up PressFBot:', error);
    process.exit(1);
  });

process.on('uncaughtException', async(error) => {
  logger.error('Received an uncaught exception:', error);

  // fuck eris man istg
  if (
    error.message.includes('by peer') ||
    error.message.includes('lost connection') ||
    (error.code && error.code === 1001)
  ) {
    logger.info('Restarting PressFBot...');

    bot.client.disconnect({ reconnect: false });
    await bot.client.connect()
      .then(() => logger.info('Force restarted PressFBot'))
      .catch(error => logger.error('Unable to force-restart PressFBot', error));
  }
});

process.on('unhandledRejection', (error) => logger.error('Received an unhandled Promise rejection:', error));
process.on('SIGINT', () => {
  logger.warn('Disposing PressFBot...');

  bot.dispose();
  process.exit(0);
});
