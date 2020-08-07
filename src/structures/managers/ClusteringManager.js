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

const { HttpClient, middleware } = require('@augu/orchid');
const { version, repository } = require('../../util/Constants');
const { Collection } = require('@augu/immutable');
const { chunkArray } = require('../../util');
const { isMaster } = require('cluster');
const Logger = require('../Logger');
const Worker = require('../clustering/Worker');

/**
 * Represents the manager for all clusters
 */
module.exports = class ClusteringManager {
  /**
   * Creates a new [ClusteringManager] instace
   * @param {import('../PressFBot')} bot The bot instance
   */
  constructor(bot) {
    /**
     * The cluster count
     * @type {number}
     */
    this.clusterCount = 1;

    /**
     * The workers as a collection
     * @type {Collection<import('../clustering/Worker')>}
     */
    this.workers = new Collection();

    /**
     * How many retries it took to connect a cluster
     * @type {number}
     */
    this.retries = 0;

    /**
     * The logger
     * @private
     * @type {Logger}
     */
    this.logger = new Logger('Clustering');

    /**
     * The HTTP client for getting shards
     * @type {HttpClient}
     */
    this.http = new HttpClient({
      defaults: {
        baseUrl: 'https://discord.com/api',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `PressFBot (${repository}, v${version})`
        }
      }
    });

    /**
     * The bot instance
     * @type {import('../PressFBot')}
     */
    this.bot = bot;

    if (bot.config.env === 'development') {
      this.http.use(middleware.logging({
        binding: (_, __, message) => message,
        useConsole: false,
        caller: (level, message) => this.logger[level].apply(this.logger, [message])
      }));
    }
  }

  /**
   * Starts the clustering queue
   */
  async _start() {
    this.clusterCount = Math.floor(this.clusterCount);
    this.shardCount = await this.fetchShardCount();

    this.logger.info(`Spawning ${this.clusterCount} clusters with ${this.shardCount} shards...`);
    const tuple = [...Array(Math.floor(this.clusterCount * this.shardCount)).keys()];
    const shardArray = chunkArray(tuple, this.clusterCount);

    for (let i = 0; i < this.clusterCount; i++) {
      const shards = shardArray.shift();
      const worker = new Worker(this.bot, i, shards);

      this.workers.set(i, worker);
      worker.spawn();
    }
  }

  /**
   * Fetches the shard count
   * @returns {Promise<number>} Number of shards
   */
  async fetchShardCount() {
    return this.http.request({
      headers: {
        Authorization: `Bot ${this.bot.config.token}`
      },
      method: 'get',
      url: '/gateway/bot'
    }).then(res => {
      const data = res.json();
      return data.shards;
    }).catch(() => 1);
  }

  /**
   * Spawns the clusters
   */
  async spawn() {
    if (isMaster) {
      await this._start();
    } else {
      this.logger.info('Spawned as a worker! Now connecting to Discord...');
      await this.bot.client.connect();
    }
  }

  /**
   * Restarts all of the clusters
   */
  async restartAll() {
    for (const cluster of this.workers.values()) await cluster.respawn();
  }

  /**
   * Kills all clusters
   */
  kill() {
    for (const cluster of this.workers.values()) cluster.kill();
  }

  /**
   * Restarts a worker by it's ID
   * @param {number} id The worker's ID
   */
  async restart(id) {
    if (this.workers.has(id)) {
      const worker = this.workers.get(id);
      if (worker.status === 'not.ready' || worker.status === 'dead') this.logger.warn(`Worker #${id} is already dead or not connected?`);
      await worker.respawn();
    } else {
      throw new TypeError(`Cluster #${id} doesn't exist`);
    }
  }
};