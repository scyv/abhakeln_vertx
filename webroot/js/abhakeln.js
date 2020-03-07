class Abhakeln {
  constructor(appState, api) {
    this.appState = appState;
    this.api = api;
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
  }

  _createApp() {
    const self = this;
    new Vue({
      el: "#app",
      data: self.appState,
      methods: {
        addListKey(evt) {
          const listName = evt.target.value;
          evt.target.value = "";
          self.api.createList({
            name: listName
          });
        },
        addItemKey(evt) {
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
        showLists() {
          self.showLists();
        },
        toggleMenu() {
          document.querySelector(".burger-button").classList.toggle("is-active");
          document.querySelector(".menu").classList.toggle("visible");
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
          self.api.loadItems(this.list);
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
      props: ["item"],
      methods: {
        select(evt) {
          self.api.updateItem(
            {
              _id: this.item._id,
              done: !this.item.done
            },
            self.appState.selectedList
          );
        },
        showDetails(evt) {
          self.appState.selectedItem = this.item;
          self.showDetails();
        }
      },
      template: `
              <transition name="fade">
              <div class="ah-checkbox ah-checkbox-label" v-on:click="showDetails">
                  <span>{{ item.task }}</span>
                  <label>
                  <input type="checkbox" checked="checked" v-on:input="select" v-bind:id="item._id" v-model="item.done" />
                  <div class="ah-checkbox-check"></div>
                  </label>
              </div>
              </transition>
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
                        importId: task.id
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
            }, 200);
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
