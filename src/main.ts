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

import PressFBot, { Config } from './struct/internals/PressFBot';
import { createLogger } from '@augu/logging';
import { existsSync } from 'fs';
import { getPath } from './util';
import leeks from 'leeks.js';

const logger = createLogger('Master');
if (!existsSync(getPath('config.json'))) {
  logger.error(`Missing "config.json" in path ${leeks.colors.gray(getPath('config.json'))}.`);
  process.exit(1);
}

const config: Config = require('./config.json');
const bot = new PressFBot(config);

logger.info('Starting up...');
bot
  .start()
  .then(() => logger.info('Setup completed'))
  .catch(ex => logger.error(ex));

process
  .on('SIGINT', () => {
    logger.warn('Received "CTRL+C" action');
    bot.dispose();

    process.exit(0);
  })
  .on('uncaughtException', (reason) => logger.error('Received an uncaught exception:', reason || new Error('Unknown reason')))
  .on('unhandledRejection', (reason) => logger.error('Received an unhandled promise:', reason || new Error('Unknown reason')));