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

const { EventEmitter } = require('events');
const ShardManager = require('./ShardingManager');
const RestClient = require('./rest/RestClient');
const Constants = require('../util/Constants');
const halt = require('../util/sleep');

module.exports = class WebSocketClient extends EventEmitter {
  /**
   * Creates a new [WebSocketClient] instance
   */
  constructor() {
    super();

    /**
     * Returns the last shard ID
     * @type {number}
     */
    this.lastShardId = 1;

    /**
     * Time we started the connection
     * @type {number}
     */
    this.startedAt = Date.now();

    /**
     * Time we were officially ready at
     * @type {?number}
     */
    this.readyAt = null;

    /**
     * The sharding manager for handling tuples of shards
     * @type {ShardManager}
     */
    this.shards = new ShardManager(this);

    /**
     * If we are ready to be on Discord
     * @type {boolean}
     */
    this.ready = false;

    /**
     * The token of the bot
     * @type {string}
     */
    this.token = process.env.DISCORD_TOKEN;

    /**
     * The Rest client for creating requests to Discord
     * @type {RestClient}
     */
    this.rest = new RestClient(this);

    /**
     * The user
     * @type {import('../entities/User')}
     */
    this.user = null;
  }

  /**
   * Creates a connection to Discord and spawns all shards
   */
  async connect() {
    const shardInfo = await this.getShardInfo();

    this.emit('shardInfo', shardInfo);

    // TODO: maybe switch to etf?
    this.gatewayURL = `${shardInfo.url}/?v=${Constants.GatewayVersion}&encoding=json`;
    this.shardCount = shardInfo.shards;

    if (this.lastShardId === 1) this.lastShardId = shardInfo.shards === 1 ? 1 : shardInfo.shards - 1;

    this.debug(`Now spawning with ${shardInfo.shards} shards.`);
    for (let i = 0; i < this.lastShardId; i++) {
      this.shards.spawn(i);
      await halt(5000);
    }
  }

  /**
   * Gets the shard information for PressFBot
   * @returns {Promise<ShardInfo>} Returns the shard information from Discord
   */
  async getShardInfo() {
    const data = await this.rest.dispatch({
      endpoint: '/gateway/bot',
      method: 'get'
    });

    if (!data.url || !data.shards) throw new TypeError('Missing shard information from Discord');
    if (data.url.includes('?')) data.url = data.url.substring(0, data.url.indexOf('?'));

    if (data.session_start_limit.remaining <= 0) {
      const error = new Error('Exceeded the amount of times to connect to Discord');
      error.resetAfter = date.session_start_limit.reset_after;
      error.name = 'ConnectionRatelimtError';

      this.emit('error', error);
      throw error;
    }

    return {
      shards: data.shards,
      url: data.url
    };
  }

  /**
   * Disconnects all shards from Discord
   */
  disconnect() {
    for (const shard of this.shards.values()) shard.disconnect(false);

    this.debug('Disconnected from Discord, goodbye.');
  }

  /**
   * Sets the status of the bot
   * @param {SendActivityPacket} activity The activity packet
   */
  setStatus(activity) {
    for (const shard of this.shards.values()) shard.send(3, {
      status: activity.status,
      since: activity.status === 'idle' ? Date.now() : 0,
      game: activity.game,
      afk: !!activity.afk
    });
  }

  /**
   * Debugs informaation
   * @param {string} message The message to debug
   */
  debug(message) {
    this.emit('debug', message);
  }

  toString() {
    return `[WebSocketClient "${this.user ? this.user.tag : '[not connected]'}"]`;
  }
};

/**
 * @typedef {object} ShardInfo
 * @prop {number} shards The amount of shards Discord has tell us we can spawn with
 * @prop {string} url The gateway URL
 */
