import crypto from 'react-native-quick-crypto'
import { derivePath } from 'ed25519-hd-key'

export async function mnemonicToSeedFast(mnemonic: string): Promise<Buffer> {
    const salt = "mnemonic";
    const iterations = 2048;
    const keyLen = 64;
    const digest = "sha512";
  
    return new Promise<Buffer>((resolve, reject) => {
        crypto.pbkdf2(mnemonic, salt, iterations, keyLen, digest, (err, derivedKey) => {
            if (err) reject(err)
            else if (!derivedKey) reject("Empty Buffer")
            else {
                const path44Change = `m/44'/501'/0'/0'`
                const derivedSeed = derivePath(path44Change, derivedKey?.toString("hex")).key;
                resolve(derivedSeed)
            }
        });
    });
}
