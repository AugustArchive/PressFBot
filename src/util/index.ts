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

import type { EmbedOptions } from 'eris';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

/**
 * Gets the commit hash from Git
 * @returns A string if the root directory is a Git repository
 * or `null` if no `.git` folder was found
 */
export function getCommitHash() {
  if (!existsSync(join(process.cwd(), '..', '.git'))) return null;
  
  return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().slice(0, 7);
}

/**
 * Creates a chunked array
 * @param entries The entries
 * @param size The size
 * @credit [Kurasuta](https://github.com/DevYukine/Kurasuta/blob/master/src/Util/Util.ts)
 */
export function chunkArray<T>(entries: T[], size: number) {
  const result: T[][] = [];
  const amount = Math.floor(entries.length / size);
  const mod = entries.length % size;

  for (let i = 0; i < size; i++) result[i] = entries.splice(0, i < mod ? amount + 1 : amount);
  return result;
}

/**
 * Sleeps the process for a certain amount 
 * @param ms The amount of milliseconds to hault this process
 */
export function sleep(ms: number) {
  return new Promise(resolver => setTimeout(resolver, ms));
}

export function humanize(ms: number) {
  const months = Math.floor(ms / 1000 / 60 / 60 / 24 / 7 / 12);
  ms -= months * 1000 * 60 * 60 * 24 * 7 * 12;

  const weeks = Math.floor(ms / 1000 / 60 / 60 / 24 / 7);
  ms -= weeks * 1000 * 60 * 60 * 24 * 7;

  const days = Math.floor(ms / 1000 / 60 / 60 / 24);
  ms -= days * 1000 * 60 * 60 * 24;

  const hours = Math.floor(ms / 1000 / 60 / 60);
  ms -= hours * 1000 * 60 * 60;

  const mins = Math.floor(ms / 1000 / 60);
  ms -= mins * 1000 * 60;

  let humanized = '';
  const sec = Math.floor(ms / 1000);

  const addS = (value: number) => value > 1 ? 's' : '';
  if (months > 0) humanized += `${months} month${addS(months)}, `;
  if (weeks > 0) humanized += `${weeks} week${addS(weeks)}, `;
  if (days > 0) humanized += `${days} day${addS(days)}, `;
  if (hours > 0) humanized += `${hours} hour${addS(hours)}, `;
  if (mins > 0) humanized += `${mins} minute${addS(mins)}, `;
  if (sec > 0) humanized += `${sec} seconds`;

  return humanized;
}

export function unembedify(embed: EmbedOptions) {
  let text = '';

  function getTime(now: number) {
    const date = new Date(now);
    const escape = (value) => `0${value}`.slice(-2);
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';

    return `${date.getMonth()}/${date.getDate()}/${date.getFullYear()} at ${escape(date.getHours())}:${escape(date.getMinutes())}:${escape(date.getSeconds())}${ampm}`;
  }

  if (embed.title) text += `__**${embed.title}**__`;
  if (embed.description) text += `\n${embed.description.includes('> ') ? embed.description : `> **${embed.description}**`}`;
  if (embed.fields) {
    text += '\n';
    for (const field of embed.fields) text += `\n- ${field.name}: ${field.value}`;
  }
  if (embed.footer) {
    let field = `\n\n**${embed.footer.text}`;

    if (embed.timestamp) {
      const time = embed.timestamp instanceof Date ? getTime(embed.timestamp.getTime()) : embed.timestamp;
      field += `at ${time}`;
    }

    text += `${field}**`;
  }

  return text;
}

export function formatSize(bytes: number) {
  const kilo = bytes / 1024;
  const mega = kilo / 1024;
  const giga = mega / 1024;

  if (kilo < 1024) return `${kilo.toFixed(1)}KB`;
  else if (kilo > 1024 && mega < 1024) return `${mega.toFixed(1)}MB`;
  else return `${giga.toFixed(1)}GB`; 
}

export const sep = process.platform === 'win32' ? '\\' : '/';
export const getPath = (...paths: string[]) => `${process.cwd()}${sep}${paths.join(sep)}`;