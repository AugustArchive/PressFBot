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
import { createLogger, Logger } from '@augu/logging';
import type PressFBot from '../../internals/PressFBot';

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
  constructor(bot: PressFBot, id: number) {
    this.logger = createLogger(`Cluster #${id} / IPC`);
    this.socket = null;
    this.node = new Client(`Cluster #${id}`);
    this.bot = bot;

    this._addEvents();
  }


}