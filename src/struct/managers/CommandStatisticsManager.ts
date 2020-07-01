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

import Command from '../internals/Command';

interface CommandUsageObject {
  [x: string]: number;
}

interface MostUsedCommand {
  name: string;
  uses: number;
}

export default class CommandStatisticsManager {
  public commandsExecuted: number;
  public commandUsages: CommandUsageObject;
  public messagesSeen: number;
  public dbCalls: number;

  constructor() {
    this.commandsExecuted = 0;
    this.commandUsages = {};
    this.messagesSeen = 0;
    this.dbCalls = 0;
  }

  inc(cmd: Command) {
    if (!this.commandUsages.hasOwnProperty(cmd.info.name)) this.commandUsages[cmd.info.name] = 0;

    if (!['eval', 'shell'].includes(cmd.info.name)) {
      this.commandUsages[cmd.info.name] = (this.commandUsages[cmd.info.name] || 0) + 1;
      this.commandsExecuted++;
    } else {
      this.commandsExecuted++;
      delete this.commandUsages[cmd.info.name];
    }
  }

  getMostUsedCommand(): MostUsedCommand {
    if (Object.keys(this.commandUsages).length) {
      const command = Object.keys(this.commandUsages)
        .map(key => ({
          key,
          uses: this.commandUsages[key]
        })).sort((first, second) => second.uses - first.uses)[0];

      return {
        name: command.key,
        uses: command.uses
      };
    } else {
      return {
        name: 'None',
        uses: 0
      };
    }
  }
}