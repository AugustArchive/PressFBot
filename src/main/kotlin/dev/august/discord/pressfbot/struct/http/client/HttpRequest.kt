package dev.august.discord.pressfbot.struct.http.client

import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.MediaType.Companion.toMediaType
import org.json.JSONObject
import okhttp3.*

import java.io.IOException

class HttpRequest(val url: String, val method: HttpMethod) {
    private val parameters: MutableList<String> = mutableListOf()
    private val headers: HashMap<String, String> = hashMapOf()
    private val queries: HashMap<String, String> = hashMapOf()
    private val client: OkHttpClient = OkHttpClient()
    private var body: RequestBody? = null

    companion object {
        private val JSON = "application/json; charset=utf-8".toMediaType()
    }

    /**
     * Adds a parameter to the URL
     * @param value The value to add
     */
    fun param(value: String): HttpRequest {
        parameters.add(value)
        return this
    }

    /**
     * Adds a header to the request
     * @param header The header
     * @param value The value
     */
    fun header(header: String, value: String): HttpRequest {
        headers[header] = value
        return this
    }

    /**
     * Adds a new query parameter to the URL
     * @param key The query's key
     * @param value The value
     */
    fun query(key: String, value: String): HttpRequest {
        queries[key] = value
        return this
    }

    /**
     * Adds a body to the request (only in [HttpMethod.POST])
     * @param payload The payload
     */
    fun body(payload: JSONObject): HttpRequest {
        if (method == HttpMethod.GET) throw Exception("You can't use Request#body with a GET request")

        body = payload.toString().toRequestBody(JSON)
        return this
    }

    /**
     * Builds a new URL with the added query params
     */
    private fun buildUri(): String {
        // Make a hard copy since `url` is already immutable
        var start = url

        if (parameters.isNotEmpty()) {
            for (param in parameters) start += "/$param"
        }

        if (queries.isNotEmpty()) {
            var index = 0
            for (query in queries) {
                index++
                val prefix = if (index > 0) "&" else "?"

                start += "$prefix${query.key}=${query.value}"
            }
        }

        return start
    }

    fun execute(callback: (Throwable?, HttpResponse?) -> Unit) {
        val reqUrl = buildUri()
        when (method) {
            HttpMethod.GET -> {
                val request = Request.Builder()
                    .url(reqUrl)
                    .get()

                if (headers.isNotEmpty()) {
                    for (header in headers) request.addHeader(header.key, header.value)
                }

                val req = request.build()
                client.newCall(req).enqueue(RequestCallback(callback))
            }

            HttpMethod.POST -> {
                if (body == null) return callback(Exception("No body was added to this request"), null)
                val request = Request.Builder()
                    .url(reqUrl)
                    .post(body!!)

                if (headers.isNotEmpty()) {
                    for (header in headers) request.addHeader(header.key, header.value)
                }

                val req = request.build()
                client.newCall(req).enqueue(RequestCallback(callback))
            }
        }
    }
}