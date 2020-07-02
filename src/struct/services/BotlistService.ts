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

import { HttpClient, middleware } from '@augu/orchid';
import { Logger, createLogger } from '@augu/logging';
import type PressFBot from '../internals/PressFBot';

export default class BotlistService {
  private interval?: NodeJS.Timer;
  private logger: Logger = createLogger('BotlistService');
  private http: HttpClient = new HttpClient();

  constructor(private bot: PressFBot) {
    this.interval = undefined;

    this.http.use(middleware.logging({ binding: this.logger.orchid }));
  }

  async start() {
    if (this.interval) {
      this.logger.warn('Interval has already started.');
      return;
    }

    await this._post();
    this.interval = setInterval(async() => {
      this.logger.info('Now posting stats!');
      await this._post();
    }, 900000);
  }

  stop() {
    if (!this.interval) {
      this.logger.warn('Interval is already destroyed.');
      return;
    }

    clearInterval(this.interval);
    this.logger.info('Botlist posting has been disposed');
  }

  private async _post() {
    if (this.bot.config.environment === 'development' || !this.bot.config.hasOwnProperty('botlists')) {
      this.logger.warn('Bot is in development or doesn\'t have the "botlists" config property set; not posting.');
      if (this.interval) this.stop();

      return;
    } 

    // TODO: bot posting here hoes
  }
}