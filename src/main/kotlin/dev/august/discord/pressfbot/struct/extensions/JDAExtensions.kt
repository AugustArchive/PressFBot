package dev.august.discord.pressfbot.struct.extensions

import net.dv8tion.jda.api.entities.User

/**
 * Extension function to return the user's tag as `username#discriminator`
 * @example `August#5820`
 */
fun User.tag(): String = "${this.name}#${this.discriminator}"