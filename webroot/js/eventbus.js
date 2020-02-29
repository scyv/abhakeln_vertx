class AbhakelnEventBus {
  constructor(appState, endpoint) {
    this.appState = appState;
    this.encryption = new Encryption();
    const eventbus = new EventBus(endpoint, {
      vertxbus_reconnect_attempts_max: 500,
      vertxbus_reconnect_delay_min: 1000,
      vertxbus_reconnect_delay_max: 5000,
      vertxbus_reconnect_exponent: 2,
      vertxbus_randomization_factor: 0.5
    });
    eventbus.enableReconnect(true);

    const ctx = this;
    eventbus.onopen = function() {
      eventbus.registerHandler("sync-queue", function(error, message) {
        ctx.dispatch(message.headers.action, message.body);
      });
    };
  }

  dispatch(action, body) {
    console.debug("Message from Server:", action, JSON.stringify(body));
    switch (action) {
      case "create-list":
        this.appState.lists.push(this.encryption.decryptListData(body, this.appState.userData.userId, this.appState.masterKey));
        break;
      case "create-list-item":
        if (body.listId === this.appState.selectedList._id) {
          this.appState.listData.items.push(this.encryption.decryptItemData(body, this.appState.selectedList, this.appState.userData.userId, this.appState.masterKey));
        }
        break;
      case "update-item-data":
        const localItem = this.appState.listData.items.find(i => i._id === body._id);
        localItem.done = body.done;
        break;
      default:
        console.warn("Unknown action (" + action + "). Dispatching nothing at all.");
    }
  }
}
