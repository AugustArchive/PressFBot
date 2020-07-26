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
package dev.august.discord.pressfbot.struct

import dev.august.discord.pressfbot.struct.extensions.loadProperties
import dev.august.discord.pressfbot.struct.http.server.WebhookServer
import dev.august.discord.pressfbot.struct.managers.TimeoutsManager
import dev.august.discord.pressfbot.struct.managers.CommandManager
import dev.august.discord.pressfbot.struct.extensions.loadConfig
import dev.august.discord.pressfbot.struct.managers.RedisManager
import dev.august.discord.pressfbot.struct.data.ApplicationInfo
import dev.august.discord.pressfbot.struct.managers.VoteManager
import net.dv8tion.jda.api.sharding.DefaultShardManagerBuilder
import dev.august.discord.pressfbot.struct.data.Config
import net.dv8tion.jda.api.requests.GatewayIntent
import net.dv8tion.jda.api.utils.cache.CacheFlag
import net.dv8tion.jda.api.sharding.ShardManager
import dev.august.discord.pressfbot.listeners.*
import net.dv8tion.jda.api.entities.Activity
import net.dv8tion.jda.api.OnlineStatus
import org.slf4j.*

import java.awt.Color

class PressFBot {
    lateinit var config: Config
    lateinit var jda: ShardManager
    lateinit var app: ApplicationInfo
    private val logger: Logger = LoggerFactory.getLogger(this::class.java)
    val commands: CommandManager = CommandManager()
    val timeouts: TimeoutsManager = TimeoutsManager(this)
    var server: WebhookServer? = null
    val redis: RedisManager = RedisManager(this)
    val votes: VoteManager = VoteManager(this)
    val color: Color = Color.decode("#4C5659")

    fun setup() {
        Thread.currentThread().name = "PressFBot-MainThread"
        logger.info("Now loading...")

        config = loadConfig("./config.json")
        app = loadMetadata()

        commands.load()
        redis.connect()

        if (config.webhook != null) {
            logger.info("Found configuration for the webhook service!")
            server = WebhookServer(config.webhook?.port ?: 6969)
        }

        jda = DefaultShardManagerBuilder.create(config.token, GatewayIntent.GUILD_MESSAGES)
            .disableCache(CacheFlag.VOICE_STATE, CacheFlag.CLIENT_STATUS, CacheFlag.VOICE_STATE, CacheFlag.ACTIVITY, CacheFlag.EMOTE)
            .addEventListeners(GlobalEventListener(this))
            .setShardsTotal(-1)
            .setActivity(Activity.of(Activity.ActivityType.WATCHING, "the system load"))
            .setStatus(OnlineStatus.IDLE)
            .build()
    }

    private fun loadMetadata(): ApplicationInfo {
        logger.info("Now loading application info...")

        val stream = this::class.java.getResourceAsStream("/app.properties")
        val properties = loadProperties(stream)

        val commitHash = properties.getProperty("app.commit", "Unknown")
        val version = properties.getProperty("app.version", "Unknown")

        return ApplicationInfo(commitHash, version)
    }
}
