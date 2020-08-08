/**
 * Copyright (c) 2020 August
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const CommandStatisticsManager = require('./managers/CommandStatisticsManager');
const TimeoutsManager = require('./managers/TimeoutsManager');
const DatabaseManager = require('./managers/DatabaseManager');
const CommandManager = require('./managers/CommandManager');
const { HttpClient } = require('@augu/orchid');
const EventsManager = require('./managers/EventManager');
const { UserAgent } = require('../util/Constants');
const EmbedBuilder = require('./EmbedBuilder');
const RedisClient = require('ioredis');
const { Client } = require('eris');
const { Server } = require('laffey');
const constants = require('../util/Constants');
const Logger = require('./Logger');

module.exports = class PressFBot {
  /**
   * Creates a new [PressFBot] instance
   * @param {EnvConfig} config The configuration
   */
  constructor(config) {
    if (config.laffey_enabled && config.laffey_secret === undefined) throw new TypeError('Missing "LAFFEY_SECRET" in .env');

    /**
     * The configuration
     * @type {Configuration}
     */
    this.config = {
      database: {
        username: config.database_username,
        password: config.database_password,
        host: config.database_host,
        port: config.database_port,
        db: config.database_name
      },
      redis: {
        password: config.redis_password,
        host: config.redis_host,
        port: config.redis_port
      },
      laffey: {
        enabled: config.laffey_enabled,
        secret: config.laffey_secret,
        port: config.laffey_port
      },
      voteLogUrl: config.vote_logs_url,
      owners: config.owners,
      token: config.token,
      env: config.node_env
    };

    /**
     * Basic statistics manager
     * @type {CommandStatisticsManager}
     */
    this.statistics = new CommandStatisticsManager();
    
    /**
     * Manages all timeouts for votes
     * @type {TimeoutsManager}
     */
    this.timeouts = new TimeoutsManager(this);

    /**
     * Manages the database connections
     * @type {DatabaseManager}
     */
    this.database = new DatabaseManager(this);

    /**
     * Manages all commands
     * @type {CommandManager}
     */
    this.commands = new CommandManager(this);

    /**
     * Manages all events for Laffey and Eris
     * @type {EventsManager}
     */
    this.events = new EventsManager(this);

    /**
     * Logger instance
     * @type {Logger}
     */
    this.logger = new Logger('PressFBot');

    /**
     * Discord client
     * @type {Client}
     */
    this.client = new Client(config.token, {
      getAllUsers: true,
      maxShards: 'auto',
      restMode: true
    });

    /**
     * The webhook service (provided by [Laffey])
     * @type {import('laffey').laffey.Server}
     */
    this.webhook = this.config.laffey.enabled ? new Server(this.config.laffey.port, '/webhook', {
      token: this.config.laffey.secret
    }) : undefined;

    /**
     * Redis client
     * @type {import('ioredis').Redis}
     */
    this.redis = new RedisClient(this.config.redis);

    /**
     * Orchid instance OwO
     * @type {HttpClient}
     */
    this.http = new HttpClient({
      defaults: {
        headers: {
          'User-Agent': UserAgent
        }
      }
    });
  }

  /**
   * Starts the bot
   */
  async start() {
    this.logger.info('Loading all miscellaneous stuff...');

    this.redis.once('ready', () => this.logger.info('Connected to Redis!'));
    this.redis.on('wait', () => this.logger.warn('Redis has disconnected unexpectly! Waiting for a new connection...'));

    await this.database.connect();
    await this.commands.load();
    await this.events.load();

    this.logger.info('Loaded all miscellaneous stuff');
    if (this.webhook !== undefined) this.webhook.listen();

    await this.client.connect()
      .then(() => this.logger.info('Now connecting through tubes with Discord O_o'))
      .catch(() => {
        this.logger.error('Unable to connect to Discord');
        process.exit(1);
      });
  }

  /**
   * Returns a new [EmbedBuilder]
   * @param {string} id The user's ID (if specified)
   */
  getEmbed() {
    return new EmbedBuilder()
      .setColor(constants.Color);
  }

  /**
   * Disposes this [PressFBot] instance
   */
  async dispose() {
    await this.database.dispose();
    this.commands.clear();
    this.events.clear();
    this.client.disconnect({ reconnect: false });
    this.redis.disconnect();

    this.logger.warn('Disposed all instances');
  }
};

/**
 * @typedef {object} EnvConfig
 * @prop {string} database_username The database username
 * @prop {string} database_password The database password
 * @prop {string} [redis_password] The password (optional) to connect to Redis
 * @prop {boolean} laffey_enabled If we should use [Laffey] or not
 * @prop {string} vote_logs_url The vote logs url
 * @prop {string} database_host The database host
 * @prop {number} database_port The database port
 * @prop {string} database_name The database's name
 * @prop {string} laffey_secret The secret to authenicate requests for [Laffey]
 * @prop {number} laffey_port The port to create a new [Laffey] instance
 * @prop {string} redis_host The host to connect to Redis
 * @prop {number} redis_port The port to connect to Redis
 * @prop {'development' | 'production'} node_env The environment
 * @prop {string[]} owners The owners of the bot
 * @prop {string} token The token to authenicate to Discord
 * 
 * @typedef {object} Configuration
 * @prop {DatabaseConfig} database The database configuration
 * @prop {string} voteLogUrl The vote logs url
 * @prop {LaffeyConfig} laffey The [Laffey] configuration
 * @prop {RedisConfig} redis The redis configuration
 * @prop {string[]} owners The owners of the bot
 * @prop {string} token The token to authenicate to Discord
 * @prop {'development' | 'production'} env The environment
 * 
 * @typedef {object} DatabaseConfig
 * @prop {string} username The database username
 * @prop {string} password The database password
 * @prop {string} host The database host
 * @prop {number} port The database port
 * @prop {string} name The database's name
 * 
 * @typedef {object} RedisConfig
 * @prop {string} [password] The password (optional) to connect to Redis
 * @prop {string} host The host to connect to Redis
 * @prop {number} port The port to connect to Redis
 * 
 * @typedef {object} LaffeyConfig
 * @prop {boolean} enabled If we should use [Laffey] or not
 * @prop {string} secret The secret to authenicate requests for [Laffey]
 * @prop {number} port The port to create a new [Laffey] instance
 */