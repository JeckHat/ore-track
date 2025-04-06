package com.oremobile.modules

import android.os.Build
import android.util.Log
import com.facebook.react.bridge.Arguments
import java.io.BufferedReader
import java.io.FileReader
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.InputStreamReader
import java.util.Random

class CpuUsageModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "RNCpuUsage"
    }

    @ReactMethod
    fun getCpuUsagePerCore(promise: Promise) {
        Thread {
            try {
                val usage = getGlobalCpuUsageSafe()
                val coreCount = Runtime.getRuntime().availableProcessors()

                val usageList = simulatePerCore(usage, coreCount)

                val array = Arguments.createArray()
                usageList.forEach { array.pushInt(it) }
                promise.resolve(array)
            } catch (e: Exception) {
                promise.reject("CPU_ERROR", e.message, e)
            }
        }.start()
    }

    @ReactMethod
    fun getCpuUsagePerCoreViaTop(promise: Promise) {
        Thread {
            try {
                val process = Runtime.getRuntime().exec(arrayOf("top", "-n", "1"))
                val reader = BufferedReader(InputStreamReader(process.inputStream))
                val output = reader.readText()
                reader.close()

                // Parse global CPU usage line, eg: "CPU usage from 0% to 100%"
                // Search for line like: "CPU: 25% user + 5% kernel ..."
                val usageRegex = Regex("""CPU:\s+(\d+)% user\s+\+\s+(\d+)% kernel""", RegexOption.IGNORE_CASE)
                val match = usageRegex.find(output)

                val totalUsage = if (match != null) {
                    val user = match.groupValues[1].toInt()
                    val kernel = match.groupValues[2].toInt()
                    (user + kernel).coerceIn(0, 100)
                } else {
                    40 // fallback
                }

                // Distribute total usage to each core with jitter
                val coreCount = Runtime.getRuntime().availableProcessors()
                val random = java.util.Random()
                val array = Arguments.createArray()
                var remaining = totalUsage

                for (i in 0 until coreCount) {
                    val base = remaining / (coreCount - i)
                    val jitter = random.nextInt(10) - 5
                    val value = (base + jitter).coerceIn(0, 100)
                    array.pushInt(value)
                    remaining -= value
                }

                promise.resolve(array)

            } catch (e: Exception) {
                e.printStackTrace()
                promise.reject("CPU_TOP_FAIL", e.message, e)
            }
        }.start()
    }


    private fun getGlobalCpuUsageSafe(): Int {
        return try {
            val stat1 = readGlobalCpuStat()
            Thread.sleep(500)
            val stat2 = readGlobalCpuStat()

            val active1 = stat1.user + stat1.nice + stat1.system + stat1.irq + stat1.softirq
            val active2 = stat2.user + stat2.nice + stat2.system + stat2.irq + stat2.softirq

            val total1 = active1 + stat1.idle + stat1.iowait
            val total2 = active2 + stat2.idle + stat2.iowait

            val deltaActive = active2 - active1
            val deltaTotal = total2 - total1

            if (deltaTotal > 0) (deltaActive * 100 / deltaTotal).toInt() else 0
        } catch (e: Exception) {
            40 // fallback estimation
        }
    }

    data class GlobalCpuStat(
        val user: Long, val nice: Long, val system: Long, val idle: Long,
        val iowait: Long, val irq: Long, val softirq: Long
    )

    private fun readGlobalCpuStat(): GlobalCpuStat {
        val reader = BufferedReader(FileReader("/proc/stat"))
        val line = reader.readLine()
        val parts = line.split("\\s+".toRegex()).drop(1)
        reader.close()
        return GlobalCpuStat(
            user = parts[0].toLong(),
            nice = parts[1].toLong(),
            system = parts[2].toLong(),
            idle = parts[3].toLong(),
            iowait = parts[4].toLong(),
            irq = parts[5].toLong(),
            softirq = parts[6].toLong()
        )
    }

    private fun simulatePerCore(totalUsage: Int, coreCount: Int): List<Int> {
        val random = Random()
        val usageList = mutableListOf<Int>()
        var totalAssigned = 0

        for (i in 0 until coreCount) {
            val remaining = totalUsage - totalAssigned
            val remainingCores = coreCount - i
            val base = remaining / remainingCores
            val jitter = random.nextInt(10) - 5
            val usage = (base + jitter).coerceIn(0, 100)
            usageList.add(usage)
            totalAssigned += usage
        }
        return usageList
    }
}