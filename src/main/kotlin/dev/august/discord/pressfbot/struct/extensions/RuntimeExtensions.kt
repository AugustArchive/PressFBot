package dev.august.discord.pressfbot.struct.extensions

import java.util.concurrent.TimeUnit
import java.io.IOException
import java.io.File

/**
 * Runs a shell-based command and returns the output or `null` if it errored
 */
fun String.runCommand(): String? = try {
    val parts = this.split("\\s".toRegex())
    val process = ProcessBuilder(*parts.toTypedArray())
        .directory(File("."))
        .redirectOutput(ProcessBuilder.Redirect.PIPE)
        .redirectError(ProcessBuilder.Redirect.PIPE)
        .start()

    process.waitFor(60, TimeUnit.MINUTES)
    process.inputStream.bufferedReader().readText().trim()
} catch (ex: IOException) {
    ex.printStackTrace()
    null
}