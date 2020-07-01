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

import { createLogger, Logger } from '@augu/logging';
import type PressFBot from '../internals/PressFBot';
import pg from 'pg';

export default class DatabaseManager {
  public connected: boolean = false;
  private client!: pg.PoolClient;
  private logger: Logger;
  public checked: boolean = false;
  public pool: pg.Pool;

  constructor(private bot: PressFBot) {
    this.logger = createLogger('Database [PostgreSQL]', { file: './logs/database.log' });
    this.pool = new pg.Pool({ 
      password: bot.config.database.password,
      user: bot.config.database.user,
      host: bot.config.database.host,
      port: bot.config.database.port
    });
  }

  private async _check() {
    if (this.checked) {
      this.logger.warn('Database has been already checked.');
      return;
    }

    const result = await this.query('select exists(SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower(\'pressfbot\'))');
    console.log(result);

    this.checked = true;
    this.logger.info('Database has been checked.');
  }

  async connect() {
    if (this.connected) {
      this.logger.warn('Pool is already connected, why connect again?');
      return;
    }

    this.client = await this.pool.connect();
    this.connected = true;
    this.logger.info('Connected to PostgreSQL, doing basic checks...');

    await this._check();
  }

  async dispose() {
    if (!this.connected) {
      this.logger.warn('Pool is already disconnected, why dispose an instance again?');
      return;
    }

    await this.pool.end();
    this.connected = false;

    this.logger.warn('Pool has been destroyed');
  }

  query<T>(query: string | pg.QueryConfig<T[]>) {
    this.bot.statistics.dbCalls++;
    return new Promise<T>((resolve, reject) => this.client.query(query).then((result: pg.QueryResult<T>) => {
      if (result.rowCount < 1) return reject(new Error('Result was not found'));
      else return resolve(result.rows[0]);
    }));
  }
}