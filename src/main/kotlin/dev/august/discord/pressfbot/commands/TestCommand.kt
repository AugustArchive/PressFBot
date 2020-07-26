package dev.august.discord.pressfbot.commands

import dev.august.discord.pressfbot.struct.command.annotations.Command
import dev.august.discord.pressfbot.struct.command.CommandContext
import dev.august.discord.pressfbot.struct.command.BaseCommand

@Command(
    triggers = ["test"],
    desc = "gay command lmaooo"
)
class TestCommand: BaseCommand() {
    override fun run(ctx: CommandContext) = ctx.send("ur gay lmao")
}