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