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