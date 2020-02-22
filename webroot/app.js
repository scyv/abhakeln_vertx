const eb = new EventBus("/eventbus");
eb.onopen = function() {
  eb.registerHandler("sync-queue", function(error, message) {
    dispatch(message.headers.action, message.body);
  });
};

function loadLists() {
  fetch("//localhost:8080/api/lists/")
    .then(resp => resp.json())
    .then(data => {
      clearArray(appState.lists);
      data.forEach(list => {
        addList(list);
        
      });
    });
}

function loadItems(listId) {
  fetch("//localhost:8080/api/lists/" + listId + "/")
  .then(resp => resp.json())
  .then(data => {
    clearArray(appState.listData.items);
    data.items.forEach(item => {
      addItem(item);
    });
  });  
}

function createList(listData) {
  fetch("//localhost:8080/api/lists/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(listData),
  });
}

function createItem(itemData, listId) {
  fetch("//localhost:8080/api/lists/" + listId + "/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(itemData),
  });
}

function updateItem(itemData) {
  fetch("//localhost:8080/api/items/" + itemData._id + "/", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(itemData),
  });
}

function dispatch(action, body) {
  switch (action) {
    case "create-list":
      addList(body);
      break;
    case "create-list-item": 
      addItem(body);
      break;
    case "update-item-data": 
      updateItemData(body);
      break;
      
    default:
      console.warn("Unknown action (" + action + "). Dispatching nothing at all.");
  }
}

const appState = {
  lists: [],
  selectedList: null,
  showDone: true,
  listData: {
    items: []
  }
};

function addList(list) {
  appState.lists.push(list);
}
function addItem(item) {
  appState.listData.items.push(item);
}
function updateItemData(item) {
  const localItem = appState.listData.items.find(i => i._id === item._id);
  localItem.done = item.done;
  localItem.tasl = item.task;
}

function clearArray(array) {
  array.length = 0;
  array.pop(); // will update DOM, too
}

const app = new Vue({
  el: "#app",
  data: appState,
  methods: {
    addListKey(evt) {
        createList({
          name: evt.target.value
        });
    },
    addItemKey(evt) {
        createItem({
          task: evt.target.value
        }, appState.selectedList);
    },
  }
});

Vue.component('ah-list', {
  props: ['list'],
  methods: {
    select() {
      const listId = this.list._id;
      appState.selectedList = listId;
      loadItems(listId);
    }    
  },
  template: `
    <li v-bind:id="list._id" v-on:click="select">{{list.name}}</li>
  `
});


Vue.component('ah-item', {
  props: ['item'],
  methods: {
    select(evt) {
      updateItem({
        _id: this.item._id,
        done: !this.item.done
      });
    }
  },
  template: `
  <li>
    <input v-on:input="select" type="checkbox" v-bind:id="item._id" v-model="item.done">
    <label v-bind:for="item._id">{{ item.task }}</label>
  </li>
  `
});

loadLists();
