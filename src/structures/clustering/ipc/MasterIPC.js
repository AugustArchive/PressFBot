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

const { isMaster } = require('cluster');
const { Logger } = require('../..');
const { Server } = require('veza');

/**
 * The master IPC is the controller of all IPC connections, used in the main bot instance (`PressFBot#ipc`)
 * to request cluster information and other sorts
 */
module.exports = class MasterIPC {
  /**
   * Creates a new [MasterIPC] instance
   * @param {import('../../PressFBot')} bot The bot instance
   */
  constructor(bot) {
    this.logger = new Logger('MasterIPC');
    this.server = new Server('master');
    this.bot = bot;

    this.server
      .on('disconnect', () => this.logger.info('Disconnected the IPC service'))
      .on('connect', () => this.logger.info('Connected the IPC service'))
      .on('message', m => this.onMessage.apply(this, [m]))
      .on('error', error => this.logger.error('Unable to connect the IPC service', error));
  }

  /**
   * Connects to the IPC server
   */
  connect() {
    if (isMaster) {
      this.server.listen(bot.config.ipcPort)
        .then(x => this.logger.info(`Connected as ${x.name} on port ${bot.config.ipcPort}`))
        .catch(this.logger.error);
    }
  }

  /**
   * Event handler for [veza.Server.on('message')]
   * @param {import('veza').NodeMessage} message The message
   */
  onMessage(message) {
    switch (message.data.op) {
      case 'restart_all': return this.restartAll(message);
      case 'restart': return this.restart(message);
      default: return void 0;
    }
  }

  /**
   * Restarts all of the clusters
   * @param {import('veza').NodeMessage} message The message
   */
  async restartAll(message) {
    try {
      await this.bot.clusters.restartAll();
      return message.reply({ success: true });
    } catch(ex) {
      return message.reply({
        success: false,
        d: {
          message: `[MasterIPC | ${ex.name}] ${ex.message}`,
          stack: ex.hasOwnProperty('stack') ? ex.stack : null
        }
      });
    }
  }

  /**
   * Restarts a cluster
   * @param {import('veza').NodeMessage} message The message
   */
  async restart(message) {
    try {
      await this.bot.clusters.restart(message.d);
      return message.reply({ success: true });
    } catch(ex) {
      return message.reply({
        success: false,
        d: {
          message: `[MasterIPC | ${ex.name}] ${ex.message}`,
          stack: ex.hasOwnProperty('stack') ? ex.stack : null
        }
      });
    }
  }

  /**
   * Broadcasts to all of the clusters
   * @param {{ op: 'shard_info' | 'restart'; d?: any }} req The request
   */
  async broadcast(req) {
    const data = await this.server.broadcast(req, {
      receptive: true,
      timeout: 10000
    });

    const errored = data.filter(res => !res.success);
    if (errored.length) {
      throw new Error(errored[0].d.message);
    } else {
      return data.map(res => res.d);
    }
  }
};