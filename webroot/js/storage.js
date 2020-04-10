class Storage {
  constructor() {
    this.db = new Dexie("abhakeln");
    this.db.version(1).stores({
      keychain: "id,key",
      userdata: "id",
    });
  }

  async addMasterKey(key) {
    return await this.db.keychain.put({ id: "masterkey", key });
  }

  async getMasterKey() {
    return await this.db.keychain.where({ id: "masterkey" }).first();
  }

  async addUserData(userId) {
    return await this.db.userdata.put({ id: userId });
  }

  async getUserData() {
    return (await this.db.userdata.toArray())[0];
  }
}
