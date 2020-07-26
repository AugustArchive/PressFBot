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

import dev.august.discord.pressfbot.struct.extensions.setTimeout
import dev.august.discord.pressfbot.struct.PressFBot
import org.slf4j.*

class TimeoutsManager(private val bot: PressFBot) {
    private val logger: Logger = LoggerFactory.getLogger(this::class.java)

    companion object {
        private val DAY = 86400000L
    }

    fun apply(userID: String) {
        bot.redis.add("timeout:votes:$userID", "${System.currentTimeMillis()}:$userID")
        setTimeout(86400000L) {
            if (bot.redis.exists("timeout:votes:$userID")) bot.redis.delete("timeout:votes:$userID")
        }
    }

    fun reapply() {
        logger.info("Now reapplying votes...")
        val votes = bot.redis.keys("timeout:votes:*")
        if (votes.isEmpty()) {
            logger.warn("No votes were added today.")
            return
        }

        for (vote in votes.toTypedArray()) {
            val cached = vote.split(":")
            val time = cached[0].toLongOrNull() ?: continue

            setTimeout(time - (System.currentTimeMillis() + DAY)) {
                if (bot.redis.exists("timeout:votes:${cached[1]}")) bot.redis.delete("timeout:votes:${cached[1]}")
            }
        }
    }
}
