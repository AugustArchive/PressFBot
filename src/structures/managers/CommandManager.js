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
const UnionTypeReader = require('../../readers/UnionTypeReader');
const CommandService = require('../services/CommandService');
const { Collection } = require('@augu/immutable');
const { getPath } = require('../../util');
const { Logger } = require('..');
const { join } = require('path');

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
     * List of type readers avaliable
     * @type {Collection<import('../arguments/TypeReader')>}
     */
    this.readers = new Collection();

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
      const command = await import(join(this.path, file));

      /** @type {import('../Command')} */
      const cmd = new command();
      cmd.init(this.bot);

      this.set(cmd.name, cmd);
    }

    const readersDir = getPath('readers');
    const stats2 = await fs.lstat(readersDir);
    if (!stats2.isDirectory()) {
      this.logger.error(`Path "${readersDir}" is not a directory, did you clone the wrong commit?`);
      process.emit('SIGINT');
    }

    const readersArray = await fs.readdir(readersDir);
    if (!readersArray.length) {
      this.logger.error(`Path "${this.path}" doesn't include any commands, did you clone the wrong commit?`);
      process.emit('SIGINT');
    }

    for (const typeReader of readersArray.filter(s => ['UnionTypeReader.js', 'ArrayTypeReader.js'].includes(s))) {
      const TypeReader = await import(join(readersDir, typeReader));

      /** @type {import('../arguments/TypeReader')} */
      const reader = new TypeReader();
      this.readers.set(reader.id, reader);
    }
  }

  /**
   * Gets a type reader
   * @param {string} id The type reader's ID
   */
  getTypeReader(id) {
    if (!id) return undefined;
    if (!id.includes('|')) return this.readers.get(id);

    let type = this.readers.get(id);
    if (type) return type;

    type = new UnionTypeReader(this, id);
    this.readers.set(id, type);

    return type;
  }
};