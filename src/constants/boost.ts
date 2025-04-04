export interface BoostInfo {
    id: string
    name: string
    pairMint?: string | null
    lpMint: string
    lpId: string
    defi: string
    defiImage?: string | null
    tokenImage: string
    pairImage?: string | null
    lut?: string | null
    pairId?: string | null
    pairTicker?: string | null
    decimals: number
}

export const BOOSTLIST_LEGACY: Record<string, BoostInfo> = {
    "619u5FbmEh34hq4bUaM5yBRS4TuhUkQhPMTUL6rXscDC": {
        id: 'ore',
        name: 'ORE',
        lpMint: 'oreoU2P8bN6jkk3jbaiVxYnG1dCXcYxwhwyK9jSybcp',
        lpId: 'default',
        defi: 'default',
        defiImage: null,
        tokenImage: 'OreToken',
        lut: null,
        pairId: null,
        pairMint: null,
        pairImage: null,
        pairTicker: null,
        decimals: 11
    },
    "48J2TSpVpwmrwW84sMERcZigeAeFuUnC8bKHp7ET6RXt": {
        id: 'kore-sol',
        name: 'KORE-SOL',
        lpMint: '8H8rPiWW4iTFCfEkSnf7jpqeNpFfvdH9gLouAL3Fe2Zx',
        lpId: '6TFdY15Mxty9sRCtzMXG8eHSbZy4oiAEQUvLQdz9YwEn',
        defi: 'kamino',
        defiImage: 'KaminoLogo',
        tokenImage: 'OreToken',
        lut: 'RtzNY3VVuJHteXtF22v3ctLiksttnMSTLfgPFzyFDz2',
        pairId: 'sol',
        pairMint: 'So11111111111111111111111111111111111111112',
        pairImage: 'SolanaToken',
        pairTicker: 'SOL',
        decimals: 6
    },
    "D4qtrWeNpJnZpmT9Fe2kx5oJf3E4ovorZgE6K6ux7Lqt": {
        id: 'ore-sol-mlp',
        name: 'ORE-SOL MLP',
        lpMint: 'DrSS5RM7zUd9qjUEdDaf31vnDUSbCrMto6mjqTrHFifN',
        lpId: 'GgaDTFbqdgjoZz3FP7zrtofGwnRS4E6MCzmmD5Ni1Mxj',
        defi: 'meteora',
        defiImage: 'MeteoraLogo',
        tokenImage: 'OreToken',
        lut: null,
        pairId: 'sol',
        pairMint: 'So11111111111111111111111111111111111111112',
        pairImage: 'SolanaToken',
        pairTicker: 'SOL',
        decimals: 11
    },
    "EExSorxnhxVKqnhNT4dNPNa8zvRBNBgju6n91F9cnKKy": {
        id: 'kore-hnt',
        name: 'KORE-HNT',
        lpMint: '7G3dfZkSk1HpDGnyL37LMBbPEgT4Ca6vZmZPUyi2syWt',
        lpId: '9XsAPjk1yp4U6hKZj9r9szhcxBi3RidGuyxiC2Y8JtAe',
        defi: 'kamino',
        defiImage: 'KaminoLogo',
        tokenImage: 'OreToken',
        lut: 'G9aqZtDcXYYzocyVMcsd4j2m3ootcb1kKNvTXciwJLQN',
        pairId: 'hnt',
        pairMint: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',
        pairImage: 'HntToken',
        pairTicker: 'HNT',
        decimals: 6
    },
    "A2Sb1oxg2H3ecbAHaJFXccufyC7pD1CMEakJhcz2TeH9": {
        id: 'ore-sol-usdc',
        name: 'ORE-USDC MLP',
        lpMint: '9BAWwtAZiF4XJC6vArPM8JhtgKXfeoeo9FJHeR3PEGac',
        lpId: '7XNR3Ysqg2MbfQX8iMWD4iEF96h2GMsWNT8eZYsLTmua',
        defi: 'meteora',
        defiImage: 'MeteoraLogo',
        tokenImage: 'OreToken',
        lut: null,
        pairId: 'usdc',
        pairMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        pairImage: 'UsdcToken',
        pairTicker: 'USDC',
        decimals: 11
    }
}

