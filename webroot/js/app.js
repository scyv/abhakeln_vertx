// inital app state
const appState = {
  lists: [],
  selectedList: null,
  showDone: false,
  listData: {
    items: []
  },
  masterKey: null,
  wunderlistImportVisible: false,
  listsVisible: true,
  itemsVisible: false
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
