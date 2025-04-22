import { useEffect, useState } from "react"
import { Alert, Keyboard, View } from "react-native"
import * as bip39 from "bip39"
import Clipboard from '@react-native-clipboard/clipboard'
import { Keypair } from "@solana/web3.js"
import { useDispatch } from "react-redux"
import bs58 from 'bs58'

import { Button, CustomText, Input, KeyboardDismissPressable } from "@components"
import { PrivateKeyNavigationProps } from "@navigations/types"
import { mnemonicToSeedFast } from "@helpers"
import { Colors } from "@styles"
import { CustomError } from "@models"
import { uiActions } from "@store/actions"
import { ChevronLeftIcon } from "@assets/icons"

function WrapPhraseWord(props?: { text?: string, number?: string } ) {
    return (
        <View className="w-1/2 px-3">
            <View className={`border border-solid border-gray-800 rounded-full overflow-hidden flex-row items-center bg-baseComponent`}>
                <View className="w-11 pl-5 py-2 border-r border-solid border-r-gray-800">
                    <CustomText className="text-primary font-PlusJakartaSans text-md">{props?.number}</CustomText>
                </View>
                <View className="flex-1 px-2">
                    <CustomText
                        className="text-primary font-PlusJakartaSansBold text-md w-full selection:text-gold"
                        selectable
                    >
                        {props?.text}
                    </CustomText>
                </View>
            </View>
        </View>
    )
}

