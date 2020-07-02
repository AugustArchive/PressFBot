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

interface DatabaseExistsArgs {
  exists: boolean;
}

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
      user: bot.config.database.username,
      host: bot.config.database.host,
      port: bot.config.database.port
    });
  }

  private async _check() {
    if (this.checked) {
      this.logger.warn('Database has been already checked.');
      return;
    }

    const result = await this.query<DatabaseExistsArgs>('select exists(SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower(\'pressfbot\'))');
    if (!result!.exists) {
      this.logger.info('Database "pressfbot" doesn\'t exist! Creating it...');
      await Promise.all([this.query('CREATE DATABASE pressfbot'), await this.query(`grant all privileges on database pressfbot to ${this.bot.config.database.username}`)]);
      this.logger.info('Created database "pressfbot!"');
    }

    this.logger.info('Database exists (or has been created), now creating tables...');
    await this.query('CREATE TABLE IF NOT EXISTS users(id varchar(40) NOT NULL, voted boolean NOT NULL);');

    this.checked = true;
    this.logger.info('Database has been checked.');
  }

  async connect() {
    this.client = await this.pool.connect();
    await this._check();
    
    this.connected = true;
    this.logger.info('Connected to PostgreSQL!');
  }

  async dispose() {
    await this.pool.end();
    this.connected = false;
    this.logger.warn('Pool has been destroyed');
  }

  query<T>(query: string | pg.QueryConfig<T[]>) {
    this.bot.statistics.dbCalls++;
    return new Promise<T | null>((resolve, reject) => this.client.query(query).then((result: pg.QueryResult<T>) => {
      if (result.rowCount < 1) return resolve(null);
      else return resolve(result.rows[0]);
    }));
  }
}