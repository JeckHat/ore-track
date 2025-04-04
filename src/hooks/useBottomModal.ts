import { useContext } from "react"

import { BottomModalContext } from "@providers"

export const useBottomModal = () => {
    const context = useContext(BottomModalContext)
    if (!context) {
        throw new Error("useBottomModal must be used inside BottomModalProvider")
    }
    return context
}