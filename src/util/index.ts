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

import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

/**
 * Shows an ad at a specified percentage
 * @param show If we should show it or not
 * @returns The advertisement itself or `undefined` if `show` = false & random is not over 0.9
 */
export function showAd(show: boolean): string | undefined {
  const random = Math.random();
  if (show && random >= 0.9) return 'Consider supporting PressFBot using the `f vote` command!';
  else return undefined;
}

/**
 * Gets the commit hash from Git
 * @returns A string if the root directory is a Git repository
 * or `null` if no `.git` folder was found
 */
export function getCommitHash() {
  if (!existsSync(join(process.cwd(), '..', '.git'))) return null;
  
  return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().slice(0, 7);
}