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
        "selectedItem.dueDate": function(newItem) {
          self.dueDatePicker && self.dueDatePicker.setDate(newItem);
        },
        "selectedItem.reminder": function(newItem) {
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
    const self = this;
    Vue.component("ah-list", {
      props: ["list", "selected"],
      methods: {
        select() {
          self.appState.selectedList = this.list;
          const items = self.appState.allItems[this.list._id] || [];
          items.sort((a, b) => {
            if (a.done && b.done) {
              return a.completedAt < b.completedAt ? 1 : a.completedAt === b.completedAt ? 0 : -1;
            } else if (!a.done && !b.done) {
              if (a.sortOrder && b.sortOrder) {
                return a.sortOrder > b.sortOrder ? 1 : a.sortOrder === b.sortOrder ? 0 : -1;
              }
              return a.createdAt < b.createdAt ? 1 : a.createdAt === b.createdAt ? 0 : -1;
            }
            return a.done && !b.done ? 1 : -1;
          });

          self.appState.listData.items = items;
          self.appState.selectedItem = null;
          self.showItems();
        }
      },
      template: `
                <transition name="fade">
                <li v-bind:id="list._id" v-on:click="select" v-bind:class="{'is-active': selected}">{{list.name}}</li>
                </transition>
              `
    });

    Vue.component("ah-item", {
      props: ["item", "selected"],
      data: function() {
        return {
          transitionEnabled: "nofade"
        };
      },
      methods: {
        select(evt) {
          this.transitionEnabled = "fade";
          self.api.updateItem(
            {
              _id: this.item._id,
              done: !this.item.done
            },
            self.appState.selectedList
          );
        },
        nobubble(evt) {
          evt.stopPropagation();
        },
        showDetails(evt) {
          self.appState.selectedItem = this.item;
          self.showDetails();
        }
      },
      template: `
        <transition name="fade" v-bind:name="transitionEnabled">
        <div class="ah-checkbox ah-checkbox-label" v-bind:class="{'is-active': selected}" v-on:click="showDetails">
            <span>{{ item.task }} {{item.sortOrder}}</span>
            <label v-on:click="nobubble">
            <input type="checkbox" checked="checked" v-on:input="select" v-bind:id="item._id" v-model="item.done" />
            <div class="ah-checkbox-check"></div>
            </label>
        </div>
        </transition>
        `
    });

    Vue.component("ah-sharelist", {
      props: ["visible", "list"],
      methods: {
        shareList() {
          self.api.shareList(
            this.list,
            document.querySelector("#shareUserName").value,
            document.querySelector("#shareListName").value,
            document.querySelector("#shareListPwd").value
          );
          this.closeModal();
          self.closeMenus();
        },
        closeModal() {
          self.appState.shareListVisible = false;
        }
      },
      template: `
      <div class="modal" v-bind:class="{'is-active': visible}">
        <div class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Liste Teilen</p>
            <button class="delete" aria-label="close" v-on:click="closeModal"></button>
          </header>
          <section class="modal-card-body">
            <div class="field">
              <div class="control">
                <input type="text" class="input" id="shareListName" placeholder="Listen Name" v-bind:value="list.name" />
              </div>
              <p class="help">Wenn Sie den Namen geheim halten möchten, ändern sie ihn hier.</p>
            </div>
            <div class="field">
              <div class="control">
                <input type="text" class="input" id="shareUserName" placeholder="Teilen für: Benutzername oder Email" />
              </div>
              <p class="help">Dies ist der Name des Empfängers der Liste.</p>
            </div>
            <div class="field">
              <div class="control">
                <input type="text" class="input" id="shareListPwd" placeholder="Passwort für Liste" />
              </div>
              <p class="help">Denken Sie sich etwas aus. Dieses Passwort gilt nur so lange, bis der Empfänger die Liste eingerichtet hat.</p>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="shareList">Teilen</button>
            <button class="button" v-on:click="closeModal">Schließen</button>
          </footer>
        </div>
      </div>      
      `
    });

    Vue.component("ah-joinlist-item", {
      props: ["list"],
      methods: {
        showJoinList() {
          self.appState.joinList = this.list;
          self.appState.joinListVisible = true;
        }
      },
      template: `<a v-on:click="showJoinList">{{list.name}}</a>`
    });

    Vue.component("ah-joinlist", {
      props: ["visible"],
      data: function() {
        return {
          decryptError: null
        };
      },
      methods: {
        joinList() {
          (async () => {
            try {
              await self.api.confirmShareList(self.appState.joinList, document.querySelector("#joinListKey").value);
              this.closeModal();
              self.startSync();
              self.closeMenus();
            } catch (err) {
              this.decryptError = err;
            }
          })();
        },
        closeModal() {
          self.appState.joinListVisible = false;
        },
        closeError() {
          this.decryptError = null;
        }
      },
      template: `
      <div class="modal" v-bind:class="{'is-active': visible}">
        <div class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Liste Beitreten</p>
            <button class="delete" aria-label="close" v-on:click="closeModal"></button>
          </header>
          <section class="modal-card-body">
            <div v-if="decryptError" class="notification is-danger">
                <button class="delete" v-on:click="closeError"></button>
                {{ decryptError }}
            </div>
            <div class="field">
              <div class="control">
                <input type="text" class="input" id="joinListKey" placeholder="Hier das Passwort für Liste eingeben" />
              </div>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="joinList">Beitreten</button>
            <button class="button" v-on:click="closeModal">Schließen</button>
          </footer>
        </div>
      </div>            
      `
    });

    Vue.component("ah-wunderlist-import", {
      props: ["visible"],
      data: function() {
        return {
          lists: []
        };
      },
      methods: {
        loadLists(evt) {
          this.lists.length = 0;
          this.lists.pop();
          const ctx = this;
          if (evt.target.files.length > 0) {
            const file = evt.target.files[0];
            const reader = new FileReader();
            reader.onloadend = function(evt) {
              const data = JSON.parse(evt.target.result);
              if (data.length > 0) {
                data.forEach(list => {
                  list.import = true;
                  list.importdone = false;
                  ctx.lists.push(list);
                });
              }
            };
            reader.readAsText(file);
          }
        },
        startImport(evt) {
          const data = this.lists.filter(list => list.import);
          if (data.length > 0) {
            data.forEach(list => {
              self.api.createList({
                name: list.title,
                folder: list.folder ? list.folder.title : null,
                importId: list.id
              });
            });
            const checkListsInterval = window.setInterval(() => {
              if (data.length === 0) {
                window.clearInterval(checkListsInterval);
                return;
              }
              const idx = self.appState.lists.findIndex(list => list.name === data[0].title);

              if (idx >= 0) {
                self.appState.selectedList = self.appState.lists[idx];
                let sortOrder = 0;
                data[0].tasks.forEach(task => {
                  try {
                    self.api.createItem(
                      {
                        task: task.title,
                        done: task.completed,
                        notes: task.notes.length > 0 ? task.notes[0].content : null,
                        createdAt: task.createdAt,
                        completedAt: task.completedAt,
                        dueDate: task.dueDate,
                        reminder: task.reminders.length > 0 ? task.reminders[0].remindAt : null,
                        importId: task.id,
                        sortOrder: sortOrder++
                      },
                      self.appState.selectedList
                    );
                  } catch (err) {
                    console.error(err);
                  }
                });
                data[0].importdone = true;
                data[0].import = false;
                data.shift();
              }
            }, 1000);
          }
        },
        closeModal() {
          self.appState.wunderlistImportVisible = false;
        }
      },
      template: `
      <div class="modal" v-bind:class="{'is-active': visible}">
        <div class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Wunderlist Import</p>
            <button class="delete" aria-label="close" v-on:click="closeModal"></button>
          </header>
          <section class="modal-card-body">
            <ol style="padding: 10px">
              <li>Erstellen Sie über <a target="_blank" href="https://export.wunderlist.com/export">https://export.wunderlist.com/export</a> den Wunderlist Export</li>
              <li>Laden Sie die dort erstellte ZIP Datei herunter</li>
              <li>Entpacken Sie diese ZIP Datei auf Ihre Festplatte</li>
              <li>Wählen Sie in folgendem Eingabefeld aus dem entpackten Ordner (Wunderlist-2020xxxx) die Datei "Tasks.json" aus:</li>
            </ol>
            <div class="field">
              <div class="control">
                <input type="file" class="input" placeholder="Wunderlist Import" v-on:change="loadLists">
              </div>
            </div>
            <div v-if="lists.length > 0">Wählen Sie die Listen aus, die importiert werden sollen:</div>
            <div v-for="list in lists" class="import-item" v-bind:class="{'import-success': list.importdone}">
                <input type="checkbox" v-if="list.importdone===false" v-bind:id="list.id" v-model="list.import">
                <label class="checkbox" v-bind:for="list.id">{{ list.title }}</label>
              </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="startImport">Import starten</button>
            <button class="button" v-on:click="closeModal">Schließen</button>
          </footer>
        </div>
      </div>      
      `
    });
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
