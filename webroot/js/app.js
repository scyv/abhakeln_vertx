// inital app state
const appState = {
  lists: [],
  selectedList: null,
  showDone: true,
  listData: {
    items: []
  }
};

const eventbus = new AbhakelnEventBus(appState);
const api = new AbhakelnApi(appState, "//localhost:18080/api");
const app = new Abhakeln(appState, api);
app.init();
api.loadLists();
