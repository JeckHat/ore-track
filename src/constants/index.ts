export const SOL_MINT = "So11111111111111111111111111111111111111112"
export const ORE_MINT = "oreoU2P8bN6jkk3jbaiVxYnG1dCXcYxwhwyK9jSybcp"
export const COAL_MINT = "E3yUqBNTZxV8ELvW99oRLC7z4ddbJqqR4NphwrMug9zu"

export const PROGRAM_ID = "oreV2ZymfyeXgNgBdqMkumTqqAprVqgBWQfoYkrtKWQ"
export const BOOST_ID_LEGACY = "BoosTyJFPPtrqJTdi49nnztoEWDJXfDRhyb2fha6PPy"
export const BOOST_ID = "BoostzzkNfCA9D1qNuN5xZxB5ErbK4zQuBeTHGDpXT1"
export const METEORA_VAULT_ID = "24Uqj9JCLxUeoC3hGfh5W3s9FM9uCHDS2SG3LYwBpyTi"
export const METEORA_AMM_ID = "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB"

export const PROOF = new Uint8Array([112, 114, 111, 111, 102])
export const BOOST = new Uint8Array([98, 111, 111, 115, 116])
export const STAKE = new Uint8Array([115, 116, 97, 107, 101])
export const CONFIG = new Uint8Array([99, 111, 110, 102, 105, 103])
export const TREASURY = new Uint8Array([116, 114, 101, 97, 115, 117, 114, 121])
export const MINT = new Uint8Array([109, 105, 110, 116])
export const MINT_NOISE = new Uint8Array([89, 157, 88, 232, 243, 249, 197, 132, 199, 49, 19, 234, 91, 94, 150, 41])

export const DEPOSIT_INSTRUCTION_KAMINO_DISCRIMINATOR = Buffer.from([
    242, 35, 198, 137, 82, 225, 242, 182,
]);

export const JUP_API_PRICE = "https://api.jup.ag/price/v2?ids="
export const METEORA_API = "https://app.meteora.ag/amm/pools?address="
export const KAMINO_API = "https://api.kamino.finance/strategies/"

export const BOOST_DENOMINATOR = 1000
export const COMPUTE_UNIT_LIMIT = 500000

export * from './token'
export * from './pool'
export * from './boost'
