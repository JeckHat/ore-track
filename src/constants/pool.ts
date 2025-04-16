export interface PoolInfo {
    id: string
    name: string
    isCoal: boolean
    api: {
        base?: string
        getBalance?: (pubkey: string) => Promise<{ balanceOre: number, balanceCoal: number }>
    }
}

export const POOL_LIST: Record<string, PoolInfo> = {
    'pool-official': {
        id: 'pool-official',
        name: 'Official',
        isCoal: false,
        api: {
            base: 'https://official.ec1ipse.me',
            getBalance: async (pubkey: string) => {
                const response = await fetch(`https://official.ec1ipse.me/member/${pubkey}`)
                const res = await response.json()
                return {
                    balanceOre: res.total_balance / Math.pow(10, 11),
                    balanceCoal: 0
                }
            },
        }
    },
    'pool-gpool': {
        id: 'pool-gpool',
        name: 'Gpool',
        isCoal: false,
        api: {
            base: 'https://api.gpool.cloud',
            getBalance: async (pubkey: string) => {
                const response = await fetch(`https://api.gpool.cloud/member/${pubkey}/balance`)
                const res = await response.json()
                return {
                    balanceOre: (res.earned - res.claimed) / Math.pow(10, 11),
                    balanceCoal: 0
                }
            },
        }
    },
    'pool-excalivator': {
        id: 'pool-excalivator',
        name: 'Excalivator',
        isCoal: true,
        api: {
            base: 'https://pool.coal-pool.xyz',
            getBalance: async (pubkey: string) => {
                const response = await fetch(`https://pool.coal-pool.xyz/miner/rewards?pubkey=${pubkey}`)
                const res = await response.json()
                return {
                    balanceOre: res.ore,
                    balanceCoal: res.coal
                }
            },
        }
    },
    'pool-oreminepool': {
        id: 'pool-oreminepool',
        name: 'OreMinePool',
        isCoal: true,
        api: {}
    },
    'pool-ec1ipse': {
        id: 'pool-ec1ipse',
        name: 'Ec1ipse',
        isCoal: false,
        api: {}
    },
    'pool-twpool': {
        id: 'pool-twpool',
        name: 'Tw-Pool',
        isCoal: true,
        api: {}
    }
}