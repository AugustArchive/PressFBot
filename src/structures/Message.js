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

const MessageCollector = require('./MessageCollector');
const ArgumentParser = require('./parsers/ArgumentParser');
const { unembedify } = require('../util');
const EmbedBuilder = require('./EmbedBuilder');

/**
 * Validation function to check if `value` is an embed or not
 * @param {EmbedResolvable} value The value
 * @returns {import('eris').EmbedOptions | null} The embed or `null` if it's not an [EmbedBuilder] or an object
 */
const resolveEmbed = (value) => {
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  else if (value instanceof EmbedBuilder) return value.build();
  else return null;
};

/**
 * Represents a [CommandMessage], basically
 * it's an extended version of `Eris.Message`,
 * providing extra utilities to it.
 */
module.exports = class CommandMessage {
  /**
   * Creates a new [CommandMessage] class.
   * @param {import('./PressFBot')} bot The bot instance
   * @param {import('eris').Message<import('eris').TextChannel>} msg The message
   * @param {string[]} args The arguments provided by da user UwU
   */
  constructor(bot, msg, args) {
    /**
     * The message collector for [CommandMessage.awaitMessage]
     * @type {import('./MessageCollector')}
     */
    this.collector = new MessageCollector(bot, {
      channelID: msg.channel.id,
      authorID: msg.author.id,
      timeout: 60 * 1000
    });

    /**
     * The message
     * @type {import('eris').Message<import('eris').TextChannel>}
     */
    this.message = msg;

    /**
     * Argument parser OwO
     * @type {ArgumentParser}
     */
    this.args = new ArgumentParser(args);

    /**
     * The bot instance
     * @type {import('./PressFBot')}
     */
    this.bot = bot;
  }

  /**
   * Sends a message to the current channel
   * @param {string} content The content to send
   */
  send(content) {
    return this.message.channel.createMessage({
      content,
      allowedMentions: {
        everyone: false,
        roles: false,
        users: false
      }
    });
  }

  /**
   * Sends an embed to the current channel (or an unembedified version if there is no `EMBED_LINKS` permission)
   * @param {EmbedResolvable} content The embed to send
   */
  embed(content) {
    const embed = resolveEmbed(content);
    const bot = this.message.channel.permissionsOf(this.bot.client.user.id);

    if (this.guild) {
      if (!this.self.permission.has('embedLinks')) {
        return this.send(unembedify(embed));
      } else {
        return this.message.channel.createMessage({
          embed,
          allowedMentions: {
            everyone: false,
            roles: false,
            users: false
          }
        });
      }
    } else {
      return this.message.channel.createMessage({
        embed,
        allowedMentions: {
          everyone: false,
          roles: false,
          users: false
        }
      });
    }
  }

  /**
   * Awaits an message in 60 seconds and returns it
   * @param {(m: import('eris').Message<import('eris').TextChannel>) => boolean} filter The filter to use
   */
  awaitMessage(filter) {
    return this.collector.awaitMessage(filter);
  }

  /**
   * Gets the current guild or `null`
   */
  get guild() {
    return this.message.channel.hasOwnProperty('guild') ? this.message.channel.guild : null;
  }

  /**
   * Gets the current channel
   */
  get channel() {
    return this.message.channel;
  }

  /**
   * Gets the current author
   */
  get sender() {
    return this.message.author;
  }

  /**
   * Gets the current member or `null` if not found
   */
  get member() {
    return this.guild ? this.guild.members.get(this.sender.id) : undefined;
  }

  /**
   * Gets the client's member instance
   */
  get self() {
    return this.guild.members.get(this.bot.client.user.id);
  }
};

/**
 * @typedef {import('./EmbedBuilder') | import('eris').EmbedOptions} EmbedResolvable A resolvable embed
 */
