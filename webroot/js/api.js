class AbhakelnApi {
  constructor(appState, apiEndpoint) {
    this.appState = appState;
    this.apiEndpoint = apiEndpoint;
  }

  async loadLists() {
    const resp = await fetch(this.apiEndpoint + "/lists/");
    const data = await resp.json();
    this._clearArray(this.appState.lists);
    data.forEach(list => {
      this.appState.lists.push(list);
    });
    if (appState.selectedList === null && data.length > 0) {
      this.appState.selectedList = data[0]._id;
      this.loadItems(this.appState.selectedList);
    }
  }

  async loadItems(listId) {
    const resp = await fetch(this.apiEndpoint + "/lists/" + listId + "/");
    const data = await resp.json();
    this._clearArray(appState.listData.items);
    data.items.forEach(item => {
      this.appState.listData.items.push(item);
    });
  }

  _clearArray(array) {
    array.length = 0;
    array.pop(); // will update DOM, too
  }

  createList(listData) {
    fetch(this.apiEndpoint + "/lists/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(listData)
    });
  }

  createItem(itemData, listId) {
    fetch(this.apiEndpoint + "/lists/" + listId + "/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(itemData)
    });
  }

  updateItem(itemData) {
    fetch(this.apiEndpoint + "/items/" + itemData._id + "/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(itemData)
    });
  }
}
