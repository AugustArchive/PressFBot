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
import net.dv8tion.jda.api.utils.MemberCachePolicy
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
            .setMemberCachePolicy(MemberCachePolicy.ALL)
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