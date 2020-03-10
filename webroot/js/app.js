// inital app state
const appState = {
  lists: [],
  selectedList: null,
  selectedItem: null,
  showDone: false,
  listData: {
    items: []
  },
  masterKey: null,
  wunderlistImportVisible: false,
  listsVisible: true,
  itemsVisible: false,
  detailsVisible: false,
  noteeditmode: false,
  clearItems() {
    this.listData.items.length = 0;
    this.listData.items.pop();
  },
  clearLists() {
    this.lists.length = 0;
    this.lists.pop();
  }
};

const eventbus = new AbhakelnEventBus(appState, EVENTBUS_ENDPOINT);
const api = new AbhakelnApi(appState, API_ENDPOINT);
const app = new Abhakeln(appState, api);

(async () => {
  const storage = new Storage();
  appState.masterKey = (await storage.getMasterKey()).key;
  appState.userData = {
    userId: (await storage.getUserData()).id
  };
  await sodium.ready;
  app.init();
  api.loadLists();
})();
