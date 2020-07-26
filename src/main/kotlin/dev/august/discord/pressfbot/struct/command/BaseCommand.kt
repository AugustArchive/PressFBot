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
package dev.august.discord.pressfbot.struct.command

import dev.august.discord.pressfbot.struct.command.annotations.Command

/**
 * Abstract class to represent a command
 */
abstract class BaseCommand {
    /**
     * The command's metadata
     */
    val info: Command
        get() = this::class.java.getAnnotation(Command::class.java)

    /**
     * Abstract function to run the command
     * @param ctx The command's current context
     */
    abstract fun run(ctx: CommandContext)

    /**
     * Format the command's usage
     */
    fun format(): String {
        var usage = "F_${this.info.triggers[0]}"
        if (this.info.usage.isNotEmpty() || this.info.usage.isNotBlank()) usage += " ${this.info.usage}"

        return usage
    }
}
