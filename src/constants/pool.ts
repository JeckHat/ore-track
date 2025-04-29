import { PublicKey } from '@solana/web3.js'
import dayjs from 'dayjs'

import { getMember } from '@services/ore/pool'

export interface PoolInfo {
    id: string
    name: string
    mint?: string
    isCoal: boolean
    api: {
        base?: string
        getBalance?: (pubkey: string) => Promise<{
            rewardsOre: number,
            rewardsCoal: number,
            lastClaimAt?: string | null,
            earnedOre?: number | null
        }>,
        getMachines?: (pubkey: string) => Promise<{ activeCount: number }>
    }
}

export const POOL_LIST: Record<string, PoolInfo> = {
    'pool-official': {
        id: 'pool-official',
        name: 'Official',
        mint: 'D44JYBNTy2PovNM5wxfYjCUbN7bmnqrPDz3jdUEHtRuL',
        isCoal: false,
        api: {
            base: 'https://pool.ore.supply',
            getBalance: async (pubkey: string) => {
                const { member } = await getMember(new PublicKey(pubkey), new PublicKey("D44JYBNTy2PovNM5wxfYjCUbN7bmnqrPDz3jdUEHtRuL"))
                return {
                    rewardsOre: (member?.balance ?? 0) / Math.pow(10, 11),
                    rewardsCoal: 0,
                    earnedOre: member?.totalBalance ?? null,
                    lastClaimAt: dayjs('1900-01-01').toISOString()
                }
            },
        }
    },
    'pool-ec1ipse-official': {
        id: 'pool-ec1ipse-official',
        name: 'Ec1ipse Official',
        mint: '9RrEyMNFhFcrqVikWby5rVn1eXeKHr2SwGRbPhZ7wDCK',
        isCoal: false,
        api: {
            base: 'https://official.ec1ipse.me',
            getBalance: async (pubkey: string) => {
                const { member } = await getMember(new PublicKey(pubkey), new PublicKey("9RrEyMNFhFcrqVikWby5rVn1eXeKHr2SwGRbPhZ7wDCK"))
                return {
                    rewardsOre: (member?.balance ?? 0) / Math.pow(10, 11),
                    rewardsCoal: 0,
                    earnedOre: member?.totalBalance ?? null,
                    lastClaimAt: dayjs('1900-01-01').toISOString()
                }
            },
        }
    },
    'pool-ec1ipse': {
        id: 'pool-ec1ipse Unofficial',
        name: 'Ec1ipse',
        isCoal: false,
        api: {
            base: 'https://ec1ipse.me',
            getBalance: async (pubkey: string) => {
                const response = await fetch(`https://ec1ipse.me/miner/rewards?pubkey=${pubkey}`)
                const result = await response.text()
                return {
                    rewardsOre: (Number(result) * Math.pow(10, 11)) / Math.pow(10, 11),
                    rewardsCoal: 0,
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
                    rewardsOre: (res.earned - res.claimed) / Math.pow(10, 11),
                    rewardsCoal: 0,
                    earnedOre: res.earned,
                    lastClaimAt: dayjs('1900-01-01').toISOString()
                }
            },
            getMachines: async (pubkey: string) => {
                const response = await fetch(`https://api.gpool.cloud/member/${pubkey}/workers`, {
                    method: 'GET'
                })
                const rawWorkers = await response.json()
        
                function toUtcDate(dateString: string) {
                    if (!dateString.endsWith('Z')) {
                        return new Date(dateString + 'Z');
                    }
                    return new Date(dateString);
                }
        
                const latestMap = new Map();
                rawWorkers.forEach((item: any) => {
                    const existing = latestMap.get(item.name);
                    if (!existing || toUtcDate(item.minute) > toUtcDate(existing.minute)) {
                        latestMap.set(item.name, item);
                    }
                })
        
                const nowUtcMs = Date.now();
                const twoMinutesMs = 2 * 60 * 1000;
                let totalHashrate = 0
                let activeCount = 0
        
                const workers = Array.from(latestMap.values()).map(worker => {
                    const workerTimeMs = toUtcDate(worker.minute).getTime();
                    const isActive = nowUtcMs - workerTimeMs <= twoMinutesMs;
                    if(isActive) {
                        activeCount++
                        totalHashrate += worker.khs
                    }
                
                    return {
                        ...worker,
                        isActive: isActive,
                        offlineHours: isActive? 0 : (nowUtcMs - workerTimeMs) / 1000 / 60 / 60
                    };
                })

                return { activeCount: activeCount }
            }
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
                    rewardsOre: resData.ore,
                    rewardsCoal: resData.coal,
                    earnedOre: null,
                    lastClaimAt: lastClaimAt
                }
            },
            getMachines: async (pubkey: string) => {
                const day = dayjs()
                const response = await fetch(`https://pool.excalivator.xyz/miner/submissions?pubkey=${pubkey}`, {
                    method: 'GET'
                })
                const resData = await response.json()

                let challengeId = resData[0].challenge_id
                let activeCount = 0
                
                if (resData.length > 0)
                    for(let i=0; i<resData.length; i++) {
                        if (challengeId !== resData[i].challenge_id) {
                            break;
                        } else {
                            activeCount++
                        }
                    }
                return { activeCount: activeCount }
            }
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