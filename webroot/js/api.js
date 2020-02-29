class AbhakelnApi {
  constructor(appState, apiEndpoint) {
    this.appState = appState;
    this.apiEndpoint = apiEndpoint;
    this.encryption = new Encryption();
    this.db = new Storage();
  }

  async loadLists() {
    const resp = await fetch(this.apiEndpoint + "/lists/");
    const data = await resp.json();
    this._clearArray(this.appState.lists);
    data.forEach(list => {
      this.appState.lists.push(this.encryption.decryptListData(list, this.appState.userData.userId, this.appState.masterKey));
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
      this.appState.listData.items.push(this.encryption.decryptItemData(item, list, this.appState.userData.userId, this.appState.masterKey));
    });
  }

  createList(listData) {
    fetch(this.apiEndpoint + "lists/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(this.encryption.encryptListData(listData, this.appState.masterKey))
    });
  }

  createItem(itemData, list) {
    fetch(this.apiEndpoint + "lists/" + list._id + "/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(this.encryption.encryptItemData(itemData, list, this.appState.userData.userId, this.appState.masterKey))
    });
  }

  updateItem(itemData, list) {
    fetch(this.apiEndpoint + "items/" + itemData._id + "/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(this.encryption.encryptItemData(itemData, list, this.appState.userData.userId, this.appState.masterKey))
    });
  }

  _clearArray(array) {
    array.length = 0;
    array.pop(); // will update DOM, too
  }
}
