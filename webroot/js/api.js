class AbhakelnApi {
  constructor(appState, apiEndpoint) {
    this.appState = appState;
    this.apiEndpoint = apiEndpoint;
    this.encryption = new Encryption();
    this.notifications = new Notifications();
    this.db = new Storage();
  }

  async loadLists() {
    const resp = await fetch(this.apiEndpoint + "lists/");
    const data = await resp.json();
    const lists = [];
    const invitationLists = [];
    data.forEach((list) => {
      try {
        const decryptedList = this.encryption.decryptListData(list, this.appState.userData.userId, this.appState.masterKey);
        if (decryptedList.nokey) {
          invitationLists.push(list);
        } else {
          lists.push(decryptedList);
        }
      } catch (err) {
        console.error("Could not decrypt list", list._id, err);
      }
    });
    lists.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));
    this.appState.lists = lists;
    await this.loadAllItems();
    this.appState.invitationLists = invitationLists;
    this.appState.hasOpenInvitations = invitationLists.length > 0;
    return Promise.resolve();
  }

  async loadAllItems() {
    const resp = await fetch(this.apiEndpoint + "items/");
    const data = await resp.json();
    const groupedByList = {};
    const lists = {};
    this.appState.lists.forEach((list) => {
      lists[list._id] = list;
    });

    const notifications = new Notifications();
    notifications.clearAll();
    data.items.forEach((item) => {
      const listId = item.listId;
      const list = lists[listId];
      if (!groupedByList[listId]) {
        groupedByList[listId] = [];
      }
      try {
        const decryptedItem = this.encryption.decryptItemData(item, list, this.appState.userData.userId, this.appState.masterKey);
        groupedByList[listId].push(decryptedItem);
        notifications.triggerTaskReminder(decryptedItem);
      } catch (err) {
        console.error("Could not decrypt item", item._id);
      }
    });
    this.appState.allItems = groupedByList;
    return Promise.resolve();
  }

  createList(listData) {
    return fetch(this.apiEndpoint + "lists/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(this.encryption.encryptListData(listData, "", this.appState.masterKey, true)),
    });
  }

  updateList(listData) {
    return fetch(this.apiEndpoint + "lists/" + listData._id + "/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(this.encryption.encryptListData(listData, this.appState.userData.userId, this.appState.masterKey)),
    });
  }

  createItem(itemData, list) {
    return fetch(this.apiEndpoint + "lists/" + list._id + "/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(this.encryption.encryptItemData(itemData, list, this.appState.userData.userId, this.appState.masterKey)),
    });
  }

  updateItem(itemData, list) {
    return fetch(this.apiEndpoint + "items/" + itemData._id + "/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(this.encryption.encryptItemData(itemData, list, this.appState.userData.userId, this.appState.masterKey)),
    });
  }

  sendItemSortOrder(sorting) {
    return fetch(this.apiEndpoint + "lists/" + this.appState.selectedList._id + "/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sorting: sorting,
      }),
    });
  }

  shareList(list, userName, listName, listPwd) {
    const listKey = this.encryption.decryptListKey(list, this.appState.userData.userId, this.appState.masterKey);
    return fetch(this.apiEndpoint + "share/" + list._id + "/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userName: userName,
        listName: listName,
        encryptedKey: this.encryption.encrypt(listKey, listPwd),
      }),
    });
  }

  async confirmShareList(list, password) {
    const invitation = list.owners.filter((o) => o.userId === this.appState.userData.userId)[0];
    const listKey = this.encryption.decrypt(invitation.encryptedKey, password);
    const encryptedListKey = this.encryption.encrypt(listKey, this.appState.masterKey);

    return fetch(this.apiEndpoint + "share/" + list._id + "/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listKey: encryptedListKey,
      }),
    });
  }
}
