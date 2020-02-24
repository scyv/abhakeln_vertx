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
          const listId = this.list._id;
          self.appState.selectedList = listId;
          self.api.loadItems(listId);
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
          self.api.updateItem({
            _id: this.item._id,
            done: !this.item.done
          });
        }
      },
      template: `
              <div>
                <input v-on:input="select" type="checkbox" v-bind:id="item._id" v-model="item.done">
                <label class="checkbox" v-bind:for="item._id">{{ item.task }}</label>
              </div>
              `
    });
  }
}
