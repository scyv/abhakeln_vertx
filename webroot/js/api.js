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
    this.appState.clearLists();
    const lists = [];
    const invitationLists = [];
    data.forEach(list => {
      const decryptedList = this.encryption.decryptListData(list, this.appState.userData.userId, this.appState.masterKey);
      if (decryptedList.nokey) {
        invitationLists.push(list);
      } else {
        lists.push(decryptedList);
      }
    });
    lists.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));
    this.appState.lists = lists;
    this.appState.invitationLists = invitationLists;
    this.appState.hasOpenInvitations = invitationLists.length > 0;
    if (this.appState.selectedList === null && data.length > 0) {
      this.appState.selectedList = data[0];
      this.loadItems(this.appState.selectedList);
    }
  }

  async loadItems(list) {
    if (list.nokey) {
      this.appState.clearItems();
      return;
    }
    const resp = await fetch(this.apiEndpoint + "/lists/" + list._id + "/");
    const data = await resp.json();
    this.appState.clearItems();
    const items = [];
    data.items.forEach(item => {
      items.push(this.encryption.decryptItemData(item, list, this.appState.userData.userId, this.appState.masterKey));
    });
    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    this.appState.listData.items = items;
  }

  createList(listData) {
    return fetch(this.apiEndpoint + "lists/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(this.encryption.encryptListData(listData, this.appState.masterKey))
    });
  }

  createItem(itemData, list) {
    return fetch(this.apiEndpoint + "lists/" + list._id + "/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(this.encryption.encryptItemData(itemData, list, this.appState.userData.userId, this.appState.masterKey))
    });
  }

  updateItem(itemData, list) {
    return fetch(this.apiEndpoint + "items/" + itemData._id + "/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(this.encryption.encryptItemData(itemData, list, this.appState.userData.userId, this.appState.masterKey))
    });
  }

  shareList(list, userName, listName, listPwd) {
    const listKey = this.encryption.decryptListKey(list, this.appState.userData.userId, this.appState.masterKey);
    return fetch(this.apiEndpoint + "share/" + list._id + "/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userName: userName,
        listName: listName,
        encryptedKey: this.encryption.encrypt(listKey, listPwd)
      })
    });
  }

  async confirmShareList(list, password) {
    const invitation = list.owners.filter(o => o.userId === this.appState.userData.userId)[0];
    const listKey = this.encryption.decrypt(invitation.encryptedKey, password);
    const encryptedListKey = this.encryption.encrypt(listKey, this.appState.masterKey);

    return fetch(this.apiEndpoint + "share/" + list._id + "/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        listKey: encryptedListKey
      })
    });
  }
}
