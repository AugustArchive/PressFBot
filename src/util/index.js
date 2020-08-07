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

const { existsSync } = require('fs');
const { execSync } = require('child_process');
const { join } = require('path');

/**
 * Extra utilities that will help the bot in the long run
 */
module.exports = {
  /**
   * Gets the latest commit hash
   * @returns {string} A string of the hash or `null` if it can't find the .git folder
   */
  getCommitHash: () => {
    if (!existsSync(join(__dirname, '..', '.git'))) return null;

    const hash = execSync('git rev-parse HEAD', { encoding: 'utf8' });
    return hash.slice(0, 8);
  },

  /**
   * Unembedifies an embed
   * @param {import('eris').EmbedOptions} embed The embed to convert
   */
  unembedify: (embed) => {
    /** @type {string[]} */
    const text = [];

    /**
     * Inner function to get the time
     * @param {number} now The current date
     */
    const getTime = (now) => {
      const date = new Date(now);
      const ampm = date.getHours() >= 12 ? 'AM' : 'PM';

      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} at ${this.escapeTime(date.getHours())}:${this.escapeTime(date.getMinutes())}:${this.escapeTime(date.getSeconds())}${ampm}`;
    };

    if (embed.title) text.push(`__**${embed.title}**__`);
    if (embed.description) text.push(`${embed.description.includes('> ') ? embed.description : `> **${embed.description}**`}`);
    if (embed.fields) {
      text.push('\n');
      for (let i = 0; i < embed.fields.length; i++) {
        const field = embed.fields[i];
        text.push(`**${field.name.replace('**', '')}**: ${field.value}`);
      }
    }

    if (embed.footer) {
      let field = `\n\n${embed.footer.text}`;
      if (embed.timestamp) {
        const time = embed.timestamp instanceof Date ? getTime(embed.timestamp) : getTime(new Date(embed.timestamp));
        field += ` | ${time}`;
      }

      text.push(field);
    }

    return text.join('\n');
  },

  /**
   * Turns a 3 byte int to rgb form.
   * @param {number} a The first number
   * @param {number} b The middle number
   * @param {number} c The last number
   * @returns The bytecode
   */
  rgbToInt(a, b, c) {
    // Credit: https://stackoverflow.com/a/8468879
    return (a & 0xff) << 16 + (b & 0xff) << 8 + (c & 0xff);
  },

  /**
   * Resolves a string
   * @param {StringResolvable} str The string
   */
  resolveString(str) {
    if (str instanceof Array) return str.join('\n');
    if (typeof str === 'string') return str;
    return String(str);
  },

  /**
   * Resolves a colour
   * @param {ColorResolvable} color The color
   */
  resolveColor(color) {
    if (color instanceof Array) color = this.rgbToInt(color[0], color[1], color[2]);
    if (color < 0 || color > 0xFFFFFF) throw new RangeError('Color cannot be less then 0 and over #FFFFFF (White)');
    if (color && isNaN(color)) throw new TypeError('Color wasn\'t a number.');
    return color;
  },

  /**
   * Clones an object
   * @param {object} obj The object
   */
  clone(obj) {
    const cloned = Object.create(obj);
    return Object.assign(obj, cloned);
  },

  /**
   * Escapes any zeros in the `time` declaration
   * @param {number} time The time
   */
  escapeTime: (time) => `0${time}`.slice(-2),

  /**
   * Makes the first letter in any string of text capital
   * 
   * @param {string} text The text to convert
   * @example
   * firstUpper('discord boats'); // 'Discord Boats'
   */
  firstUpper: (text) => text.split(' ').map(s => `${s.charAt(0).toUpperCase()}${s.slice(1)}`).join(' '),

  /**
   * Joins the current directory with any other appending directories
   * @param {...string} paths The paths to conjoin
   * @returns {string} The paths conjoined 
   */
  getPath: (...paths) => `${process.cwd()}${this.sep}${paths.join(this.sep)}`,

  /**
   * Returns the seperator for Windows/Unix systems
   */
  sep: process.platform === 'win32' ? '\\' : '/',

  /**
   * Asynchronous way to halt the process for x amount of milliseconds
   * 
   * Since `Promise` are macro-tasks and stuff like setTimeout, setInterval are micro-tasks,
   * the event loop will run any synchronous code first THEN all of the Promises in that code,
   * then all of the micro-tasks; so it's an endless loop of doing all 3 I described.
   * 
   * Why is this important? We can basically "manipulate" the event-loop to halt a certain
   * process until another process is done, I know... I'm weird at explaining stuff.
   * 
   * @param duration The amount of time to "sleep"
   * @returns An unknown Promise
   */
  sleep: (duration) => new Promise(resolve => setTimeout(resolve, duration))
};

/**
 * @typedef {number | number[]} ColorResolvable
 * @typedef {string | string[]} StringResolvable
 */