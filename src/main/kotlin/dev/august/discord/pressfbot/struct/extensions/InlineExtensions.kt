package dev.august.discord.pressfbot.struct.extensions

import dev.august.discord.pressfbot.struct.managers.ConfigManager
import dev.august.discord.pressfbot.struct.data.Config

fun loadConfig(path: String): Config = ConfigManager(path).load()