export interface PoolInfo {
    id: string
    name: string
    isCoal: boolean
    api: {
        base?: string,
        balance?: string,
        responseBalance?: (res: any) => { balanceOre: number, balanceCoal: 0 }
    }
}

export const POOL_LIST: Record<string, PoolInfo> = {
    'pool-official': {
        id: 'pool-official',
        name: 'Official',
        isCoal: false,
        api: {
            base: 'https://official.ec1ipse.me',
            balance: '/member/',
            responseBalance: (res) => {
                return {
                    balanceOre: res.total_balance / Math.pow(10, 11),
                    balanceCoal: 0
                }
            }
        }
    },
    'pool-gpool': {
        id: 'pool-gpool',
        name: 'Gpool',
        isCoal: false,
        api: {
            base: 'https://api.gpool.cloud',
            balance: '/balance?pubkey=',
            responseBalance: (res) => {
                return {
                    balanceOre: (res.earned - res.claimed) / Math.pow(10, 11),
                    balanceCoal: 0
                }
            }
        }
    },
    'pool-excalivator': {
        id: 'pool-excalivator',
        name: 'Excalivator',
        isCoal: true,
        api: {
            base: 'https://pool.coal-pool.xyz',
            balance: '/miner/rewards?pubkey=',
            responseBalance: (res) => {
                return {
                    balanceOre: res.ore,
                    balanceCoal: res.coal
                }
            }
        }
    },
    'pool-oreminepool': {
        id: 'pool-oreminepool',
        name: 'OreMinePool',
        isCoal: false,
        api: {}
    }
}