export const BOOSTLIST: Record<string, BoostInfo> = {
    "D3U1nvrCapUiuCK3T3asBPyeKjYptVA4RTXcDTqNpP14": {
        id: 'ore',
        name: 'ORE',
        lpMint: 'oreoU2P8bN6jkk3jbaiVxYnG1dCXcYxwhwyK9jSybcp',
        lpId: 'default',
        defi: 'default',
        defiImage: null,
        tokenImage: 'OreToken',
        lut: null,
        pairId: null,
        pairMint: null,
        pairImage: null,
        pairTicker: null,
        decimals: 11
    },
    "5ksboZUb57ZuwEkRRHCK8s6BpiNABneKndvkowZdvGhy": {
        id: 'kore-sol',
        name: 'KORE-SOL',
        lpMint: '8H8rPiWW4iTFCfEkSnf7jpqeNpFfvdH9gLouAL3Fe2Zx',
        lpId: '6TFdY15Mxty9sRCtzMXG8eHSbZy4oiAEQUvLQdz9YwEn',
        defi: 'kamino',
        defiImage: 'KaminoLogo',
        tokenImage: 'OreToken',
        lut: 'RtzNY3VVuJHteXtF22v3ctLiksttnMSTLfgPFzyFDz2',
        pairId: 'sol',
        pairMint: 'So11111111111111111111111111111111111111112',
        pairImage: 'SolanaToken',
        pairTicker: 'SOL',
        decimals: 6
    },
    "5qVQiZXaRffQUqD4NmJ5EXHBAbmfdABZxUb714cJATQp": {
        id: 'ore-sol-mlp',
        name: 'ORE-SOL MLP',
        lpMint: 'DrSS5RM7zUd9qjUEdDaf31vnDUSbCrMto6mjqTrHFifN',
        lpId: 'GgaDTFbqdgjoZz3FP7zrtofGwnRS4E6MCzmmD5Ni1Mxj',
        defi: 'meteora',
        defiImage: 'MeteoraLogo',
        tokenImage: 'OreToken',
        lut: null,
        pairId: 'sol',
        pairMint: 'So11111111111111111111111111111111111111112',
        pairImage: 'SolanaToken',
        pairTicker: 'SOL',
        decimals: 11
    },
    "h4nsGY9yhdfSW6Fwb6WSJEi9hHCviLdzQjcqzYWeKhd": {
        id: 'kore-hnt',
        name: 'KORE-HNT',
        lpMint: '7G3dfZkSk1HpDGnyL37LMBbPEgT4Ca6vZmZPUyi2syWt',
        lpId: '9XsAPjk1yp4U6hKZj9r9szhcxBi3RidGuyxiC2Y8JtAe',
        defi: 'kamino',
        defiImage: 'KaminoLogo',
        tokenImage: 'OreToken',
        lut: 'G9aqZtDcXYYzocyVMcsd4j2m3ootcb1kKNvTXciwJLQN',
        pairId: 'hnt',
        pairMint: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',
        pairImage: 'HntToken',
        pairTicker: 'HNT',
        decimals: 6
    },
    "8BEzwBTDsKWnjgjxi8Cca7ZatPZQhxUMgS8qWzBhDhrC": {
        id: 'ore-sol-usdc',
        name: 'ORE-USDC MLP',
        lpMint: '9BAWwtAZiF4XJC6vArPM8JhtgKXfeoeo9FJHeR3PEGac',
        lpId: '7XNR3Ysqg2MbfQX8iMWD4iEF96h2GMsWNT8eZYsLTmua',
        defi: 'meteora',
        defiImage: 'MeteoraLogo',
        tokenImage: 'OreToken',
        lut: null,
        pairId: 'usdc',
        pairMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        pairImage: 'UsdcToken',
        pairTicker: 'USDC',
        decimals: 11
    }
}