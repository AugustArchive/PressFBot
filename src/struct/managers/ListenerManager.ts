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

import { findListeners, EventDefinition } from '../decorators';
import { createLogger, Logger } from '@augu/logging';
import { promises as fs } from 'fs';
import type { Listener } from '../internals/Listener';
import { Collection } from '@augu/immutable';
import type PressFBot from '../internals/PressFBot';
import { getPath } from '../../util';
import { join } from 'path';

export default class ListenerManager extends Collection<Listener> {
  private logger: Logger = createLogger('ListenerManager');
  private bot: PressFBot;
  public path: string;

  constructor(bot: PressFBot) {
    super();
  
    this.path = getPath('listeners');
    this.bot = bot;
  }

  private _addToClient(events: EventDefinition[]) {
    for (const event of events) {
      this.logger.info(`Now adding event ${event.event} to the emitter...`);
      const wrapper = async (...args: any[]) => {
        try {
          await event.run(...args);
        } catch (ex) {
          this.logger.error(`Unable to emit event ${event.event}:`, ex);
        }
      };

      this.bot.client.on(event.event, wrapper);
    }
  }

  async start() {
    this.logger.info('Now processing listeners...');

    const files = await fs.readdir(this.path);
    if (!files.length) {
      this.logger.warn(`No files were found in ${this.path}, continuing...`);
      return;
    }

    for (const file of files) {
      const listen = require(join(this.path, file));
      const listener: Listener = listen.default ? new listen.default() : new listen();

      listener.inject(this.bot);
      const definitions = findListeners(listener);
      if (!definitions.length) {
        this.logger.warn('Unable to fetch listeners, continuing...');
        continue;
      }

      listener.addEvents(definitions);
      this.set(listener.name, listener);
      this._addToClient(definitions);

      this.logger.info(`Added ${listener.name} listener to the registry`);
    }
  }
}