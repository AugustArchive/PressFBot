package dev.august.discord.pressfbot.struct.http.client

import org.json.JSONObject

class HttpClient {
    companion object {
        /**
         * Creates a `GET` request
         * @param [String] url The URL to make a request to
         */
        fun get(url: String) = HttpRequest(url, HttpMethod.GET)

        /**
         * Creates a `POST` request
         * @param [String] url The URL to make a request
         * @param [JSONObject] body The body payload
         */
        fun post(url: String, body: JSONObject) = HttpRequest(url, HttpMethod.POST).body(body)
    }
}