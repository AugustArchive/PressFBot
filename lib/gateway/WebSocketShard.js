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
const GatewayEvents = require('./events');
const { Status } = require('../util/Constants');
const WebSocket = require('ws');

/**
 * Represents a [WebSocketShard] instance, which creates a new
 * connection to Discord and connects to it's WebSocket service
 * and this is the service for handling events Discord -> Us
 */
module.exports = class WebSocketShard {
  /**
   * Creates a new [WebSocketShard] instance
   * @param {import('./WebSocketClient')} client The WebSocket client instance
   * @param {number} id The shard's ID
   */
  constructor(client, id) {
    /**
     * List of unavailable guilds
     * @type {Set<string>}
     */
    this.unavailableGuilds = new Set();

    /**
     * The last sequence number before closing
     * @type {number}
     */
    this.closingSequence = 0;

    /**
     * The session ID for resuming connections
     * @type {?string}
     */
    this.sessionID = undefined;

    /**
     * How many attempts we made to connect
     * @type {number}
     */
    this.attempts = 0;

    /**
     * Current status of the shard
     * @type {string}
     */
    this.status = Status.NotConnected;

    /**
     * The client
     * @private
     * @type {import('./WebSocketClient')}
     */
    this.client = client;

    /**
     * The logger of the shard
     * @type {import('@augu/logging').ILogger<'connecting' | 'closed'>}
     */
    this.logger = createLogger({
      namespace: `WS-Shard #${id}`,
      transports: [],
      levels: {
        connecting: '#8635AE',
        closed: '#A93581'
      }
    });

    /**
     * If we acked a heartbeat successfully
     * @type {boolean}
     */
    this.acked = true;

    /**
     * The current sequence number
     * @type {number}
     */
    this.seq = 0;

    /**
     * The ID of the shard
     * @type {number}
     */
    this.id = id;
  }

  /**
   * Returns the ping of the shard
   * @type {number}
   */
  get ping() {
    return this.lastAckedAt ? (this.lastAckedAt - this.lastSentAt) : null;
  }

  /**
   * Connects to Discord
   */
  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.status === Status.Connected) {
      this.logger.warn('We are already connected to Discord!');
      return;
    }

    this.logger.debug(`Creating a new connection to Discord using gateway url "${this.client.gatewayURL}" (${this.sessionID ? 'using old session key' : 'new session'})`);
    this.status = Status.Connecting;
    this.attempts++;

    return this.createConnection();
  }

  /**
   * Disconnects from Discord
   * @param {boolean} [reconnect=true] If we should reconnect or not
   */
  disconnect(reconnect = true) {
    if (!this.socket) return;
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    if (this.socket.readyState !== WebSocket.CLOSED) {
      this.socket.removeListener('close', this.onClose.bind(this));
      try {
        if (reconnect && this.sessionID !== undefined) {
          if (this.socket.readyState === WebSocket.OPEN)
            this.socket.close(4901, 'Reconnect: PressFBot');
          else
            this.socket.terminate();
        } else {
          this.socket.close(1000, 'Reconnect: PressFBot');
        }
      } catch(ex) {
        this.logger.error('Unable to close WebSocket', ex);
      }
    }

    this.status = Status.Disposed;
    this.socket = undefined;
    this.logger.error(`Disconnected from Discord (${reconnect ? 'reconnecting' : 'closed'})`);

    if (this.sessionID !== undefined && this.attempts > 5) {
      this.logger.error('Reached the max threshold to reconnect, not creating new session');
      this.sessionID = undefined;
    }

    if (reconnect) {
      this.logger.info(`Re-connecting to Discord to resume zombified connection (${this.attempts}/5)`);
      if (this.sessionID !== undefined)
        this.client.shards.connect(this.id);
      else {
        this.attempts++;

        if (this.attempts > 5) {
          this.logger.error('Reached the maximium amount of tries to reconnect');
          setTimeout(() => process.exit(1), 3000);
          return;
        }

        setTimeout(() => {
          this.logger.info('Attempting to unzombify this connection');
          this.client.shards.connect(this.id);
        }, 9000);
      }
    } else {
      this.hardReset();
      this.logger.warn(`Shard has reached it's life. (connected -> ${this.status})`);
    }
  }

  /**
   * Sends a packet to Discord
   * @template T The data structure
   * @param {number} op The OPCode to send
   * @param {T} [data] The data to send
   */
  send(op, data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(this.pack({ op, d: data }));
      this.logger.debug(`Sent OPCode "${op} (${Util.getKey(Constants.OPCodes, op) || 'Unknown'})" to Discord with strategy ${this.strategy}`);
    } else {
      this.logger.debug('Connection is non-existent, not sending data');
    }
  }

  /**
   * Resets the shard's status
   * @private
   */
  hardReset() {
    this.attempts = 0;
    this.sessionID = undefined;
    this.seq = 0;
  }
};
