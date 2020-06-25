/* eslint-disable no-duplicate-imports */
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

import { Client, ClientSocket, NodeMessage } from 'veza';
import { OPCodes, Misc, IPCEvents } from '../types';
import { createLogger, Logger } from '@augu/logging';
import type PressFBot from '../../internals/PressFBot';
import type { IPC } from '../types';

interface Shards {
  cluster: number;
  shards: Misc.ShardInfo[];
  heap: number;
  rss: number;
}

/**
 * Represents an IPC connection with all clusters,
 * we receive & send useful messages like if the IPC is connected,
 * shard statistics, etc.
 */
export default class ClusterIPC {
  /** The logger instance */
  private logger: Logger;

  /** The client socket */
  private socket: ClientSocket | null;

  /** The ipc node */
  private node: Client;

  /** The bot instance */
  private bot: PressFBot;

  /**
   * Creates a new IPC instance for clusters
   * @param bot The bot instance
   * @param id The cluster's ID
   * @param port The IPC port
   */
  constructor(bot: PressFBot, public id: number) {
    this.logger = createLogger(`Cluster #${id} / IPC`);
    this.socket = null;
    this.node = new Client(`Cluster #${id}`);
    this.bot = bot;

    this._addEvents();
  }

  private _addEvents() {
    this.logger.info('Adding IPC events to cluster...');

    this
      .node
      .on('disconnect', cli => this.logger.error(`Disconnected from ${cli.name}`))
      .on('message', this._onMessage.bind(this))
      .on('error', error => this.logger.error('Unexpected error', error))
      .on('ready', client => this.logger.info(`Connected to node ${client.name}`));
  }

  private async _onMessage(message: NodeMessage) {
    const msg = message.data as IPC.Request<any>;

    switch (msg.op) {
      case OPCodes.ShardInfo: {
        const data: Misc.ShardInfo[] = [];
        const memory = process.memoryUsage();

        for (const shard of this.bot.client.shards.values()) {
          const guilds = this.bot.client.guilds.filter(x => x.shard.id === shard.id);
          const users = guilds.reduce((a, b) => a + b.memberCount, 0);
          let status: Misc.ShardStatus = Misc.ShardStatus.Offline;

          switch (shard.status) {
            case 'connecting':
            case 'handshaking': {
              status = Misc.ShardStatus.Throttling;
            } break;

            case 'disconnected': {
              status = Misc.ShardStatus.Offline;
            } break;

            default: {
              status = Misc.ShardStatus.Online;
            } break;
          }

          data.push({
            latency: `${shard.latency}ms`,
            guilds,
            status,
            users,
            id: shard.id
          });
        }

        const d: Shards = {
          cluster: this.id,
          shards: data,
          heap: memory.heapUsed,
          rss: memory.rss
        };

        message.reply({ success: true, d });
      } break;
    }
  }

  /**
   * Gets the socket instance
   */
  get server() {
    return this.socket!;
  }

  /**
   * Connects the IPC instance
   */
  async connect() {
    this.logger.info('Socket is being connected to port 9696');
    this.socket = await this.node.connectTo(9696);
  }

  /**
   * Restarts a cluster
   * @param id The cluster's ID
   */
  async restart(id: number) {
    this.logger.warn(`Requesting for cluster #${id} to be restarted`);
    const msg = await this.server.send({
      op: IPCEvents.Restart,
      d: {
        cluster: id
      }
    });

    return (msg as IPC.Response<any>).success;
  }

  /**
   * Restarts all clusters
   */
  async restartAll() {
    this.logger.warn('Requesting for all clusters to be restarted');
    const msg = await this.server.send({ op: IPCEvents.RestartAll });

    return (msg as IPC.Response<any>).success;
  }

  /**
   * Sends a ready signal to the master IPC
   * @param id The cluster ID
   */
  async ready(id: number) {
    this.logger.info(`Sending READY signal to cluster #${id}`);
    await this.server.send({ 
      op: IPCEvents.Ready, 
      d: { cluster: id } 
    });
  }
}