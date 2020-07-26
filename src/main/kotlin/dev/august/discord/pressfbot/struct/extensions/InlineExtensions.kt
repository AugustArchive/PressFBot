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