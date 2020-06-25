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

import { createLogger, Logger } from '@augu/logging';
import { NodeMessage, Server } from 'veza';
import { IPC, IPCEvents } from '../types';
import type PressFBot from '../../internals/PressFBot';
import { isMaster } from 'cluster';

interface RestartArgs {
  cluster: number;
}

interface ReadyArgs {
  cluster: number;
}

/**
 * The master IPC is the controller of all IPC connections, used in the main bot instance (`PressFBot#ipc`)
 * to request cluster information and other sorts
 */
export default class MasterIPC {
  /** Readonly server instance */
  private readonly server: Server;

  /** Logger instance */
  private logger: Logger;

  /** The bot instance */
  private bot: PressFBot;

  /**
   * Constructs a new instance of the Master IPC
   */
  constructor(bot: PressFBot) {
    this.server = new Server('Master');
    this.logger = createLogger('Master / IPC');
    this.bot = bot;

    if (isMaster) {
      this.logger.info('Now connecting to the service...');
      this.server.listen(9696)
        .then((r) => this.logger.info(`Connected to IPC as ${r.name} on port 9696`))
        .catch(ex => this.logger.error('Unable to connect to the IPC service', ex));
    }

    this._addEvents();
  }

  private _addEvents() {
    this.logger.info('Adding IPC events...');

    this
      .server
      .on('disconnect', () => this.logger.error('Disconnected from IPC service'))
      .on('connect', () => this.logger.info('Connected to IPC service'))
      .on('message', this._onMessage.bind(this))
      .on('error', error => this.logger.error('Unable to connect to IPC service', error));
  }

  private _onMessage(message: NodeMessage) {
    const data = message.data as IPC.Request<any, string>;

    switch (data.op) {
      case IPCEvents.RestartAll: return this._restartAll(message);
      case IPCEvents.Restart: return this._restart(message);
      case IPCEvents.Ready: return this._ready(message);
      default: return void 0;
    }
  }

  private async _restartAll(m: NodeMessage) {
    this.logger.warn('Requested to restart all clusters');

    try {
      await this.bot.restartAll();
      m.reply({ success: true });
    } catch (ex) {
      m.reply({
        success: false,
        d: {
          stacktrace: ex.hasOwnProperty('stack') ? ex.stack : null,
          message: `[Master | ${ex.name}] ${ex.message}`
        }
      });
    }
  }

  private async _restart(message: NodeMessage) {
    const data = message.data as IPC.Request<RestartArgs>;

    try {
      await this.bot.restart(data.d!.cluster);
      message.reply({ success: true });
    } catch (ex) {
      message.reply({
        success: false,
        d: {
          stacktrace: ex.hasOwnProperty('stack') ? ex.stack : null,
          message: `[Master | ${ex.name}] ${ex.message}`
        }
      });
    }
  }

  private _ready(m: NodeMessage) {
    const data = m.data as IPC.Request<ReadyArgs>;
    const cluster = this.bot.clusters.get(data.d!.cluster);

    if (cluster === null) {
      m.reply({
        success: false,
        d: {
          stacktrace: null,
          message: `[Master | UnknownClusterError] Cluster #${data.d!.cluster} doesn't exist?`
        }
      });
    } else {
      cluster.emit('ready');
    }
  }

  /**
   * Broadcasts to all cluster IPC connections
   * @param request The request instance
   * @typeparam `T`: Represents the data packet
   * @typeparam `V`: Represents what kind of OP code to send as
   */
  async broadcast<T = any, V = number>(request: IPC.Request<T, V>): Promise<T[]> {
    const data = await this.server.broadcast(request, {
      receptive: true,
      timeout: 10000
    }) as (IPC.Response<T>)[];

    const errored = data.filter(res => !res.success);
    if (errored.length) {
      const error = errored[0];
      throw new Error((error.d as any).message);
    } else {
      return data.map(res => res.d!);
    }
  }
}