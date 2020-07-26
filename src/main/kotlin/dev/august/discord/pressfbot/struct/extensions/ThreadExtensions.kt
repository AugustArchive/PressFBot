package dev.august.discord.pressfbot.struct.extensions

/**
 * Easy implementation of creating a new [java.lang.Thread]
 * @param name The name of the thread
 * @param block Function to run the thread
 */
fun createThread(name: String, block: () -> Unit): Thread {
    return (object: Thread(name) {
        override fun run() {
            block()
        }
    })
}