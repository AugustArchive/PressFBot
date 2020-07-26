package dev.august.discord.pressfbot.struct.managers

import dev.august.discord.pressfbot.struct.data.VoteData
import dev.august.discord.pressfbot.struct.PressFBot
import com.google.gson.Gson

import java.util.Date

class VoteManager(private val bot: PressFBot) {
    private val gson: Gson = Gson()

    fun addVote(userID: String): Pair<Boolean, String?> {
        val cached = bot.redis["users:$userID"]
        if (cached != null) return Pair(false, "User has already voted.")

        val vote = VoteData(voted=true, expiresAt=Date())
        bot.redis.add("users:$userID", vote)
        bot.timeouts.apply(userID)

        return Pair(true, null)
    }

    fun getVote(userID: String): VoteData? {
        val cache = bot.redis["users:$userID"]
        return gson.fromJson(cache, VoteData::class.java)
    }
}