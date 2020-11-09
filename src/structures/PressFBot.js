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
const CommandManager = require('./managers/CommandManager');
const BotlistService = require('./services/BotlistService');
const { HttpClient } = require('@augu/orchid');
const EventsManager = require('./managers/EventManager');
const { UserAgent } = require('../util/Constants');
const EmbedBuilder = require('./EmbedBuilder');
const RedisClient = require('ioredis');
const { Client } = require('eris');
const { Server } = require('laffey');
const constants = require('../util/Constants');
const Logger = require('./Logger');
const SentryManager = require('./managers/SentryManager');

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
      redis: {
        password: config.REDIS_PASSWORD,
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        db: config.REDIS_DB_ID || 2
      },
      laffey: {
        enabled: config.LAFFEY_ENABLED,
        secret: config.LAFFEY_SECRET,
        port: config.LAFFEY_PORT
      },
      botlists: {
        boats: config.hasOwnProperty('BOATS_TOKEN') ? config.BOATS_TOKEN : undefined
      },
      voteLogUrl: config.VOTE_LOGS_URL,
      sentryDSN: config.SENTRY_DSN,
      debugInfo: config.DEBUG_INFO,
      owners: config.OWNERS,
      token: config.TOKEN,
      env: config.NODE_ENV
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
     * The botlists service
     * @type {BotlistService}
     */
    this.botlists = new BotlistService(this);

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
     * Sentry manager if enabled
     * @type {import('./managers/SentryManager')}
     */
    this.sentry = config.SENTRY_DSN !== undefined
      ? new SentryManager(this)
      : undefined;

    /**
     * Discord client
     * @type {Client}
     */
    this.client = new Client(config.TOKEN, {
      getAllUsers: true,
      maxShards: 'auto',
      restMode: true
    });

    /**
     * If the bot is running under a Docker container
     * @type {boolean}
     */
    this.docker = process.env.hasOwnProperty('DOCKER_CONTAINER');

    /**
     * The webhook service (provided by [Laffey])
     * @type {import('laffey').Server}
     */
    this.webhook = this.config.laffey.enabled
      ? new Server(this.config.laffey.port, '/webhook', { token: this.config.laffey.secret })
      : undefined;

    /**
     * If the bot is ready to be used with Discord
     * @type {boolean}
     */
    this.ready = false;

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
    await this.commands.load();
    await this.events.load();

    if (this.webhook !== undefined) this.webhook.listen();
    if (this.sentry !== undefined) this.sentry.install();

    await this.client.connect()
      .then(() => {
        this.logger.info('Now connecting through tubes with Discord');
        this.client.editStatus('idle', {
          name: 'the systems boot up... ✨',
          type: 3
        });
      })
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
  dispose() {
    if (this.webhook !== undefined) this.webhook.close();

    this.commands.clear();
    this.events.clear();
    this.client.disconnect({ reconnect: false });
    this.redis.disconnect();

    this.logger.warn('Disposed all instances');
  }
};

/**
 * @typedef {object} EnvConfig
 * @prop {string} [REDIS_PASSWORD] The password (optional) to connect to Redis
 * @prop {boolean} LAFFEY_ENABLED If we should use [Laffey] or not
 * @prop {string} VOTE_LOGS_URL The vote logs url
 * @prop {string} [BOATS_TOKEN] The token to post to discord.boats
 * @prop {string} [SENTRY_DSN] The DSN url for Sentry, optional
 * @prop {boolean} [DEBUG_INFO] If we should log debug info, optional
 * @prop {string} LAFFEY_SECRET The secret to authenicate requests for [Laffey]
 * @prop {number} LAFFEY_PORT The port to create a new [Laffey] instance
 * @prop {string} REDIS_HOST The host to connect to Redis
 * @prop {number} REDIS_PORT The port to connect to Redis
 * @prop {'development' | 'production'} NODE_ENV The environment
 * @prop {string[]} OWNERS The owners of the bot
 * @prop {string} TOKEN The token to authenicate to Discord
 *
 * @typedef {object} Configuration
 * @prop {string} voteLogUrl The vote logs url
 * @prop {string} sentryDSN The sentry DSN, optional
 * @prop {boolean} debugInfo If we should log debug info, optional
 * @prop {BotlistConfig} botlists Botlists configuration OwO
 * @prop {LaffeyConfig} laffey The [Laffey] configuration
 * @prop {RedisConfig} redis The redis configuration
 * @prop {string[]} owners The owners of the bot
 * @prop {string} token The token to authenicate to Discord
 * @prop {'development' | 'production'} env The environment
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
 *
 * @typedef {object} BotlistConfig
 * @prop {string} [boats] The discord.boats token
 */
