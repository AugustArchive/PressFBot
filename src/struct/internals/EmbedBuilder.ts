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

/* eslint-disable camelcase */ 

import { EmbedOptions } from 'eris';

interface Embed {
  title?: string;
  description?: string;
  image?: EmbedImage;
  author?: EmbedAuthor;
  thumbnail?: EmbedThumbnail;
  fields?: EmbedField[];
  timestamp?: Date;
  footer?: EmbedFooter;
  color?: number;
  type?: 'rich';
  url?: string;
}

interface EmbedAuthor {
  name: string;
  url?: string;
  icon_url?: string;
}

interface EmbedThumbnail {
  url?: string;
}

interface EmbedImage {
  url?: string;
}

interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface EmbedFooter {
  text: string;
  icon_url?: string;
}

type StringResolvable = string | string[];
function toString(str: StringResolvable): string {
  if (str instanceof Array) return str.join('\n');
  if (typeof str === 'string') return str;
  return String(str);
}

function clone(obj: Record<string, unknown>) {
  const object = Object.create(obj);
  return Object.assign(obj, object);
}

export class EmbedBuilder {
  public title?: string;
  public description?: string;
  public author?: EmbedAuthor;
  public thumbnail?: EmbedThumbnail;
  public image?: EmbedImage;
  public footer?: EmbedFooter;
  public color?: number;
  public fields?: EmbedField[];
  public timestamp?: Date;
  public url?: string;

  constructor(data: Embed = {}) {
    this.title = data.title;
    this.description = data.description;
    this.author = data.author;
    this.thumbnail = data.thumbnail;
    this.image = data.image;
    this.footer = data.footer;
    this.color = data.color;
    this.fields = data.fields ? data.fields.map(field => clone(field as any)) : [];
    this.timestamp = data.timestamp;
    this.url = data.url;
  }

  setColor(color: number) {
    this.color = color;
    return this;
  }

  setTitle(title: string) {
    this.title = title;
    return this;
  }

  setDescription(text: string) {
    this.description = toString(text);
    return this;
  }

  setAuthor(name: string, url?: string, iconURL?: string) {
    this.author = {
      name,
      url,
      // eslint-disable-next-line camelcase
      icon_url: iconURL,
    };

    return this;
  }

  setThumbnail(url: string) {
    this.thumbnail = { url };
    return this;
  }

  addField(name: string, value: string, inline: boolean = false) {
    if (!name) throw new Error('No field name was provided');
    if (!value) throw new Error('No field value was provided');
    if (this.fields!.length > 25) throw new Error('Unable to add anymore fields. (FIELD_LIMIT_THRESHOLD)');

    this.fields!.push({ name, value: toString(value), inline });
    return this;
  }

  setImage(url: string) {
    this.image = { url };
    return this;
  }

  setTimestamp(t: Date = new Date()) {
    this.timestamp = t;
    return this;
  }

  setFooter(txt: string, iconURL?: string) {
    this.footer = { text: txt, icon_url: iconURL };
    return this;
  }

  setURL(url: string) {
    this.url = url;
    return this;
  }

  build(): EmbedOptions {
    return {
      title: this.title,
      description: this.description,
      fields: this.fields,
      author: this.author
        ? {
          name: this.author.name,
          url: this.author.url,
          icon_url: this.author.icon_url
        }
        : undefined,
      image: this.image ? this.image : undefined,
      footer: this.footer
        ? {
          text: this.footer.text,
          icon_url: this.footer.icon_url
        }
        : undefined,
      color: this.color,
      url: this.url ? this.url : undefined,
      timestamp: this.timestamp ? this.timestamp.toISOString() : undefined,
    };
  }
}