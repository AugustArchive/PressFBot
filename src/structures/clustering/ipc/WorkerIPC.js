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

const { Client } = require('veza');
const Logger = require('../../Logger');

/**
 * Represents an IPC connection with this cluster,
 * we receive & send useful messages like if the IPC is connected,
 * shard statistics, etc.
 */
module.exports = class WorkerIPC {
  /**
   * Creates a new [WorkerIPC] instance
   * @param {import('../../PressFBot')} bot The bot instance
   * @param {number} id The worker's ID
   */
  constructor(bot, id) {
    /**
     * The logger
     * @private
     * @type {Logger}
     */
    this.logger = new Logger(`IPC: Cluster #${id}`);

    /**
     * The socket
     * @type {import('veza').ClientSocket | null}
     */
    this.socket = null;

    /**
     * The child node
     * @type {import('veza').Client}
     */
    this.node = new Client(`cluster.${id}`);

    /**
     * The bot instance
     * @type {import('../../PressFBot')}
     */
    this.bot = bot;

    /**
     * The worker's ID
     */
    this.id = id;

    this.node
      .on('disconnect', client => this.logger.warn(`Disconnected from ${client.name}?`))
      .on('message', message => this.onMessage.apply(this, [message]))
      .on('error', error => this.logger.error('An unexpected error has occured', error))
      .on('ready', client => this.logger.info(`Connected to node ${client.name}`));
  }

  /**
   * Received when a message has been sent from the Master IPC
   * @param {import('veza').NodeMessage} message The message
   */
  async onMessage(message) {
    const data = message.data;
    switch (data.op) {
      case 'shardinfo': {
        const shards = [];
        const memory = process.memoryUsage();

        for (const shard of this.bot.client.shards.values()) {
          const guilds = this.bot.client.guilds.filter(guild => guild.shard.id === shard.id);
          const users = guilds.reduce((acc, curr) => acc + curr.memberCount, 0);
          const status = shard.status === 'connecting' || shard.status === 'resuming' || shard.status === 'Handshaking' 
            ? 'connecting' 
            : shard.status === 'disconnected' 
              ? 'Disconnected' 
              : 'Online';

          shards.push({
            latency: `${shard.latency}ms`,
            guilds: guilds.length,
            status,
            users,
            id: shard.id
          });
        }

        return message.reply({ 
          success: true, 
          d: {
            cluster: this.id,
            shards,
            heap: memory.heapUsed - memory.heapTotal,
            rss: memory.rss
          }
        });
      }
      case 'restart': return this.restart();
    }
  }

  /**
   * Connects the socket
   */
  async connect() {
    this.socket = await this.node.connectTo(this.bot.config.ipcPort);
  }

  /**
   * Restarts this worker
   */
  async restart() {
    this.logger.warn(`Requesting for worker ${this.id} to be restarted...`);
    const message = await this.socket.send({
      op: 'restart',
      d: this.id
    });

    return message.success;
  }
};