package dev.august.discord.pressfbot.struct.data

/**
 * Represents the data class for the configuration file
 */
data class Config(
    val owners: List<String>,
    val token: String,
    val redis: RedisConfig,
    val webhook: WebhookConfig?
)

/**
 * Represents the `redis` object in [Config]
 */
data class RedisConfig(
    val host: String,
    val port: Int
)

/**
 * Represents the `webhook` object in [Config]
 */
data class WebhookConfig(
    val id: Long,
    val port: Int,
    val token: String
)