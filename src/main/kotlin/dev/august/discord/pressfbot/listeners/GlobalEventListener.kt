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
package dev.august.discord.pressfbot.listeners

import net.dv8tion.jda.api.events.message.guild.GuildMessageReceivedEvent
import dev.august.discord.pressfbot.struct.command.CommandContext
import dev.august.discord.pressfbot.struct.extensions.tag
import dev.august.discord.pressfbot.struct.PressFBot
import net.dv8tion.jda.api.events.DisconnectEvent
import net.dv8tion.jda.api.hooks.ListenerAdapter
import net.dv8tion.jda.api.entities.Activity
import net.dv8tion.jda.api.events.ReadyEvent
import net.dv8tion.jda.api.OnlineStatus
import org.slf4j.*

import java.util.Random

class GlobalEventListener(private val bot: PressFBot): ListenerAdapter() {
    private val logger: Logger = LoggerFactory.getLogger(this::class.java)
    private val random: Random = Random()

    // Credit: https://github.com/Devoxin/JukeBot/blob/master/src/main/java/jukebot/listeners/CommandHandler.kt
    override fun onGuildMessageReceived(event: GuildMessageReceivedEvent) {
        if (event.isWebhookMessage || event.author.isBot) return

        // Before we go into commands, we need to check if "F" was in chat!
        if (event.message.contentRaw === "f" || event.message.contentRaw === "F" || event.message.contentRaw === "01000110") {
            val user = bot.redis["users:${event.author.id}"]
            val percent = random.nextInt(100)

            if (user == null && percent < 20) event.channel.sendMessage(":pencil2: **Consider supporting PressFBot! Run `F_vote` for more information.**").queue()
            val name = if (event.member == null) event.author.name else event.member!!.effectiveName
            return event.channel.sendMessage("**${name}** has paid their respect.").queue()
        }

        // Now we check for prefixes
        val prefix = mutableListOf("F ", "F", "F_").find { event.message.contentRaw.startsWith(it) } ?: return
        val mentioned = event.message.contentRaw.startsWith("<@${event.guild.selfMember.id}>") || event.message.contentRaw.startsWith("<@!${event.guild.selfMember.id}>")
        val length = if (mentioned) event.guild.selfMember.asMention.length + 1 else prefix.length

        // Check if the message starts with it or not
        if (!event.message.contentRaw.startsWith(prefix) && !mentioned) return
        if (mentioned && !event.message.contentRaw.contains(" ")) return

        // Now we actually fetch the command
        val args = event.message.contentRaw.substring(length).split(" +".toRegex()).toMutableList()
        val commandName = args.removeAt(0)
        val context = CommandContext(event, bot, args)
        val command = bot.commands[commandName]
            ?: bot.commands.values.firstOrNull { it.info.triggers.contains(commandName) }
            ?: return

        if (command.info.ownerOnly && !bot.config.owners.contains(event.author.id)) return context.send("This command is developer-only, nice try.")
        try {
            command.run(context)
        } catch (ex: Throwable) {
            val error = if (ex.cause != null) ex.cause!!.localizedMessage else ex.localizedMessage
            val owners = bot.config.owners.joinToString(", ") { id ->
                val user = bot.jda.getUserById(id)
                user?.tag() ?: "Unknown User#0000"
            }

            context.send {
                setTitle("[ Command ${command.info.triggers[0]} has failed ]")
                setDescription("If this issue keeps occuring, contact $owners\n```kotlin\n$error\n```")
            }

            logger.error("Unable to run command ${command.info.triggers[0]}:")
            ex.printStackTrace()
        }
    }

    override fun onReady(event: ReadyEvent) {
        logger.info("PressFBot is now online! Serving ${event.jda.guilds.size} (un)cached guilds.")
        event.jda.presence.setPresence(OnlineStatus.ONLINE, Activity.listening("fs in chat"))

        bot.timeouts.reapply()
        if (bot.server != null) bot.server!!.start()
    }

    override fun onDisconnect(event: DisconnectEvent) {
        val message = if (event.closeCode != null) "View full trace below, " else ""
        logger.warn("Disconnected from Discord! ${message}now awaiting new connection...")

        if (event.closeCode != null) {
            logger.error("[${event.closeCode!!.code}]: ${event.closeCode!!.meaning} (reconnect: ${if (event.closeCode!!.isReconnect) "yes" else "no"})")
        }
    }
}
