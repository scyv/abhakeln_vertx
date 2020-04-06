class RenameItem {
    constructor(appCtx) {
        this.appCtx = appCtx;
    }

    register() {
        const appCtx = this.appCtx;
        Vue.component("ah-renameitem", {
            props: ["visible", "item"],
            data: function() {
                return {
                    oldTask: this.item.task
                };
            },
            methods: {
                renameItem() {
                    (async () => {
                        await appCtx.api.updateItem(appCtx.appState.selectedItem, appCtx.appState.selectedList);
                        appCtx.appState.renameItemVisible = false;
                    })();
                },
                closeModal() {
                    appCtx.appState.renameItemVisible = false;
                    this.item.task = this.oldTask;
                }
            },
            template: `
          <div class="modal" v-bind:class="{'is-active': visible}">
            <div class="modal-background"></div>
            <div class="modal-card">
              <header class="modal-card-head">
                <p class="modal-card-title">Aufgabe umbenennen</p>
                <button class="delete" aria-label="close" v-on:click="closeModal"></button>
              </header>
              <section class="modal-card-body">
                <div class="field">
                  <div class="control">
                    <input type="text" class="input" id="newItemName" placeholder="Hier den neuen Aufgabentitel eingeben" v-model="item.task"  />
                  </div>
                </div>
              </section>
              <footer class="modal-card-foot">
                <button class="button is-success" v-on:click="renameItem">Umbenennen</button>
                <button class="button" v-on:click="closeModal">Schließen</button>
              </footer>
            </div>
          </div>            
          `
        });
    }
}
