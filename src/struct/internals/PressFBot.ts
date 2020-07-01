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

import { Logger, createLogger } from '@augu/logging';
import CommandStatsManager from '../managers/CommandStatisticsManager';
import { ClusterManager } from '../clustering';
import { EmbedBuilder } from './EmbedBuilder';
import DatabaseManager from '../managers/DatabaseManager';
import ListenerManager from '../managers/ListenerManager';
import ModuleManager from '../managers/ModuleManager';
import { Client } from 'eris';

export interface Config {
  database: DatabaseConfig;
  token: string;
}

interface DatabaseConfig {
  username: string;
  password: string;
  port: number;
  host: string;
}

export default class PressFBot {
  public statistics: CommandStatsManager;
  public database: DatabaseManager;
  public modules: ModuleManager;
  public cluster: ClusterManager;
  public events: ListenerManager;
  public logger: Logger;
  public config: Config;
  public client: Client;

  constructor(config: Config) {
    this.statistics = new CommandStatsManager();
    this.database = new DatabaseManager(this);
    this.modules = new ModuleManager(this);
    this.cluster = new ClusterManager(this);
    this.logger = createLogger('PressFBot', { file: './logs/bot.log' });
    this.events = new ListenerManager(this);
    this.config = config;
    this.client = new Client(config.token, {
      maxShards: 'auto',
      intents: ['guilds', 'guildMessages']
    });
  }

  async start() {
    this.logger.info('Starting up instance...');
    await new Promise(e => setTimeout(e, 2000));

    this.logger.info('Loading up modules...');
    await this.modules.start();

    this.logger.info('Loaded modules! Now loading listeners...');
    await this.events.start();

    this.logger.info('Loaded listeners! Now booting up clusters...');
    await this.cluster.spawn();

    this.logger.info('Loaded clusters! Now connecting to Discord!');
    await this.client.connect()
      .then(() => this.logger.info('Now authorizing with Discord using WebSockets...'));
  }

  getEmbed() {
    return new EmbedBuilder()
      .setColor(0x636366);
  }
}