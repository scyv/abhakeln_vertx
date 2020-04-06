class Abhakeln {
    constructor(appState, api) {
        this.appState = appState;
        this.api = api;

        this.reminderDatePicker = null;
        this.dueDatePicker = null;

        flatpickr.localize(flatpickr.l10ns.de);

        window.addEventListener("keyup", evt => {
            if (evt.key === "Escape") {
                this.closeMenus();
                this.appState.wunderlistImportVisible = false;
                this.appState.shareListVisible = false;
                if (this.appState.detailsVisible) {
                    this.appState.detailsVisible = false;
                    this.appState.selectedItem = null;
                }
            }
        });
    }

    init() {
        this._createComponents();
        this._createApp();
    }

    showItems() {
        this.appState.listsVisible = false;
        this.appState.itemsVisible = true;
        this.appState.detailsVisible = false;
    }

    showLists() {
        this.appState.listsVisible = true;
        this.appState.itemsVisible = false;
        this.appState.detailsVisible = false;
    }

    showDetails() {
        this.appState.listsVisible = false;
        this.appState.itemsVisible = false;
        this.appState.detailsVisible = true;

        window.requestAnimationFrame(() => {
            const reminderDateElement = document.querySelector("#details .reminder-date");
            this.reminderDatePicker = flatpickr(reminderDateElement, {
                enableTime: true,
                altInput: true,
                altFormat: "D. j. F Y H:i",
                dateFormat: "Z"
            });
            const dueDateElement = document.querySelector("#details .due-date");
            this.dueDatePicker = flatpickr(dueDateElement, {
                enableTime: false,
                altInput: true,
                altFormat: "D. j. F Y",
                dateFormat: "Z"
            });
            this.reminderDatePicker.setDate(this.appState.selectedItem.reminder);
            this.dueDatePicker.setDate(this.appState.selectedItem.dueDate);
        });
    }

    closeMenus() {
        this.appState.listMenuVisible = false;
        this.appState.itemMenuVisible = false;
    }

    startSync() {
        this.closeMenus();
        this.api.loadLists();
    }

    _createApp() {
        const self = this;
        new Vue({
            el: "#app",
            data: self.appState,
            watch: {
                "selectedItem.dueDate": function (newItem) {
                    self.dueDatePicker && self.dueDatePicker.setDate(newItem);
                },
                "selectedItem.reminder": function (newItem) {
                    self.reminderDatePicker && self.reminderDatePicker.setDate(newItem);
                }
            },
            methods: {
                startSync() {
                    self.startSync();
                },
                addListKey(evt) {
                    const listName = evt.target.value;
                    evt.target.value = "";
                    self.api.createList({
                        name: listName
                    });
                },
                addItemKey(evt) {
                    document.querySelector(".items-content").scrollTop = 0;
                    const task = evt.target.value;
                    evt.target.value = "";
                    self.api.createItem(
                        {
                            task: task
                        },
                        self.appState.selectedList
                    );
                },
                showWunderlistImport() {
                    self.appState.wunderlistImportVisible = true;
                },
                showShareList() {
                    self.appState.shareListVisible = true;
                },
                showLists() {
                    self.showLists();
                },
                showItems() {
                    self.showItems();
                },
                toggleListMenu() {
                    self.appState.listMenuVisible = !self.appState.listMenuVisible;
                },
                toggleItemMenu() {
                    self.appState.itemMenuVisible = !self.appState.itemMenuVisible;
                },
                markdown(str) {
                    return DOMPurify.sanitize(str ? marked(str) : `<div class="content is-small">Hier Klicken...</div>`);
                },
                startNoteEditMode() {
                    self.appState.noteeditmode = true;
                    window.setTimeout(() => {
                        document.querySelector("#notescontent").focus();
                    }, 400);
                },
                saveNotes() {
                    const content = document.querySelector("#notescontent").value;
                    self.api.updateItem(
                        {
                            _id: self.appState.selectedItem._id,
                            notes: content
                        },
                        self.appState.selectedList
                    );
                    self.appState.noteeditmode = false;
                },
                dueDateChanged(evt) {
                    self.api.updateItem(
                        {
                            _id: self.appState.selectedItem._id,
                            dueDate: evt.target.value
                        },
                        self.appState.selectedList
                    );
                },
                reminderDateChanged(evt) {
                    self.api.updateItem(
                        {
                            _id: self.appState.selectedItem._id,
                            reminder: evt.target.value
                        },
                        self.appState.selectedList
                    );
                }
            }
        });
    }

    _createComponents() {
        new List(this).register();
        new Item(this).register();
        new ShareList(this).register();
        new JoinList(this).register();
        new RenameList(this).register();
        new RenameItem(this).register();
        new ImportWunderlist(this).register();
    }
}

class DragAndDropSupport {
    constructor() {
        this.selected = null;
    }

    dragOver(e) {
        if (this.selected.parentNode !== e.target.parentNode) {
            return;
        }
        if (this.isBefore(this.selected, e.target)) {
            e.target.parentNode.insertBefore(this.selected, e.target);
        } else {
            e.target.parentNode.insertBefore(this.selected, e.target.nextSibling);
        }
    }

    dragEnd() {
        var nodes = Array.prototype.slice.call(this.selected.parentNode.children);
        if (this.selected.classList.contains("ah-item")) {
            const sorting = nodes.map((node, idx) => {
                appState.listData.items.filter(i => i._id === node.dataset.itemid).forEach(i => (i.sortOrder = idx + 1));
                return {
                    _id: node.dataset.itemid,
                    sortOrder: idx + 1
                };
            });
            api.sendItemSortOrder(sorting);
        }
        this.selected = null;
    }

    dragStart(e) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", e.target.textContent);
        this.selected = e.target;
    }

    isBefore(el1, el2) {
        if (el2.parentNode === el1.parentNode) {
            for (let cur = el1.previousSibling; cur; cur = cur.previousSibling) {
                if (cur === el2) {
                    return true;
                }
            }
        }
        return false;
    }
}
