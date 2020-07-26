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
package dev.august.discord.pressfbot.struct.managers

import dev.august.discord.pressfbot.struct.command.BaseCommand
import org.reflections.Reflections
import org.slf4j.*

class CommandManager: HashMap<String, BaseCommand>() {
    private val reflections: Reflections = Reflections("dev.august.discord.pressfbot.commands")
    private val logger: Logger = LoggerFactory.getLogger(this::class.java)
    val modules: MutableList<String> = mutableListOf()

    fun load() {
        val found = reflections.getSubTypesOf(BaseCommand::class.java)
        logger.info("Found ${found.size} commands in package \"dev.august.discord.pressfbot.commands\"!")

        val commands = found.filter { x -> !x.isEnum || !x.isInterface }
        for (cmd in commands) {
            val instance = cmd.newInstance() as BaseCommand
            if (!modules.contains(instance.info.category.value)) modules.add(instance.info.category.value)

            this[instance.info.triggers[0]] = instance
            logger.info("Loaded command \"${instance.info.triggers[0]}\"!")
        }
    }
}
