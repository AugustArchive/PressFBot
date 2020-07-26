package dev.august.discord.pressfbot

import dev.august.discord.pressfbot.struct.extensions.createThread
import dev.august.discord.pressfbot.struct.PressFBot
import org.slf4j.*

object Bootstrap {
    private val logger: Logger = LoggerFactory.getLogger(this::class.java)

    @JvmStatic
    fun main(args: Array<String>) {
        val bot = PressFBot()
        bot.setup()

        addExitHook(bot)
    }

    private fun addExitHook(bot: PressFBot) {
        Runtime.getRuntime().addShutdownHook(createThread("PressFBot-ShutdownThread") {
            logger.warn("Process is exiting...")

            bot.redis.disconnect()
            bot.jda.shutdown()
        })
    }
}