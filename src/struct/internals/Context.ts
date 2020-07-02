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

import type { Message, TextChannel, EmbedOptions } from 'eris';
import { EmbedBuilder } from './EmbedBuilder';
import type PressFBot from './PressFBot';
import { unembedify } from '../../util';
import ArgumentParser from './ArgParser';
import { Context } from '.';

function resolveEmbed(embed: unknown): EmbedOptions {
  if (embed instanceof EmbedBuilder) return embed.build();
  if (embed instanceof Object) return embed;
  else throw new Error('Embed was not an instanceof EmbedBuilder or an Object');
}

export default class CommandContext {
  public message: Message;
  public args: ArgumentParser;
  public bot: PressFBot;

  constructor(bot: PressFBot, msg: Message, args: string[]) {
    this.message = msg;
    this.args = new ArgumentParser(args);
    this.bot = bot;
  }

  get guild() {
    return this.message.channel.type === 0 ? (<Message<TextChannel>> this.message).channel.guild : null;
  }

  get channel() {
    return this.message.channel.type === 0 ? (<Message<TextChannel>> this.message).channel : null;
  }

  get author() {
    return this.message.author;
  }

  get self() {
    return this.guild!.members.get(this.bot.client.user.id)!;
  }

  send(content: string, embed?: EmbedOptions | EmbedBuilder) {
    const obj = { content };
    if (embed !== undefined) obj['embed'] = resolveEmbed(embed);

    return this.message.channel.createMessage(obj);
  }

  embed(content: EmbedOptions | EmbedBuilder) {
    if (this.guild) {
      if (!this.self.permission.has('embedLinks')) {
        const message = unembedify(content);
        return this.send(message);
      } else {
        return this.message.channel.createMessage({ embed: resolveEmbed(content) });
      }
    } else {
      return this.message.channel.createMessage({ embed: resolveEmbed(content) });
    }
  }
}