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

/**
 * Represents a [CommandStatisticsManager], which basically
 * tracks command usages, executions, and messages seen. :eyes:
 */
module.exports = class CommandStatisticsManager {
  /**
   * Creates a new [CommandStatisticsManager]
   */
  constructor() {
    /**
     * List of commands usages by the user
     * @type {{ [x: string]: number; }}
     */
    this.commandUsages = {};

    /**
     * How many commands executed
     */
    this.commandsExecuted = 0;

    /**
     * How many messages has been seen :eyes:
     */
    this.messages = 0;
  }

  /**
   * Increment the command usage & executions
   * @param {import('../Command')} cmd The command
   */
  inc(cmd) {
    if (cmd.name === 'shell' || cmd.name === 'exec') return;
    if (!this.commandUsages.hasOwnProperty(cmd.name)) this.commandUsages[cmd.name] = 0;

    this.commandsExecuted++;
    this.commandUsages[cmd.name] = this.commandUsages[cmd.name]++;
  }

  /**
   * Gets the most used command
   */
  getCommandUsages() {
    if (Object.keys(this.commandUsages).length) {
      const command = Object.keys(this.commandUsages)
        .map(key => ({
          key,
          uses: this.commandUsages[key]
        })).sort((first, second) => second.uses - first.uses)[0];

      return {
        command: command.key,
        uses: command.uses
      };
    } else {
      return {
        command: 'None',
        uses: 0
      };
    }
  }
};