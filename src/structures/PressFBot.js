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
const ClusteringManager = require('./managers/ClusteringManager');
const TimeoutsManager = require('./managers/TimeoutsManager');
const DatabaseManager = require('./managers/DatabaseManager');
const CommandManager = require('./managers/CommandManager');
const EventsManager = require('./managers/EventManager');
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
    if (this.config.laffey.enabled && this.config.laffey.secret === undefined) throw new TypeError('Missing "LAFFEY_SECRET" in .env');

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
      owners: config.owners,
      token: config.token
    };

    /**
     * Basic statistics manager
     * @type {CommandStatisticsManager}
     */
    this.statistics = new CommandStatisticsManager();

    /**
     * Manages all clusters
     * @type {ClusteringManager}
     */
    this.clusters = new ClusteringManager(this);

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
      restMode: true,
      intents: ['guilds', 'guildMessages', 'guildMembers']
    });

    /**
     * The webhook service (provided by [Laffey])
     * @type {import('laffey').laffey.Server}
     */
    this.webhook = this.config.laffey.enabled ? new Server(this.config.laffey.port, '/', {
      token: this.config.laffey.secret
    }) : undefined;

    /**
     * Redis client
     * @type {import('ioredis').Redis}
     */
    this.redis = new RedisClient(this.config.redis);
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

    this.logger.info('Loaded all miscellaneous stuff, now loading clusters...');
    await this.clusters.spawn();
  }

  /**
   * Returns a new [EmbedBuilder]
   */
  getEmbed() {
    return new EmbedBuilder()
      .setColor(constants.Color);
  }
};

/**
 * @typedef {object} EnvConfig
 * @prop {string} database_username The database username
 * @prop {string} database_password The database password
 * @prop {string} [redis_password] The password (optional) to connect to Redis
 * @prop {boolean} laffey_enabled If we should use [Laffey] or not
 * @prop {string} database_host The database host
 * @prop {number} database_port The database port
 * @prop {string} database_name The database's name
 * @prop {string} laffey_secret The secret to authenicate requests for [Laffey]
 * @prop {number} laffey_port The port to create a new [Laffey] instance
 * @prop {string} redis_host The host to connect to Redis
 * @prop {number} redis_port The port to connect to Redis
 * @prop {string[]} owners The owners of the bot
 * @prop {string} token The token to authenicate to Discord
 * 
 * @typedef {object} Configuration
 * @prop {DatabaseConfig} database The database configuration
 * @prop {LaffeyConfig} laffey The [Laffey] configuration
 * @prop {RedisConfig} redis The redis configuration
 * @prop {string[]} owners The owners of the bot
 * @prop {string} token The token to authenicate to Discord
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