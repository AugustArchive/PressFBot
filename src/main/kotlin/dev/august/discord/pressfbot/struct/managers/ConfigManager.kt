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

import dev.august.discord.pressfbot.struct.data.Config
import kotlin.system.exitProcess
import com.google.gson.Gson
import org.slf4j.*

import java.io.File

class ConfigManager(private val path: String) {
    private val logger: Logger = LoggerFactory.getLogger(this::class.java)
    private val gson: Gson = Gson()

    fun load(): Config {
        logger.info("Attempting to load config file in \"$path\"...")
        try {
            val file = File(path)
            val contents = file.readText(Charsets.UTF_8)
            logger.info("Initialised the config successfully!")

            return gson.fromJson(contents, Config::class.java)
        } catch (ex: Throwable) {
            logger.error("Unable to load config in path \"$path\":")
            ex.printStackTrace()

            exitProcess(1)
        }
    }
}
