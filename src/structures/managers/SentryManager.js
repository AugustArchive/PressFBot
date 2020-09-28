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

const { getCommitHash } = require('../../util');
const { version } = require('../../../package.json');
const Sentry = require('@sentry/node');
const Logger = require('../Logger');
const os = require('os');

/**
 * Represents a [SentryManager], to handle all Sentry exceptions
 */
module.exports = class SentryManager {
  /**
   * Creates a new [SentryManager] instance
   * @param {import('../PressFBot')} bot The bot instance
   */
  constructor(bot) {
    /**
     * The logger instance
     * @private
     * @type {import('../Logger')}
     */
    this.logger = new Logger('Sentry');

    /**
     * The bot instance
     * @private
     * @type {import('../PressFBot')}
     */
    this.bot = bot;
  }

  /**
   * Installs Sentry for PressFBot
   */
  install() {
    if (this.bot.config.sentryDSN === undefined) return;

    this.logger.info('Installing Sentry...');
    Sentry.init({
      tracesSampleRate: 1.0, // let's get all traces then
      release: `v${version} (${getCommitHash() || 'unknown'})`,
      dsn: this.bot.config.sentryDSN
    });

    const user = os.userInfo();
    Sentry.configureScope(scope => {
      scope.setTag('project.environment', this.bot.config.env);
      scope.setTag('project.version', version);
      scope.setTag('project.commit', getCommitHash() || 'unknown');
      scope.setTag('system.user', user.username);
      scope.setTag('system.os', process.platform);
    });

    this.logger.info('Installed Sentry with tags! Call SentryManager.testException to send a test exception!');
  }

  /**
   * Tests the Sentry instance
   */
  testException() {
    this.capture(new Error('Test!'));
  }

  /**
   * Captures any exceptions and sends it to Sentry
   * @param {Error} error The error to send
   */
  capture(error) {
    Sentry.captureException(error);
  }
};
