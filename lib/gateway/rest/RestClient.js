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

const { RestVersion, UserAgent } = require('../../util/Constants');
const { createLogger } = require('@augu/logging');
const { HttpClient } = require('@augu/orchid');
const { Queue } = require('@augu/immutable');

/**
 * Returns the offset from Discord to us
 * @param {number} date The date
 */
const getApiOffset = (date) => new Date(date).getTime() - Date.now();

/**
 * Calculates the reset date
 * @param {number} reset The reset time
 * @param {number} serverDate The server date for Discord
 */
const calculateResetTime = (reset, serverDate) => new Date(Number(reset) * 1000).getTime() - getApiOffset(serverDate);

module.exports = class RestClient {
  /**
   * Creates a new [RestClient] instance
   * @param {import('../WebSocketClient')} client The client instance
   */
  constructor(client) {
    /**
     * The last dispatched call
     * @type {number}
     */
    this.lastDispatched = -1;

    /**
     * If we are being ratelimited or not
     * @type {boolean}
     */
    this.ratelimited = false;

    /**
     * The remaining requests before we lock this [RestClient]
     * @type {number}
     */
    this.remaining = -1;

    /**
     * If we are handling a request
     * @type {boolean}
     */
    this.handling = false;

    /**
     * The reset time
     * @type {number}
     */
    this.resetTime = -1;

    /**
     * The logger instance
     * @type {import('@augu/logging').ILogger<'request'>}
     */
    this.logger = createLogger({
      namespace: 'RestClient',
      transports: [],
      levels: {
        request: '#859DE4'
      }
    });

    /**
     * The last call we made
     * @type {number}
     */
    this.lastCall = -1;

    /**
     * The request cache
     * @type {Queue<RequestBucket>}
     */
    this.requests = new Queue();

    /**
     * The limit before locking this [RestClient]
     * @type {number}
     */
    this.limit = -1;

    /**
     * The http client
     * @type {HttpClient}
     */
    this.http = new HttpClient({
      defaults: {
        baseUrl: `https://discord.com/api/v${RestVersion}`,
        headers: {
          Authorization: `Bot ${client.token}`,
          'User-Agent': UserAgent
        }
      }
    });

    if (process.env.NODE_ENV === 'development') this.http.use();
  }

  /**
   * Returns the rest client's ping
   */
  get ping() {
    return this.lastCall === -1 ? -1 : (this.lastCall - this.lastDispatched);
  }

  /**
   * If the rest client is locked or not
   * @type {boolean}
   */
  get locked() {
    return (this.remaining <= 0 && Date.now() < this.resetTime);
  }

  /**
   * Dispatch a new request to Discord
   * @param {Omit<RequestBucket, 'resolve' | 'reject'>} options The request options
   */
  dispatch(options) {
    return new Promise((resolve, reject) => {
      /** @type {RequestBucket} */
      const bucket = {
        endpoint: options.endpoint,
        headers: options?.headers ?? {},
        resolve,
        reject,
        method: options.method,
        data: options?.data ?? null
      };

      if (this.locked) {
        const time = this.resetTime + 500 - Date.now();
        this.emit('locked', time);

        return reject(new Error('Locked from making anymore requests'));
      }

      this.requests.add(bucket);
      this.handle();
    });
  }

  /**
   * Handles the request queue
   * @private
   * @returns {Promise<void>}
   */
  handle() {
    if (this.handling || this.requests.size() === 0) return;

    const request = this.requests.shift();
    return this
      .execute(request)
      .then(() => {
        this.lastDispatched = Date.now();
        this.handling = false;

        this.handle();
      }).catch(error => this.logger.error(`unable to make request to "${request.method} ${request.endpoint}"`, error));
  }

  /**
   * Executes a new request
   * @param {RequestBucket} request The request
   * @returns {Promise<any>} Returns the data from Discord
   */
  async execute(request) {
    if (this.ratelimited) return request.reject(new Error('Being ratelimited, execution paused'));

    if (!['get', 'head'].includes(request.method) && !request.headers.hasOwnProperty('Content-Type'))
      request.headers['Content-Type'] = 'application/json';

    try {
      const res = await this.http.request({
        headers: request.headers,
        method: request.method,
        data: request.data,
        url: request.endpoint
      });

      if (res.statusCode !== 204 && res.isEmpty) {
        this.logger.debug(':thinking: payload is missing?');
        return request.resolve(null);
      }

      this.lastCall = new Date();
      if (res.statusCode === 204) return request.resolve();

      const resetTime = resp.headers['x-ratelimit-reset'];
      const serverDate = resp.headers['date'];
      const remaining = resp.headers['x-ratelimit-remaining'];

      this.resetTime = resetTime && !Array.isArray(resetTime) ? calculateResetTime(Number(resetTime), serverDate) : Date.now();
      this.remaining = remaining && !Array.isArray(remaining) ? Number(remaining) : -1;

      if (res.headers['x-ratelimit-global']) await new Promise(resolve => setTimeout(resolve, res.headers['retry-after']));

      const data = res.json();
      if (res.statusCode === 429) {
        this.logger.error(`being ratelimited on "${request.method} ${request.endpoint}"!`);
        if (process.env.NODE_ENV === 'development') this.logger.debug('-=- ratelimit info -=-', {
          retryAfter: (Date.now() - Number(Math.floor(res.headers['x-ratelimti-reset']))) * 1000,
          endpoint: request.endpoint,
          method: request.method,
          global: Boolean(res.headers['x-ratelimit-global']),
          reset: Number(Math.floor(resp.headers['x-ratelimit-reset']))
        });

        this.ratelimited = true;
        await new Promise(resolve => setTimeout(resolve, res.headers['retry-after']));
        return this.execute(request);
      }

      // cloudflare meme lol
      if (res.statusCode === 502) {
        this.logger.debug('received 502 on discord, thanks cloudflare!');
        return request.reject(new Error('CloudFlare is being a meme, thanks Discord.'));
      }

      this.logger.request(`${request.method} ${request.url}: ${res.status} | ~${this.ping}ms`);
      return data.hasOwnProperty('message') ? request.reject(new Error(data.message)) : request.resolve(data);
    } catch (ex) {
      return request.reject(ex);
    }
  }
};

/**
 * @typedef {object} RequestBucket
 * @prop {string} endpoint The endpoint to use
 * @prop {{ [x: string]: any }} [headers] Any additional headers to add
 * @prop {(value: any | PromiseLike<any>) => void} resolve The resolver function
 * @prop {(error?: Error) => void} reject The rejecter function
 * @prop {import('@augu/orchid').HttpMethod} method The HTTP method
 * @prop {any} [data] The data
 */
