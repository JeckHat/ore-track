package com.oretrack.modules

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class OreTrackInfoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "OreTrackInfoModule"

    @ReactMethod
    fun getVersionName(promise: Promise) {
        try {
            val context = reactApplicationContext
            val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            val versionName = pInfo.versionName
            promise.resolve(versionName)
        } catch (e: Exception) {
            promise.reject("ERR_VERSION", "Failed to get version name", e)
        }
    }
}