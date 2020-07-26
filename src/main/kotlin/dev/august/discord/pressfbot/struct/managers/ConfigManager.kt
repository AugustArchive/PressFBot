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