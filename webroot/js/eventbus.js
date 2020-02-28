class AbhakelnEventBus {
  constructor(appState) {
    this.appState = appState;
      
    const eventbus = new EventBus("/eventbus", {
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
    console.debug("Message from Server:", action, body);
    switch (action) {
      case "create-list":
        this.appState.lists.push(body);
        break;
      case "create-list-item":
        this.appState.listData.items.push(body);
        break;
      case "update-item-data":
        const localItem = this.appState.listData.items.find(i => i._id === body._id);
        localItem.done = body.done;
        if (body.task) {
          localItem.task = body.task;
        }
        break;
      default:
        console.warn("Unknown action (" + action + "). Dispatching nothing at all.");
    }
  }
}
