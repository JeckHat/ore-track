export interface TokenInfo {
    id: string
    name: string
    ticker: string
    image: string
    pairImage?: string | null
    decimals: number
    isLP: boolean
    boostAddress?: string
    isAlways: boolean
}

export const TOKENLIST: Record<string, TokenInfo> = {
    "So11111111111111111111111111111111111111112": {
        id: 'sol',
        name: 'Solana',
        ticker: 'SOL',
        image: 'SolanaToken',
        pairImage: null,
        decimals: 9,
        isLP: false,
        boostAddress: undefined,
        isAlways: true
    },
    "oreoU2P8bN6jkk3jbaiVxYnG1dCXcYxwhwyK9jSybcp": {
        id: 'ore',
        name: 'ORE',
        ticker: 'ORE',
        image: 'OreToken',
        pairImage: null,
        decimals: 11,
        isLP: false,
        boostAddress: "D3U1nvrCapUiuCK3T3asBPyeKjYptVA4RTXcDTqNpP14",
        isAlways: true
    },
    "E3yUqBNTZxV8ELvW99oRLC7z4ddbJqqR4NphwrMug9zu": {
        id: 'coal',
        name: 'COAL',
        ticker: 'COAL',
        image: 'CoalToken',
        pairImage: null,
        decimals: 11,
        isLP: false,
        boostAddress: undefined,
        isAlways: true
    },
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": {
        id: 'usdc',
        name: 'USDC',
        ticker: 'USDC',
        image: 'UsdcToken',
        pairImage: null,
        decimals: 6,
        isLP: false,
        boostAddress: undefined,
        isAlways: true
    },
    "hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux": {
        id: 'hnt',
        name: 'HNT',
        ticker: 'HNT',
        image: 'HntToken',
        pairImage: null,
        decimals: 8,
        isLP: false,
        boostAddress: undefined,
        isAlways: false
    },
    "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN": {
        id: 'jup',
        name: 'JUP',
        ticker: 'JUP',
        image: 'JupiterToken',
        pairImage: null,
        decimals: 6,
        isLP: false,
        boostAddress: undefined,
        isAlways: true
    },
    "8H8rPiWW4iTFCfEkSnf7jpqeNpFfvdH9gLouAL3Fe2Zx": {
        id: 'kore-sol',
        name: 'kORE-SOL',
        ticker: 'kORE-SOL',
        image: 'OreToken',
        pairImage: 'SolanaToken',
        decimals: 6,
        isLP: true,
        boostAddress: "5ksboZUb57ZuwEkRRHCK8s6BpiNABneKndvkowZdvGhy",
        isAlways: false
    },
    "DrSS5RM7zUd9qjUEdDaf31vnDUSbCrMto6mjqTrHFifN": {
        id: 'ore-sol-mlp',
        name: 'ORE-SOL MLP',
        ticker: 'ORE-SOL MLP',
        image: 'OreToken',
        pairImage: 'SolanaToken',
        decimals: 11,
        isLP: true,
        boostAddress: "5qVQiZXaRffQUqD4NmJ5EXHBAbmfdABZxUb714cJATQp",
        isAlways: false
    },
    "7G3dfZkSk1HpDGnyL37LMBbPEgT4Ca6vZmZPUyi2syWt": {
        id: 'kore-hnt',
        name: 'kORE-HNT',
        ticker: 'kORE-HNT',
        image: 'OreToken',
        pairImage: 'HntToken',
        decimals: 6,
        isLP: true,
        boostAddress: "h4nsGY9yhdfSW6Fwb6WSJEi9hHCviLdzQjcqzYWeKhd",
        isAlways: false
    },
    "9BAWwtAZiF4XJC6vArPM8JhtgKXfeoeo9FJHeR3PEGac": {
        id: 'ore-usdc-mlp',
        name: 'ORE-USDC MLP',
        ticker: 'ORE-USDC MLP',
        image: 'OreToken',
        pairImage: 'UsdcToken',
        decimals: 11,
        isLP: true,
        boostAddress: "8BEzwBTDsKWnjgjxi8Cca7ZatPZQhxUMgS8qWzBhDhrC",
        isAlways: false
    },

}