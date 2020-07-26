package dev.august.discord.pressfbot.struct.data

import java.util.Date

data class VoteData(
    val expiresAt: Date,
    val voted: Boolean
)