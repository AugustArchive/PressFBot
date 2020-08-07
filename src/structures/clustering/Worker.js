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

const { Logger } = require('..');
const WorkerIPC = require('./ipc/WorkerIPC');
const { sleep } = require('../../util');
const { fork } = require('cluster');

/**
 * Represents a cluster [worker], which is basically
 * a worker process or a chunk of the bot running on any CPU core.
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
module.exports = class Worker {
  /**
   * Creates a new [Worker] instance
   * @param {import('../PressFBot')} bot The bot instance
   * @param {number} id The worker ID
   * @param {number[]} shards Tuple of shards
   */
  constructor(bot, id, shards) {
    /**
     * The logger
     * @private
     * @type {Logger}
     */
    this.logger = new Logger(`Cluster #${this.id}`);

    /**
     * The status of the worker
     * @type {'not.ready' | 'online' | 'dead'}
     */
    this.status = 'not.ready';

    /**
     * The tuple of shards this worker is on
     * @type {number[]}
     */
    this.shards = shards;

    /**
     * The bot instance
     * @private
     * @type {import('../PressFBot')}
     */
    this.bot = bot;

    /**
     * IPC connection
     * @private
     * @type {WorkerIPC}
     */
    this.ipc = new WorkerIPC(bot);

    /**
     * The worker's ID
     * @type {number}
     */
    this.id = id;
  }

  /**
   * Override [Object.toString]
   */
  toString() {
    return `[${this.status === 'not.ready' || this.status === 'dead' ? '-' : '+'} Worker #${this.id}]`;
  }

  /**
   * Kills the worker
   */
  kill() {
    if (this.worker) {
      this.logger.warn('Requested to kill this cluster');
      this.worker.removeListener('exit', this.onexit.bind(this));
      this.worker.kill();

      this.status = 'dead';
    } else {
      this.logger.warn('Cluster doesn\'t include a Worker attached?');
    }
  }

  /**
   * Respawns the cluster and spawns it again
   */
  async respawn() {
    this.kill();

    await sleep(5000);
    await this.spawn();
  }
  
  /**
   * Spawns the worker
   */
  async spawn() {
    this.logger.info(`Now initalising cluster #${this.id} with ${this.shards.join(', ')} shards spawning...`);
    this.worker = fork({
      CLUSTER_SHARDS: this.shards.join(', '),
      CLUSTER_ID: this.id
    });

    this.worker.once('exit', this.onexit.bind(this));
    this.status = 'online';

    await this.ipc.connect();
    await sleep(5000);
  }

  /**
   * Event handler for [Worker.once('exit')]
   * @param {number} code The code the worker sent out
   * @param {string} [signal] The signal the worker sent out
   */
  async onexit(code, signal) {
    this.status = 'dead';
    this.worker = undefined;

    this.logger.warn(`Cluster has died with code ${code}${signal ? ` with signal ${signal}` : ''}, now respawning...`);
    await this.respawn();
  }
};