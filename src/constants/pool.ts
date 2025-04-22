import dayjs from 'dayjs'

export interface PoolInfo {
    id: string
    name: string
    isCoal: boolean
    api: {
        base?: string
        getBalance?: (pubkey: string) => Promise<{
            balanceOre: number,
            balanceCoal: number,
            lastClaimAt?: string | null,
            earnedOre?: number | null
        }>
    }
}

export const POOL_LIST: Record<string, PoolInfo> = {
    'pool-official': {
        id: 'pool-official',
        name: 'Official',
        isCoal: false,
        api: {
            base: 'https://pool.ore.supply',
            getBalance: async (pubkey: string) => {
                const response = await fetch(`https://pool.ore.supply/member/${pubkey}`)
                const res = await response.json()
                return {
                    balanceOre: res.total_balance / Math.pow(10, 11),
                    balanceCoal: 0,
                    earnedOre: null,
                    lastClaimAt: null
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
                    balanceCoal: 0,
                    earnedOre: res.earned,
                    lastClaimAt: dayjs('1900-01-01').toISOString()
                }
            },
        }
    },
    'pool-excalivator': {
        id: 'pool-excalivator',
        name: 'Excalivator',
        isCoal: true,
        api: {
            base: 'https://pool.excalivator.xyz',
            getBalance: async (pubkey: string) => {
                let lastClaimAt = null
                try {
                    const response = await fetch(`https://pool.excalivator.xyz/miner/last-claim?pubkey=${pubkey}`, {
                        method: 'GET'
                    })
                    const resData = await response.json()
                    lastClaimAt = resData.created_at
                } catch(error) {
                    lastClaimAt = null
                }
                const response = await fetch(`https://pool.excalivator.xyz/miner/rewards?pubkey=${pubkey}`, {
                    method: 'GET'
                })
                const resData = await response.json()
                return {
                    balanceOre: resData.ore,
                    balanceCoal: resData.coal,
                    earnedOre: null,
                    lastClaimAt: lastClaimAt
                }
            },
        }
    },
    'pool-ec1ipse': {
        id: 'pool-ec1ipse',
        name: 'Ec1ipse',
        isCoal: false,
        api: {
            base: 'https://ec1ipse.me',
            getBalance: async (pubkey: string) => {
                const response = await fetch(`https://ec1ipse.me/miner/rewards?pubkey=${pubkey}`)
                const result = await response.text()
                return {
                    balanceOre: (Number(result) * Math.pow(10, 11)) / Math.pow(10, 11),
                    balanceCoal: 0,
                    earnedOre: null,
                    lastClaimAt: null
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
    'pool-twpool': {
        id: 'pool-twpool',
        name: 'Tw-Pool',
        isCoal: true,
        api: {}
    }
}