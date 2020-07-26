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

import com.google.gson.Gson
import dev.august.discord.pressfbot.struct.PressFBot
import redis.clients.jedis.Jedis
import org.slf4j.*

class RedisManager(private val bot: PressFBot) {
    lateinit var client: Jedis
    private val logger: Logger = LoggerFactory.getLogger(this::class.java)
    var connected: Boolean = false

    fun connect() {
        if (this.connected) throw Exception("Redis manager is already connected")
        logger.info("Now connecting to Redis...")

        client = Jedis(bot.config.redis.host, bot.config.redis.port)
        if (bot.config.redis.pass != null) client.auth(bot.config.redis.pass!!)

        connected = true
        logger.info("Connected to Redis!")
    }

    fun disconnect() {
        if (!this.connected) throw Exception("Redis is already disposed")

        client.disconnect()
        connected = false
    }

    operator fun get(key: String): String? = client.get(key)
    fun add(key: String, value: String) = client.set(key, value)
    fun <T> add(key: String, value: T) = client.set(key, Gson().toJson(value))
    fun exists(key: String) = client.exists(key)
    fun delete(key: String) = client.del(key)
    fun keys(key: String) = client.keys(key)
}
