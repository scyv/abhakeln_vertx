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
    const doneItems = [];
    const openItems = [];
    data.items.forEach(item => {
      const decrypted = this.encryption.decryptItemData(item, list, this.appState.userData.userId, this.appState.masterKey);
      if (item.done) {
        doneItems.push(decrypted);
      } else {
        openItems.push(decrypted);
      }
    });
    openItems.sort((a, b) => {
        if (a.sortOrder && b.sortOrder) {
          return (a.sortOrder > b.sortOrder ? 1 : a.sortOrder === b.sortOrder ? 0 : -1)
        }
        return (a.createdAt < b.createdAt ? 1 : a.createdAt === b.createdAt ? 0 : -1)
    });
    doneItems.sort((a, b) => {
      return (a.completedAt < b.completedAt ? 1 : a.completedAt === b.completedAt ? 0 : -1)
    });
    this.appState.listData.items = openItems.concat(doneItems);
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

  sendItemSortOrder(sorting) {
    return fetch(this.apiEndpoint + "lists/" + this.appState.selectedList._id + "/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sorting: sorting
      })
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
