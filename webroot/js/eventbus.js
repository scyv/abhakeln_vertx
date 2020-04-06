class AbhakelnEventBus {
    constructor(appState, endpoint) {
        this.appState = appState;
        this.encryption = new Encryption();
        const eventbus = new EventBus(endpoint, {
            vertxbus_reconnect_attempts_max: 5,
            vertxbus_reconnect_delay_min: 1000,
            vertxbus_reconnect_delay_max: 5000,
            vertxbus_reconnect_exponent: 2,
            vertxbus_randomization_factor: 0.5
        });
        eventbus.enableReconnect(true);

        const ctx = this;
        eventbus.onopen = function () {
            eventbus.registerHandler("sync-queue", function (error, message) {
                ctx.dispatch(message.headers.action, message.body);
            });
        };
        eventbus.onclose = function (err) {
            appState.offline = true;
        }
    }

    resolveList(listId) {
        return this.appState.lists.find(l => l._id === listId);
    }

    dispatch(action, body) {
        console.debug("Message from Server:", action, JSON.stringify(body));
        switch (action) {
            case "create-list":
                const newList = this.encryption.decryptListData(body, this.appState.userData.userId, this.appState.masterKey);
                this.appState.selectedList = newList;
                this.appState.lists.push(newList);
                this.appState.lists = this.appState.lists.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));
                this.appState.listData.items = [];
                break;
            case "create-list-item": {
                let list = this.appState.allItems[body.listId];
                if (!list) {
                    list = [];
                    this.appState.allItems[body.listId] = list;
                }
                const listData = this.resolveList(body.listId);
                const decrypted = this.encryption.decryptItemData(body, listData, this.appState.userData.userId, this.appState.masterKey);
                list.splice(0, 0, decrypted);
                break;
            }
            case "update-item-data": {
                const list = this.appState.allItems[body.listId] || [];
                const localItem = list.find(i => i._id === body._id);
                if (localItem) {
                    const listData = this.resolveList(body.listId);
                    const decrypted = this.encryption.decryptItemData(body, listData, this.appState.userData.userId, this.appState.masterKey);
                    localItem.done = decrypted.done;
                    localItem.task = decrypted.task;
                    localItem.notes = decrypted.notes;
                    localItem.sortOrder = decrypted.sortOrder;
                    localItem.dueDate = decrypted.dueDate;
                    localItem.reminder = decrypted.reminder;
                }
                break;
            }
            case "update-list-data": {
                const list = this.resolveList(body._id);
                const decrypted = this.encryption.decryptListData(body, this.appState.userData.userId, this.appState.masterKey);
                list.name = decrypted.name;
                this.appState.lists = this.appState.lists.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));
                break;
            }
            case "share-list":
                this.appState.menuAlert = true;
                break;
            default:
                console.warn("Unknown action (" + action + "). Dispatching nothing at all.");
        }
    }
}
