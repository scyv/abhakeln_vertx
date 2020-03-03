class Abhakeln {
  constructor(appState, api) {
    this.appState = appState;
    this.api = api;
  }

  init() {
    this._createApp();
    this._createComponents();
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
        }
      },
      template: `
                <li v-bind:id="list._id" v-on:click="select"><a v-bind:class="{'is-active': selected}">{{list.name}}</a></li>
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
        }
      },
      template: `
              <div>
                <input v-on:input="select" type="checkbox" v-bind:id="item._id" v-model="item.done">
                <label class="checkbox" v-bind:for="item._id">{{ item.task }}</label>
              </div>
              `
    });

    Vue.component("ah-wunderlist-import", {
      props: [],
      methods: {
        parseTaskJson(evt) {
          if (evt.target.files.length > 0) {
            const file = evt.target.files[0];
            const reader = new FileReader();
            reader.onloadend = function(evt) {
              const data = JSON.parse(evt.target.result);
              if (data.length > 0) {
                data.forEach(list => {
                  self.api.createList({
                    name: list.title,
                    folder: list.folder ? list.folder.title : null
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
                            reminder: task.reminders.length > 0 ? task.reminders[0].remindAt : null
                          },
                          self.appState.selectedList
                        );
                      } catch (err) {
                        console.error(err);
                      }
                    });
                    data.shift();
                  }
                }, 200);
              }
            };
            reader.readAsText(file);
          }
        }
      },
      template: `
        <div class="field">
          <div class="control">
            <input type="file" class="input" placeholder="Wunderlist Import" v-on:change="parseTaskJson">
          </div>
        </div>    
      `
    });
  }
}
