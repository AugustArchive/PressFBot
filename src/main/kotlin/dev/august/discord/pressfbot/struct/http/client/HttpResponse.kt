package dev.august.discord.pressfbot.struct.http.client

import org.json.JSONObject
import org.json.JSONArray
import okhttp3.*

class HttpResponse(private val core: Response) {
    fun json(): JSONObject {
        val body = JSONObject(core.body?.string())
        core.close()

        return body
    }

    fun jsonArray(): JSONArray {
        val body = JSONArray(core.body?.string())
        core.close()

        return body
    }

    fun text(): String? {
        val text = core.body?.string()
        core.close()

        return text
    }
}