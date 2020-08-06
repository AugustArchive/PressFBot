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

import com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar
import org.apache.tools.ant.filters.ReplaceTokens

plugins {
    id("com.github.johnrengelman.shadow") version "4.0.1"
    id("com.diffplug.gradle.spotless") version "4.3.0"
    kotlin("jvm") version "1.3.72"
    application
    java
}

val current = Version(2, 0, 0)

group = "dev.august"
version = current.string()

repositories {
    mavenCentral()
    jcenter()
}

dependencies {
    implementation("ch.qos.logback:logback-classic:1.2.3")
    implementation("org.reflections:reflections:0.9.12")
    implementation("com.squareup.okhttp3:okhttp:4.8.1")
    implementation("io.ktor:ktor-server-netty:1.3.2")
    implementation("org.slf4j:slf4j-api:1.7.30")
    implementation("redis.clients:jedis:3.3.0")
    implementation("net.dv8tion:JDA:4.2.0_187")
    implementation("io.ktor:ktor-gson:1.3.2")
    implementation("org.json:json:20200518")
    implementation(kotlin("stdlib-jdk8"))
}

// Credit: JDA
// Source: https://github.com/DV8FromTheWorld/JDA/blob/master/build.gradle.kts#L111
val versioning = task<Copy>("versionTask") {
    from("src/main/resources") {
        include("**/metadata.properties")
        val tokens = mapOf(
            "version" to current.string(),
            "commit" to current.commit()
        )

        filter<ReplaceTokens>(mapOf("tokens" to tokens))
    }

    // sometimes this is dumb but its what i gotta do :(
    rename { "app.properties" }
    into("src/main/resources")
    includeEmptyDirs = false
}

tasks {
    compileKotlin {
        kotlinOptions.jvmTarget = "1.8"
    }

    compileTestKotlin {
        kotlinOptions.jvmTarget = "1.8"
    }

    named<ShadowJar>("shadowJar") {
        mergeServiceFiles()
        archiveFileName.set("PressFBot.jar")
        manifest {
            attributes(mapOf(
                "Manifest-Version" to "1.0.0",
                "Main-Class" to "dev.august.discord.pressfbot.Bootstrap"
            ))
        }
    }

    build {
        dependsOn(spotlessApply)
        dependsOn(versioning)
        dependsOn(shadowJar)
    }
}

application {
    mainClassName = "dev.august.discord.pressfbot.Bootstrap"
}

spotless {
    kotlin {
        trimTrailingWhitespace()
        licenseHeaderFile("${rootProject.projectDir}/docs/HEADER")
        endWithNewline()
    }
}

class Version(
    private val major: Int,
    private val minor: Int,
    private val revision: Int
) {
    fun string(): String = "$major.$minor.${if (revision == 0) "" else ".$revision"}"
    fun commit(): String = runCommand("git rev-parse HEAD")
}

fun runCommand(command: String, workingDir: File = file("./")): String {
    val parts = command.split("\\s".toRegex())
    val process = ProcessBuilder(*parts.toTypedArray())
        .directory(workingDir)
        .redirectOutput(ProcessBuilder.Redirect.PIPE)
        .redirectError(ProcessBuilder.Redirect.PIPE)
        .start()

    process.waitFor(1, TimeUnit.MINUTES)
    return process.inputStream.bufferedReader().readText().trim()
}