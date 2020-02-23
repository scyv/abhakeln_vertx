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
const api = new AbhakelnApi(appState, "/api");
const app = new Abhakeln(appState, api);
app.init();
api.loadLists();
