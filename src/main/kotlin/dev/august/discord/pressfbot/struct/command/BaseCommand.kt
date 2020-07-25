package dev.august.discord.pressfbot.struct.command

import dev.august.discord.pressfbot.struct.command.annotations.Command

/**
 * Abstract class to represent a command
 */
abstract class BaseCommand {
    /**
     * The command's metadata
     */
    val info: Command
        get() = this::class.java.getAnnotation(Command::class.java)

    /**
     * Abstract function to run the command
     * @param ctx The command's current context
     */
    abstract fun run(ctx: CommandContext)

    /**
     * Format the command's usage
     */
    fun format(ctx: CommandContext): String {
        var usage = "${ctx.bot.config.prefix}${this.info.triggers[0]}"
        if (this.info.usage.isNotEmpty() || this.info.usage.isNotBlank()) usage += " ${this.info.usage}"

        return usage
    }
}