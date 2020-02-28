class Storage {
    constructor() {
        this.db = new Dexie("abhakeln");
        this.db.version(1).stores({
            keychain: 'id,key'
        });
    }

    async addMasterKey(key) {
        return await this.db.keychain.put({id:"masterkey", key});
    }

    async getMasterKey() {
        return await this.db.keychain.where({id: "masterkey"}).first();
    }
}