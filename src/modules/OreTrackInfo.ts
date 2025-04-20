import { NativeModules } from 'react-native';

const { OreTrackInfoModule } = NativeModules

class OreTrackInfo {
    constructor() {}

    async getVersionName() {
        return await OreTrackInfoModule.getVersionName()
    }

}

export default new OreTrackInfo()