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
import { fork, Worker } from 'cluster';
import type PressFBot from '../../internals/PressFBot';
import { OPCodes } from '../types';
import { sleep } from '../../../util';

export enum Status {
  Online = 'online',
  Offline = 'offline',
  NotReady = 'not.ready'
}

/**
 * Represents a "cluster" or a chunk of code to run on a CPU core.
 * 
 * Useful for huge bots to run on more then 1 CPU core and other stuff,
 * read [here](https://nodejs.org/api/cluster.html#cluster_cluster) for more information.
 * 
 * We use `this#ClusterIPC` to send/receive messages from the master IPC to see if we are ready
 * or not and other stuff. We use `veza` to actually receive messages.
 * 
 * How it works is, it's like we gather shard information from Discord (`ClusterManager#_fetchShards`),
 * use the amount of CPU cores we have on this dedicated system (**[os](https://nodejs.org/api/os.html)#cpus**),
 * spawn all instances (**[cluster](https://nodejs.org/api/cluster.html)#fork**)
 */
export default class Cluster {
  /** Logger instance for this cluster */
  private logger: Logger;

  /** The worker instance */
  private worker?: Worker;

  /** The status of the cluster */
  public status: Status;

  /** The amount of shards we allocated for this cluster */
  public shards: number[];

  /** The bot instance */
  private bot: PressFBot;

  /** The cluster's ID */
  public id: number;

  /**
   * Constructs a new instance of this Cluster
   * @param bot The bot instance
   * @param id The cluster's ID
   * @param shards The amount of shards we have allocated for this cluster
   */
  constructor(bot: PressFBot, id: number, shards: number[]) {
    this.logger = createLogger(`Cluster #${id}`);
    this.status = Status.NotReady;
    this.shards = shards;
    this.bot = bot;
    this.id = id;
  }

  kill() {
    if (this.worker) {
      this.logger.warn('Requested to kill this cluster');
      this.worker.removeListener('exit', this._onExited.bind(this));
      this.worker.kill();
    } else {
      this.logger.warn('Cluster doesn\'t have a Worker attached?');
    }
  }

  async respawn() {
    this.logger.info('Requested to respawn this cluster');

    this.kill();
    await sleep(30000);
    await this.spawn();
  }

  async spawn() {
    this.logger.info(`Initialising cluster #${this.id}! (Serving shards ${this.shards.join(', ')} out of ${this.bot.cluster.clusterCount} clusters)`);
    this.worker = fork({
      CLUSTER_SHARDS: this.shards,
      CLUSTER_ID: this.id
    });

    this.worker.once('exit', this._onExited.bind(this));
    this.worker.once('online', this._online.bind(this));

    await sleep(5000);
  }
  
  setStatus(type: 'offline' | 'online') {
    let status: Status;
    switch (type) {
      case 'online': {
        status = Status.Online;
      } break;

      case 'offline': {
        status = Status.Offline;
      } break;

      default: {
        status = Status.Offline;
      }
    }

    this.status = status;
  }

  private async _onExited(code: number, signal: string) {
    this.setStatus('offline');
    this.worker = undefined;
    
    this.logger.warn(`Worker for cluster has exited with code ${code} and signal ${signal}, now respawning...`);
    await this.respawn();
  }

  private _online() {
    this.logger.info(`Worker #${this.worker!.id} has spawned`);
    this.setStatus('online');
  }
}