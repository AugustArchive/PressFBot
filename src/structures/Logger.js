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

const { colors, styles, hex } = require('leeks.js');
const { escapeTime } = require('../util');
const { inspect } = require('util');

// Hexadecimal for the logger's name
const NAME_COLOR = '#A4B1E7';

/** Object of the months from `Date#getMonth` */
const MONTHS = {
  // All of the months are 0-indexed
  0: 'Jan',
  1: 'Feb',
  2: 'Mar',
  3: 'Apr',
  4: 'May',
  5: 'Jun',
  6: 'Jul',
  7: 'Aug',
  8: 'Sept',
  9: 'Oct',
  10: 'Nov',
  11: 'Dec'
};

module.exports = class Logger {
  /**
   * Creates a new [Logger] instance
   * @param {string} title The title of the logger
   */
  constructor(title) {
    this.styles = styles;
    this.colors = colors;
    this.title  = title;
  }

  /**
   * Formats a Date to a string
   */
  getDate() {
    const now = new Date();
    
    const hours = escapeTime(now.getHours());
    const minutes = escapeTime(now.getMinutes());
    const seconds = escapeTime(now.getHours());
    const day = this.getNumberOrdinal(now.getDate());

    return colors.gray(`[${MONTHS[now.getMonth()]} ${day === null ? now.getDate() : day}, ${now.getFullYear()} | ${hours}:${minutes}:${seconds} ${now.getHours() >= 12 ? 'PM' : 'AM'}]`);
  }

  /**
   * Function to get the ordinal of any number (i.e: 1 -> 1st)
   * @param {number} int The number to get the ordinal
   * @credit [ThatTonybo/num-ord](https://github.com/ThatTonybo/num-ord)
   */
  getNumberOrdinal(int) {
    return int == 1 ? `${int}st` : int == 2 ? `${int}nd` : int == 3 ? `${int}rd` : int >= 4 ? `${int}th` : null;
  }

  /**
   * Formats the messages
   * @param  {...any} messages A list of messages
   */
  _formatMessages(...messages) {
    return messages
      .map((message) => 
        message instanceof Object 
          ? inspect(message) 
          : Array.isArray(message) 
            ? `[${message.join(', ')} (${message.length} items)]` 
            : message
      ).join('\n');
  }

  /**
   * Gets the level's text color
   * @param {'info' | 'error' | 'warn' | 'fatal' | 'database' | 'shard'} level The level
   * @param {number} [shardID=0] The shard's ID
   */
  getLevelText(level, shardID) {
    if (level === 'shard' && shardID === undefined) throw new TypeError('Required "shardID" argument but it wasn\'t received.');

    let lvlText;
    switch (level) {
      case 'info': lvlText = hex('#93D3D3', '[Info]'); break;
      case 'warn': lvlText = hex('#FFFF75', '[Warning]'); break;
      case 'error':
      case 'fatal': lvlText = hex('#FF7575', `[${level === 'error' ? 'Error' : 'Fatal'}]`); break;
      case 'shard': lvlText = hex('#F44C8D', `[Shard #${shardID}]`); break;
      case 'database': lvlText = hex('#407294', '[Database]'); break;
    }

    return lvlText;
  }

  /**
   * Same function is [Logger#write] but for shard logging
   * @param {number} shardID The shard's ID
   * @param {...any} messages The messages to print
   */
  writeShard(shardID, ...messages) {
    const level = this.getLevelText('shard', shardID);
    const name = hex(NAME_COLOR, `[${this.title}]`);

    process.stdout.write(`${this.getDate()} ${level} ${name} > ${this._formatMessages(...messages)}\n`);
  }

  /**
   * Writes to the console
   * @param {'info' | 'error' | 'warn' | 'fatal' | 'database'} level The level to use
   * @param {...any} messages The messages to print
   */
  write(level, ...messages) {
    const lvlText = this.getLevelText(level);
    const name = hex(NAME_COLOR, `[${this.title}]`);
    const message = this._formatMessages(...messages);

    process.stdout.write(`${this.getDate()} ${lvlText} ${name} > ${message}\n`);
  }

  /**
   * Writes to the console as the `INFO` level
   * @param  {...any} messages The messages to send
   */
  info(...messages) {
    return this.write('info', ...messages);
  }

  /**
   * Writes to the console as the `WARN` level
   * @param  {...any} messages The messages to send
   */
  warn(...messages) {
    return this.write('warn', ...messages);
  }

  /**
   * Writes to the console as the `ERROR` level
   * @param  {...any} messages The messages to send
   */
  error(...messages) {
    return this.write('error', ...messages);
  }

  /**
   * Writes to the console as the `FATAL` level
   * @param  {...any} messages The messages to send
   */
  fatal(...messages) {
    return this.write('fatal', ...messages);
  }

  /**
   * Writes to the console as the `SHARD` level
   * @param {number} shardID The shard's ID
   * @param {...any} messages The messages to send
   */
  shard(shardID, ...messages) {
    return this.writeShard(shardID, ...messages);
  }

  /**
   * Writes to the console as the `DATABASE` level
   * @param  {...any} messages The messages to send
   */
  database(...messages) {
    return this.write('database', ...messages);
  }
};