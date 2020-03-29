// inital app state
const appState = {
  lists: [],
  allItems: {},
  selectedList: null,
  selectedItem: null,
  joinList: null,
  showDone: false,
  listData: {
    items: []
  },
  hasOpenInvitations: true,
  invitationLists: [],
  masterKey: null,
  wunderlistImportVisible: false,
  shareListVisible: false,
  listsVisible: true,
  itemsVisible: false,
  detailsVisible: false,
  joinListVisible: false,
  noteeditmode: false,
  menuAlert: false,
  listMenuVisible: false,
  itemMenuVisible: false,
  renameItemVisible: false,
  renameListVisible: false,
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
const dnd = new DragAndDropSupport();

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
