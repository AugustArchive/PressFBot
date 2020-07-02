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

import { Logger, createLogger } from '@augu/logging';
import { Event, Listener } from '../struct';

export default class GlobalListener extends Listener {
  private logger: Logger = createLogger('GlobalListener');
  constructor() {
    super('global');
  }

  @Event('ready')
  async ready() {
    this.logger.info(`Ready! Logged in as ${this.bot.client.user.username}#${this.bot.client.user.discriminator} with ${this.bot.client.guilds.size} guilds.`);
    this.bot.client.editStatus('online', {
      name: 'fs in chat',
      type: 2
    });

    await this.bot.botlists.start();
  }

  @Event('error')
  async error(error: Error, shardID: number) {
    this.logger.error(`Received an error in shard #${shardID}:`, error || new Error('Unknown'));
  }
}