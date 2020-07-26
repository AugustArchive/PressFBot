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
package dev.august.discord.pressfbot.struct.http.server

import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.application.*
import org.json.JSONObject
import io.ktor.features.*
import io.ktor.response.*
import io.ktor.routing.*
import io.ktor.http.*
import io.ktor.gson.*
import org.slf4j.*

class WebhookServer(val port: Int) {
    private val server: NettyApplicationEngine = createServer()
    private val logger: Logger = LoggerFactory.getLogger(this::class.java)

    private fun createServer(): NettyApplicationEngine = embeddedServer(Netty, port) {
            routing {
                get("/") {
                    call.respondText(JSONObject().put("gay", true).toString(), ContentType.Application.Json)
                }
            }

            install(ContentNegotiation) {
                gson {
                    serializeNulls()
                    disableHtmlEscaping()
                }
            }
        }

    fun start() {
        logger.info("Started webhook server (http://localhost:$port)")
        server.start(wait = true)
    }
}
