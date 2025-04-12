package com.oremobile.modules

import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import okhttp3.*
import org.json.JSONObject
import org.json.JSONArray
import java.util.concurrent.TimeUnit

class SolanaWebSocketModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var socket: WebSocket? = null
    private var url: String = ""
    private var accounts: List<Map<String, String>> = listOf()
    private var reconnecting = false
    private var requestId = 1

    private val subscriptionIdMap = mutableMapOf<Int, String>()
    private val requestIdMap = mutableMapOf<Int, String>()

    private val client: OkHttpClient = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build()

    override fun getName() = "RNSolanaWebSocket"

    @ReactMethod
    fun startService(url: String, accounts: ReadableArray) {
        this.url = url
        this.accounts = accounts.toArrayList().mapNotNull {
            (it as? HashMap<*, *>)?.mapKeys { it.key.toString() }?.mapValues { it.value.toString() }
        }

        connect()
    }

    @ReactMethod
    fun stopService() {
        socket?.close(1000, "Manual close")
        socket = null
        subscriptionIdMap.clear()
        requestIdMap.clear()
        reconnecting = false
    }

    @ReactMethod
    fun addListener(eventName: String?) {
        // Required for RN built-in event system
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN built-in event system
    }

    private fun connect() {
        val request = Request.Builder().url(url).build()
        socket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                reconnecting = false
                subscribeToAccounts(webSocket)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                handleMessage(text)
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                socket?.cancel()
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                if (!reconnecting) handleReconnect()
            }
        })
    }

    private val subscribedAccountIds = mutableSetOf<String>()

    private fun subscribeToAccounts(ws: WebSocket) {
        for (account in accounts) {
            val id = account["id"] ?: continue
            val accountKey = account["account"] ?: continue

            if (subscribedAccountIds.contains(id)) continue

            val currentId = requestId++
            requestIdMap[currentId] = id

            val config = JSONObject().apply {
                put("encoding", "base64")
                put("commitment", "confirmed")
            }

            val params = JSONArray().apply {
                put(accountKey)
                put(config)
            }

            val payload = JSONObject().apply {
                put("jsonrpc", "2.0")
                put("id", currentId)
                put("method", "accountSubscribe")
                put("params", params)
            }

//            val payload = JSONObject().apply {
//                put("jsonrpc", "2.0")
//                put("id", currentId)
//                put("method", "accountSubscribe")
//                put("params", listOf(accountKey, mapOf(
//                    "encoding" to "base64",
//                    "commitment" to "confirmed"
//                )))
//            }

            ws.send(payload.toString())
        }
    }

    private fun handleMessage(text: String) {
        val json = JSONObject(text)

        // Subscribe response → map subscriptionId to custom ID
        if (json.has("id") && json.has("result")) {
            val id = json.getInt("id")
            val subId = json.getInt("result")
            requestIdMap[id]?.let {
                subscriptionIdMap[subId] = it
                requestIdMap.remove(id)
            }
        }



        // accountNotification
        if (json.optString("method") == "accountNotification") {
            val params = json.optJSONObject("params") ?: return
            val subId = params.optInt("subscription")
            val result = params.optJSONObject("result")
            val mappedId = subscriptionIdMap[subId] ?: return

            val payload = Arguments.createMap().apply {
                putString("id", mappedId)
                putMap("data", jsonToWritableMap(result))
            }

            sendEvent("SolanaSocketEvent", payload)
        }
    }

    private fun handleReconnect() {
        reconnecting = true
        Handler(Looper.getMainLooper()).postDelayed({
            connect()
        }, 5000)
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    private fun jsonToWritableMap(json: JSONObject?): WritableMap {
        val map = Arguments.createMap()
        if (json == null) return map
        json.keys().forEach { key ->
            when (val value = json.get(key)) {
                is String -> map.putString(key, value)
                is Int -> map.putInt(key, value)
                is Double -> map.putDouble(key, value)
                is Boolean -> map.putBoolean(key, value)
                is JSONObject -> map.putMap(key, jsonToWritableMap(value))
                else -> map.putString(key, value.toString())
            }
        }
        return map
    }
}
