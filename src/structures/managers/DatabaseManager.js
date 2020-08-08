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

const { Dialect, pipelines } = require('@augu/maru');
const Logger = require('../Logger');

/**
 * Represents a [DatabaseManager], which handles database
 * executions OWO
 */
module.exports = class DatabaseManager {
  /**
   * Creates a new [DatabaseManager]
   * @param {import('../PressFBot')} bot The bot instance
   */
  constructor(bot) {
    /**
     * The dialect instance
     */
    this.dialect = new Dialect({
      activeConnections: 3,
      ...bot.config.database
    });

    /**
     * The logger
     */
    this.logger = new Logger('Database');
  }

  /**
   * If we are connected
   */
  get connected() {
    return this.connection.connected;
  }

  /**
   * Connects to PostgreSQL
   */
  async connect() {
    this.logger.info('Now connecting to PostgreSQL...');

    this.connection = this.dialect.createConnection();
    await this.connection.connect();

    this.logger.info('We are connected to PostgreSQL! Now creating tables (if they do not exist)');
    await this.connection.query(pipelines.CreateTable('users', {
      values: {
        voted: {
          nullable: false,
          primary: false,
          type: 'boolean'
        },
        times: {
          nullable: false,
          primary: false,
          type: 'number'
        },
        id: {
          nullable: false,
          primary: true,
          type: 'string'
        }
      }
    }), false);

    await this.connection.query(pipelines.CreateTable('guilds', {
      values: {
        legacy: {
          nullable: false,
          primary: false,
          type: 'boolean'
        },
        id: {
          nullable: false,
          primary: true,
          type: 'string'
        }
      }
    }), false);
    
    this.logger.info('Created tables if they didn\'t exist!');
  }

  /**
   * Disposes this instance
   */
  async dispose() {
    if (!this.connected) {
      this.logger.warn('Not even connected?');
      return;
    }

    await this.dialect.destroy();
  }

  /**
   * Gets the user
   * @param {string} id The user's ID
   * @returns {Promise<User | null>} The user instance or `null` if not found
   */
  getUser(id) {
    return this.connection.query(pipelines.Select('users', ['id', id]), false);
  }

  /**
   * Creates a user
   * @param {string} id The user's ID
   */
  createUser(id) {
    return this.connection.query(pipelines.Insert({
      values: {
        voted: false,
        id
      },
      table: 'users'
    }), false);
  }

  /**
   * Update the `voted` attribute
   * @param {string} id The user's ID
   * @param {boolean} bool The boolean
   */
  setVote(id, bool) {
    return this.connection.query(pipelines.Update({
      values: { voted: bool },
      query: ['id', id],
      table: 'users',
      type: 'set'
    }), false);
  }

  /**
   * Increments the `times` attribute
   * @param {string} id The user's ID
   */
  async incrementTimes(id) {
    const user = await this.getUser(id);
    let times = 0;

    if (user === null) {
      await this.createUser(id);
      const u = await this.getUser(id);

      (times = u.times);
    } else {
      (times = user.times);
    }

    return this.connection.query(pipelines.Update({
      values: { times: times++ },
      query: ['id', id],
      table: 'users',
      type: 'set'
    }), false);
  }

  /**
   * Gets a guild
   * @param {string} id The guild's ID
   * @returns {Promise<Guild | null>}
   */
  getGuild(id) {
    return this.connection.query(pipelines.Select('guilds', ['id', id]));
  }

  /**
   * Creates a new guild
   * @param {string} id The guild's ID
   */
  createGuild(id) {
    return this.connection.query(pipelines.Insert({
      values: {
        legacy: true,
        id
      },
      table: 'guilds'
    }));
  }
};

/**
 * @typedef {object} User The user model
 * @prop {boolean} voted If the user has voted or not
 * @prop {number} times How many times they voted
 * @prop {string} id The user's ID
 * 
 * @typedef {object} Guild The guild model
 * @prop {boolean} legacy If legacy mode is enabled
 * @prop {string} id The guild's ID
 */