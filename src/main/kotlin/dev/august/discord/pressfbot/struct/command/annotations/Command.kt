package dev.august.discord.pressfbot.struct.command.annotations

import dev.august.discord.pressfbot.struct.command.CommandCategory

/**
 * The `@Command` annotation is basically marking metadata for [BaseCommand]
 */
annotation class Command(
    val desc: String,
    val usage: String = "",
    val category: CommandCategory = CommandCategory.GENERIC,
    val triggers: Array<String>,
    val ownerOnly: Boolean = false
)