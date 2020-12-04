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

const { createLogger } = require('@augu/logging');
const { Collection } = require('@augu/immutable');
const WebSocketShard = require('./WebSocketShard');
const { Status } = require('../util/Constants');

/** @extends {Collection<WebSocketShard>} */
module.exports = class ShardingManager extends Collection {
  /**
   * Creates a new [ShardingManager] instance
   * @param {import('./WebSocketClient')} client The websocket client to use
   */
  constructor(client) {
    super();

    /**
     * The WebSocket client
     * @private
     * @type {import('./WebSocketClient')}
     */
    this.client = client;

    /**
     * The logger instance
     */
    this.logger = createLogger({
      namespace: 'Sharding',
      transports: []
    });
  }

  /**
   * Returns the ping of the sharding manager
   */
  get ping() {
    return this
      .filter(shards => shards.ping !== null) // filter out shards with `null` pings
      .reduce((a, b) => a + b.ping, 0); // reduce them
  }

  /**
   * Spawns a shard
   * @param {number} id The shard's ID
   */
  spawn(id) {
    if (this.has(id)) {
      const shard = this.get(id);
      if (shard.status === Status.Connected) return;

      return shard.connect();
    }

    const shard = new WebSocketShard(this.client, id);
    this.set(id, shard);

    this.logger.info(`:sparkles: Shard #${id} is now connecting...`);
    return shard.connect();
  }

  /**
   * Disposes a [WebSocketShard] instance
   * @param {WebSocketShard} shard The shard to dispose
   */
  dispose(shard) {
    if (shard.status === Status.Disposed) return;

    shard.disconnect(false);
    shard.status = Constants.ShardStatus.Disposed;
  }

  /**
   * Forcefully re-connect a shard
   * @param {number} id The shard's ID
   */
  connect(id) {
    if (!this.has(id)) return;

    const shard = this.get(id);
    return this.spawn(shard.id);
  }
};
