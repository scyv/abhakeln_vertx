class AbhakelnApi {
  constructor(appState, apiEndpoint) {
    this.appState = appState;
    this.apiEndpoint = apiEndpoint;
    this.crypto = new SodiumWrapper();
    this.db = new Storage();
  }

  async loadLists() {
    const resp = await fetch(this.apiEndpoint + "/lists/");
    const data = await resp.json();
    this._clearArray(this.appState.lists);
    data.forEach(list => {
      this.appState.lists.push(this._decryptListData(list));
    });
    if (this.appState.selectedList === null && data.length > 0) {
      this.appState.selectedList = data[0];
      this.loadItems(this.appState.selectedList);
    }
  }

  async loadItems(list) {
    const resp = await fetch(this.apiEndpoint + "/lists/" + list._id + "/");
    const data = await resp.json();
    this._clearArray(this.appState.listData.items);
    data.items.forEach(item => {
      this.appState.listData.items.push(this._decryptItemData(item, list));
    });
  }

  createList(listData) {
    fetch(this.apiEndpoint + "/lists/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(this._encryptListData(listData))
    });
  }

  createItem(itemData, list) {
    fetch(this.apiEndpoint + "/lists/" + list._id + "/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(this._encryptItemData(itemData, list))
    });
  }

  updateItem(itemData, list) {
    fetch(this.apiEndpoint + "/items/" + itemData._id + "/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(this._encryptItemData(itemData, list))
    });
  }

  _clearArray(array) {
    array.length = 0;
    array.pop(); // will update DOM, too
  }

  _encryptListData(listData) {
    console.log(this.masterKey);
    const listKey = this.crypto.createKey();
    listData.key = this.crypto.encrypt(listKey, this.appState.masterKey);
    const copy = Object.assign({}, listData);
    copy.name = this.crypto.encrypt(copy.name, listKey);
    return copy;
  }

  _encryptItemData(itemData, list) {
    const copy = Object.assign({}, itemData);
    if (copy.task) {
      copy.task = this.crypto.encrypt(copy.task, this.crypto.decrypt(list.key, this.appState.masterKey));
    }
    return copy;
  }

  _decryptListData(listData) {
    listData.name = this.crypto.decrypt(listData.name, this.crypto.decrypt(listData.key, this.appState.masterKey));
    return listData;
  }

  _decryptItemData(itemData, list) {
    itemData.task = this.crypto.decrypt(itemData.task, this.crypto.decrypt(list.key, this.appState.masterKey));
    return itemData;
  }
}
