import { NativeModules } from "react-native"

const { RNCpuUsage } = NativeModules

class CpuUsage {
    constructor() {}

    async getCpuUsage() {
        return await RNCpuUsage.getCpuUsagePerCore()
    }
    async getCpuUsagePerCoreViaTop() {
        return await RNCpuUsage.getCpuUsagePerCoreViaTop()
    }

}

export default new CpuUsage()