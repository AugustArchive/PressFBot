package dev.august.discord.pressfbot.struct.http.client

import okhttp3.Call
import java.io.IOException
import okhttp3.Callback
import okhttp3.Response

class RequestCallback(val callback: (Throwable?, HttpResponse?) -> Unit): Callback {
    override fun onFailure(call: Call, e: IOException) {
        e.printStackTrace()
        callback(e, null)
    }

    override fun onResponse(call: Call, response: Response) {
        if (!response.isSuccessful) return callback(Exception("[${response.code}] ${response.body?.string() ?: "Unknown"}"), null)
        return callback(null, HttpResponse(response))
    }
}