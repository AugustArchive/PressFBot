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
