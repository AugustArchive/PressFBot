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
import { Collection, Queue } from '@augu/immutable';
import Cluster, { Status } from './struct/Cluster';
import type PressFBot from '../internals/PressFBot';
import { chunkArray } from '../../util';
import { isMaster } from 'cluster';
import MasterIPC from './ipc/MasterIPC';

/**
 * Represents the manager for all clusters
 */
export class ClusterManager extends Collection<Cluster> {
  public clusterCount: number;
  public shardCount!: number;
  private retries: number;
  private logger: Logger;
  private http: HttpClient;
  private ipc!: MasterIPC;
  private bot: PressFBot;

  constructor(bot: PressFBot) {
    super();

    // TODO: Use CPU count when we reached ~5-10k guilds
    this.clusterCount = 2;
    this.retries = 0;
    this.logger = createLogger('ClusterManager');
    this.http = new HttpClient();
    this.bot = bot;

    this.http.use(middleware.logging({ binding: this.logger.orchid }));
  }

  private async _start() {
    this.ipc = new MasterIPC(this.bot);
    this.clusterCount = Math.floor(this.clusterCount);
    this.shardCount = await this._fetchShards();

    this.logger.info(`Spawning ${this.clusterCount} clusters with ${this.shardCount} shards...`);
    const shardArray = [...Array(Math.floor(this.clusterCount * this.shardCount)).keys()];
    const tuple = chunkArray(shardArray, this.clusterCount);
    const failed = new Queue<Cluster>();

    for (let idx = 0; idx < this.clusterCount; idx++) {
      const shards = tuple.shift()!;
      const cluster = new Cluster(this.bot, idx, shards);
      this.set(idx, cluster);

      try {
        await cluster.spawn();
      } catch {
        this.logger.error(`Cluster #${idx} failed on us. Queued for respawn!`);
        failed.add(cluster);
      }
    }

    if (failed.size() > 0) {
      this.logger.warn(`${failed.size()} clusters has failed, now respawning...`);
      this._queueForRespawn(failed);
    } else {
      this.logger.info('Loaded all clusters!');
    }
  }

  private async _fetchShards() {
    try {
      const res = await this.http.request({
        method: 'GET',
        url: 'https://discordapp.com/api/gateway/bot',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${this.bot.config.token}`
        }
      });

      return (res.json()).shards as number;
    } catch(ex) {
      this.logger.error('Unable to fetch shards', ex);
      return 1;
    }
  }

  private async _queueForRespawn(queue: Queue<Cluster>) {
    const failed = new Queue<Cluster>();
    queue.tick(async cluster => {
      try {
        this.logger.warn(`Respawning cluster #${cluster.id}`);
        await cluster.respawn();
      } catch {
        this.logger.error(`Cluster #${cluster.id} still failed to respawn, enqueueing back...`);
        failed.add(cluster);
      }
    });

    if (failed.size() > 0) {
      this.retries++;
      if (this.retries > 5) {
        this.logger.error(`Reached the max tried to respawn, not respawning ${failed.size()} clusters anymore`);
        return;
      } else {
        this._queueForRespawn(failed);
      }
    }
  }

  async spawn() {
    if (isMaster) {
      this.logger.info('Process is master, now spawning clusters...');
      await this._start();
    }
  }

  async restartAll() {
    this.logger.info('Restarting all clusters!');
    for (const cluster of this.values()) await cluster.respawn();
  }

  kill() {
    this.logger.warn('Received to kill all clusters');
    for (const cluster of this.values()) cluster.kill();
  }

  async restart(id: number) {
    const cluster = this.get(id);
    if (cluster) {
      if (cluster.status !== Status.Offline) this.logger.warn(`Cluster ${cluster.id} wasn't connected, restarting anyways`);
      this.logger.info(`Restarting cluster #${cluster.id}`);
      await cluster.respawn();
    } else {
      throw new Error(`Cluster #${id} didn't spawn at all`);
    }
  }
}