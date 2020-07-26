/**
 * Copyright (c) 2020 August
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
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
