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