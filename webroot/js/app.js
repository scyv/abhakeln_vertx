// inital app state
const appState = {
  lists: [],
  selectedList: null,
  showDone: true,
  listData: {
    items: []
  },
  masterKey: null
};

const eventbus = new AbhakelnEventBus(appState);
const api = new AbhakelnApi(appState, "/api");
const app = new Abhakeln(appState, api);

(async () => {
  appState.masterKey = (await new Storage().getMasterKey()).key;
  await sodium.ready;
  app.init();
  api.loadLists();
})();
