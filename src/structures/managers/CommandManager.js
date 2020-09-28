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

const { promises: fs } = require('fs');
const CommandService = require('../services/CommandService');
const { Collection } = require('@augu/immutable');
const { getPath } = require('../../util');
const { join } = require('path');
const Logger = require('../Logger');

/**
 * Represents a manager for handling commands and type readers
 * @extends {Collection<import('../Command')>}
 */
module.exports = class CommandManager extends Collection {
  /**
   * Creates a new [CommandManager] instance
   * @param {import('../PressFBot')} bot The bot instance
   */
  constructor(bot) {
    super();

    /**
     * Service for handling all command executions
     * @type {CommandService}
     */
    this.service = new CommandService(bot);

    /**
     * Logger
     * @private
     * @type {Logger}
     */
    this.logger = new Logger('Commands');

    /**
     * The path to the commands directory
     * @type {string}
     */
    this.path = getPath('commands');

    /**
     * The bot instance
     * @type {import('../PressFBot')}
     */
    this.bot = bot;
  }

  /**
   * Starts processing all commands
   */
  async load() {
    const stats = await fs.lstat(this.path);
    if (!stats.isDirectory()) {
      this.logger.error(`Path "${this.path}" wasn't a directory, did you clone the wrong commit?`);
      process.emit('SIGINT');
    }

    const files = await fs.readdir(this.path);
    if (!files.length) {
      this.logger.error(`Path "${this.path}" doesn't include any commands, did you clone the wrong commit?`);
      process.emit('SIGINT');
    }

    for (const file of files) {
      const modules = await fs.readdir(join(this.path, file));
      modules.forEach(mod => {
        const command = require(join(this.path, file, mod));

        /** @type {import('../Command')} */
        const cmd = new command();
        cmd.init(this.bot);
  
        this.set(cmd.name, cmd);
      });
    }
  }
};
