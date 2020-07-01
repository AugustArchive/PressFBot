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

import { Collection } from '@augu/immutable';
import type PressFBot from './PressFBot';
import Command from './Command';

interface ModuleInfo {
  description: string;
  visible: boolean;
  name: string;
}
export default class Module {
  public description: string;
  public commands: Collection<Command>;
  public visible: boolean;
  public name: string;
  public bot!: PressFBot;

  constructor(info: ModuleInfo) {
    this.description = info.description;
    this.commands = new Collection();
    this.visible = info.visible;
    this.name = info.name;
  }

  inject(bot: PressFBot) {
    this.bot = bot;
  }

  getCommand(name: string) {
    return this.commands.filter(cmd =>
      cmd.info.name === name || cmd.info.aliases.includes(name)  
    )[0];
  }

  addCommands(commands: Command[]) {
    for (const command of commands) this.commands.set(command.info.name, command);
  }
}