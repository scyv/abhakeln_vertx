class AbhakelnEventBus {
  constructor(appState) {
    this.appState = appState;
    
    const eventbus = new EventBus("/eventbus");
    const ctx = this;
    eventbus.onopen = function() {
      eventbus.registerHandler("sync-queue", function(error, message) {
        ctx.dispatch(message.headers.action, message.body);
      });
    };
  }

  dispatch(action, body) {
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
        localItem.tasl = body.task;
        break;
      default:
        console.warn("Unknown action (" + action + "). Dispatching nothing at all.");
    }
  }
}