export default function PrivateKeyScreen({ navigation, route }: PrivateKeyNavigationProps) {
    const [words, setWords] = useState("")
    const [textCopy, setTextCopy] = useState("Copy to clipboard")

    const dispatch = useDispatch()

    useEffect(() => {
        if (!route?.params?.importWallet) {
            const newWords = bip39.generateMnemonic()
            setWords(newWords)
        }
        if (route?.params?.words) {
            setWords(route?.params?.words ?? '')
        }
    }, [route?.params?.importWallet, route?.params?.words])

    function onCopyWord() {
        Clipboard.setString(words)
        setTextCopy("Copied")
        setTimeout(() => {
            setTextCopy("Copy to clipboard")
        }, 1000)
    }

    async function onNext() {
        dispatch(uiActions.showLoading(true))
        try {
            if(route?.params?.isSeedPhrase) {
                await onNextSeedPhrase()
            } else {
                await onNextPrivateKey()
            }

            dispatch(uiActions.showLoading(false))
            route.params?.onNext?.(navigation)
        } catch(error) {
            dispatch(uiActions.showLoading(false))
            if (error instanceof CustomError) {
                Alert.alert(error.message)
            } else if (error instanceof Error) {
                Alert.alert(error.message)
            } else {
                console.error("Error:", error);
            }
        } 
    }

    async function onNextSeedPhrase() {
        const isValid = bip39.validateMnemonic(words)
        if(!isValid) {
            throw new CustomError("Phrase Key is not valid", 500)
        }
        const seed = await mnemonicToSeedFast(words)
        const keypair = Keypair.fromSeed(seed.subarray(0, 32))
        await route.params?.onSubmit?.(keypair, words)
    }

    async function onNextPrivateKey() {
        let secretKey: Uint8Array;
        const trimmed = words.trim();

        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            const arr = JSON.parse(trimmed);
            if (!Array.isArray(arr) || arr.length !== 64) {
                return { error: 'Array JSON must 64 size' };
            }
            secretKey = Uint8Array.from(arr);
        } else if (/^[1-9A-HJ-NP-Za-km-z]+$/.test(trimmed)) {
            const decoded = bs58.decode(trimmed);
            if (decoded.length !== 64) {
                return { error: 'Base58 harus decode jadi 64 byte' };
            }
            secretKey = decoded;
        } else {
            const decoded = Uint8Array.from(Buffer.from(trimmed, 'base64'));
            if (decoded.length !== 64) {
                return { error: 'Base64 harus decode jadi 64 byte' };
            }
            secretKey = decoded;
        }

        const keypair = Keypair.fromSecretKey(secretKey)
        await route.params?.onSubmit?.(keypair)
    }

    return (
        <KeyboardDismissPressable className="flex-1 bg-baseBg px-2">
            <View className={`mt-10 flex-row items-center`}>
                <ChevronLeftIcon
                    width={32} height={32} color={Colors.primary}
                    onPress={() => navigation.goBack()}
                />
                <CustomText
                    className="text-primary font-PlusJakartaSansSemiBold text-lg"
                    onPress={() => navigation.goBack()}
                >
                    Back
                </CustomText>
            </View>
            <View className="px-2 mb-8">
                <CustomText className="text-primary font-PlusJakartaSansBold text-3xl text-center mb-3">{route.params?.title}</CustomText>
                {route?.params?.words && (
                    <View className="m-4 items-center mb-2 bg-red-900/20 px-4 py-2 rounded-xl">
                        <CustomText className="text-red-600 mb-1 font-PlusJakartaSansBold text-lg opacity-100">
                            {`Do not share your ${route.params?.title}`}
                        </CustomText>
                        <CustomText className="text-red-600 font-PlusJakartaSans text-sm text-center">
                            {`If someone has your ${route.params?.title} may will have full control of your wallet`}
                        </CustomText>
                    </View>
                )}
                {route?.params?.importWallet && !route?.params?.words && route?.params?.isSeedPhrase && (
                    <CustomText
                        className="text-lowEmphasis font-PlusJakartaSans text-lg text-center"
                        selectable selectionColor="#ECC771"
                    >
                        Restore an existing wallet with your 12-word or 24-word recovery phrase
                    </CustomText>
                )}
                {route?.params?.importWallet && !route?.params?.words && !route?.params?.isSeedPhrase && (
                    <CustomText
                        className="text-lowEmphasis font-PlusJakartaSans text-lg text-center"
                        selectable selectionColor="#ECC771"
                    >
                        Import your private key
                    </CustomText>
                )}
                {!route?.params?.importWallet && !route?.params?.words && (
                    <CustomText
                        className="text-lowEmphasis font-PlusJakartaSans text-lg text-center"
                        selectable selectionColor="#ECC771"
                    >
                        This is the only way you will be able to recover your account. Please Store it somewhere safe!
                    </CustomText>
                )}
            </View>
            {!route?.params?.importWallet && <View className="flex-1">
                <View className="flex-row flex-wrap gap-y-4">
                    {words?.split(" ").map((wrapText, idx) => (
                        <WrapPhraseWord
                            key={`recovery-wrapText-${idx}`}
                            number={(idx + 1).toString()}
                            text={wrapText}
                        />
                    ))}
                </View>
                
                <View className="flex-row mt-8 items-center w-full justify-center">
                    <CustomText
                        onPress={onCopyWord}
                        className="font-PlusJakartaSansBold text-primary text-center text-md"
                    >
                        {textCopy}
                    </CustomText>
                </View>
            </View>}
            {route?.params?.importWallet && <View className="flex-1">
                <Input
                    containerClassName="mx-4"
                    className="font-PlusJakartaSans text-primary text-md h-32 align-top placeholder:text-gray-700"
                    cursorColor={Colors.primary}
                    placeholder={route.params?.title}
                    multiline
                    value={words}
                    onChangeText={setWords}
                    onSubmitEditing={() => Keyboard.dismiss()}
                />
            </View>}
            {!route?.params?.words && <View className="my-4 w-full px-[8%]">
                <Button
                    containerClassName="rounded-full my-5"
                    title="Next"
                    disabled={!words}
                    onPress={onNext}
                />
            </View>}
            {route?.params?.words && <View className="my-4 w-full px-[8%]">
                <Button
                    containerClassName="rounded-full my-5"
                    title="Back"
                    disabled={!words}
                    onPress={() => navigation.goBack()}
                />
            </View>}
        </KeyboardDismissPressable>
    )
}