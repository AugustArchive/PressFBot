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
package dev.august.discord.pressfbot.struct.extensions

import dev.august.discord.pressfbot.struct.managers.ConfigManager
import dev.august.discord.pressfbot.struct.data.Config

import kotlin.concurrent.timerTask
import java.util.Timer

/**
 * Loads the configuration from a specific path
 * @param path The path of the config file
 */
fun loadConfig(path: String): Config = ConfigManager(path).load()

/**
 * Creates a new [Timer] and runs it when the time hits
 * @param time The time to call the block
 * @param block The block function
 */
fun setTimeout(time: Long, block: () -> Unit) {
    val timer = Timer(false)
    timer.schedule(timerTask { block() }, time)
}
