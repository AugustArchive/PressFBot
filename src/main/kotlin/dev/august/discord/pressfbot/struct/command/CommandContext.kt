package dev.august.discord.pressfbot.struct.command

import net.dv8tion.jda.api.events.message.guild.GuildMessageReceivedEvent
import dev.august.discord.pressfbot.struct.PressFBot
import net.dv8tion.jda.api.EmbedBuilder
import net.dv8tion.jda.api.entities.*
import net.dv8tion.jda.api.JDA

class CommandContext(private val event: GuildMessageReceivedEvent, val bot: PressFBot, val args: List<String>) {
    val channel: TextChannel = event.channel
    val member: Member? = event.member
    val sender: User = event.author
    val jda: JDA = event.jda

    fun send(content: String) = channel.sendMessage(content).queue()
    fun send(content: EmbedBuilder.() -> Unit) = channel.sendMessage(asEmbed(content).build()).queue()
    fun send(content: String, callback: (Message) -> Unit) = channel.sendMessage(content).queue(callback)

    private fun asEmbed(block: EmbedBuilder.() -> Unit): EmbedBuilder =
        EmbedBuilder()
            .setColor(bot.color)
            .apply(block)
}