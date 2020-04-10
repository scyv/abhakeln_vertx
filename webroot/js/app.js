// inital app state
const appState = {
  offline: false,
  lists: [],
  allItems: {},
  selectedList: null,
  selectedItem: null,
  joinList: null,
  showDone: false,
  listData: {
    items: [],
  },
  hasOpenInvitations: true,
  invitationLists: [],
  masterKey: null,
  wunderlistImportVisible: false,
  shareListVisible: false,
  listsVisible: false,
  itemsVisible: false,
  detailsVisible: false,
  joinListVisible: false,
  noteeditmode: false,
  menuAlert: false,
  listMenuVisible: false,
  itemMenuVisible: false,
  renameItemVisible: false,
  renameListVisible: false,
};

const eventbus = new AbhakelnEventBus(appState, EVENTBUS_ENDPOINT);
const api = new AbhakelnApi(appState, API_ENDPOINT);
const app = new Abhakeln(appState, api, eventbus);
const dnd = new DragAndDropSupport();

onDeviceReady = async () => {
  const storage = new Storage();
  appState.masterKey = (await storage.getMasterKey()).key;
  appState.userData = {
    userId: (await storage.getUserData()).id,
  };
  app.init();
  await api.loadLists();
  new Notifications().requestPermission();
};

onResume = () => {
  app.startSync();
};

document.addEventListener("deviceready", onDeviceReady, false);
document.addEventListener("onresume", onResume, false);

if (typeof cordova == "undefined") {
  onDeviceReady();
}
