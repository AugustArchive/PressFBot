package dev.august.discord.pressfbot.struct.extensions

import java.util.Properties
import java.io.InputStream
import java.io.FileReader

/**
 * Loads a `.properties` file from a resolvable path
 * @param path The path to find the file
 * @returns [Properties] The properties instance
 */
fun loadProperties(path: String): Properties {
    val props = Properties()
    val reader = FileReader(path)

    reader.use { fr -> props.load(fr) }
    return props
}

/**
 * Loads a `.properties` file from an input stream
 * @param stream The input stream
 * @returns [Properties] The properties instance
 */
fun loadProperties(stream: InputStream): Properties = Properties().apply { load(stream) }