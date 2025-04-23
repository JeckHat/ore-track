import crypto from 'react-native-quick-crypto'
import { derivePath } from 'ed25519-hd-key'
import { PersistPartial } from 'redux-persist/es/persistReducer'

import { RootState } from '@store/types'

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

export function delimiterFormat(number: number | string, separator = ',') {
    let newNumber = number.toString();
    let isMinus = newNumber[0] === '-';
    let numberString = isMinus ? newNumber.substring(1, newNumber.length - 1) : newNumber;
    numberString = numberString.split('.')[0];
    let decimal = newNumber.split('.')[1];
    let modulus = numberString.length % 3;
    let currency = numberString.substring(0, modulus);
    let thousand = numberString.substring(modulus).match(/\d{3}/g);
  
    if (thousand) {
      let separate = modulus ? separator : '';
      currency += separate + thousand.join(separator);
    }
  
    return `${isMinus ? '- ' : ''}${currency}.${decimal}`;
}

export function shortenAddress(address: string, chars: number = 4) {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function bigIntToNumber(bn: bigint): number {
    const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
    if (bn > MAX_SAFE) {
        throw new Error(`BigInt value ${bn} is too large to convert safely to a number.`);
    }
    return Number(bn);
}

export function calculatePoolRewardsFromState(poolId: string, state: Partial<RootState> & PersistPartial) {
    const pool = state.pools?.byId[poolId];
    const minerPools = state.minerPools?.byId;
  
    let runningCount = 0;
    let rewardsOre = 0;
    let rewardsCoal = 0;
    let avgOre = 0;
    let avgCoal = 0;
  
    if (!pool) return { runningCount, rewardsOre, rewardsCoal, avgOre, avgCoal };
        
    pool.minerPoolIds.forEach(minerPoolId => {
        const minerPool = minerPools?.[minerPoolId]
        if (!minerPool) return
    
        if (minerPool.running) runningCount++
        rewardsOre += minerPool.rewardsOre || 0
        rewardsCoal += minerPool.rewardsCoal || 0
        avgOre += minerPool.avgRewards?.ore || 0
        avgCoal += minerPool.avgRewards?.coal || 0
    })
  
    return {
        runningCount,
        rewardsOre,
        rewardsCoal,
        avgOre,
        avgCoal
    }
}
