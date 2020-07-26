package dev.august.discord.pressfbot.struct.managers

import dev.august.discord.pressfbot.struct.command.BaseCommand
import org.reflections.Reflections
import org.slf4j.*

class CommandManager: HashMap<String, BaseCommand>() {
    private val reflections: Reflections = Reflections("dev.august.discord.pressfbot.commands")
    private val logger: Logger = LoggerFactory.getLogger(this::class.java)
    val modules: MutableList<String> = mutableListOf()

    fun load() {
        val found = reflections.getSubTypesOf(BaseCommand::class.java)
        logger.info("Found ${found.size} commands in package \"dev.august.discord.pressfbot.commands\"!")

        val commands = found.filter { x -> !x.isEnum || !x.isInterface }
        for (cmd in commands) {
            val instance = cmd.newInstance() as BaseCommand
            if (!modules.contains(instance.info.category.value)) modules.add(instance.info.category.value)

            this[instance.info.triggers[0]] = instance
            logger.info("Loaded command \"${instance.info.triggers[0]}\"!")
        }
    }
}