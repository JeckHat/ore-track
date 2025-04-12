import { useEffect } from "react"
import { NativeEventEmitter } from "react-native"

import SolanaWebSocket from "@modules/SolanaWebSocket"
const solanaEmitter = new NativeEventEmitter(SolanaWebSocket.getModule())
  
export const startSolanaSocket = (url: string, accounts: { id: string, account: string }[]) => {
    SolanaWebSocket.startService(url, accounts)
}
  
export const useSolanaSocket = (
    url: string,
    accounts: { id: string, account: string }[],
    onMessage: (event: { id: string; data: any }) => void
) => {
    useEffect(() => {
        if (!url || accounts.length === 0) return

        const sub = solanaEmitter.addListener("SolanaSocketEvent", (event) => {
            onMessage(event)
        });
    
        startSolanaSocket(url, accounts)
    
        return () => {
            sub.remove()
            SolanaWebSocket.stopService()
        };
    }, [url, JSON.stringify(accounts)])
}
  