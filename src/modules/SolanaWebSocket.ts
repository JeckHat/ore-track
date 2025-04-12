import { NativeModules } from "react-native"

const { RNSolanaWebSocket } = NativeModules

class SolanaWebSocket {
    constructor() {}

    startService(url: string, account: { id: string, account: string }[]) {
        RNSolanaWebSocket.startService(url, account);
    }

    stopService() {
        RNSolanaWebSocket.stopService();
    };

    getModule() {
        return RNSolanaWebSocket
    }
}

export default new SolanaWebSocket()