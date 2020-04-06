class RenameList {
    constructor(appCtx) {
        this.appCtx = appCtx;
    }

    register() {
        const appCtx = this.appCtx;
        Vue.component("ah-renamelist", {
            props: ["visible", "list"],
            data: function() {
                return {
                    oldName: this.list.name
                };
            },
            methods: {
                renameList() {
                    (async () => {
                        await appCtx.api.updateList(this.list);
                        appCtx.appState.renameListVisible = false;
                    })();
                },
                closeModal() {
                    appCtx.appState.renameListVisible = false;
                    this.list.name = this.oldName;
                }
            },
            template: `
        <div class="modal" v-bind:class="{'is-active': visible}">
          <div class="modal-background"></div>
          <div class="modal-card">
            <header class="modal-card-head">
              <p class="modal-card-title">Liste umbenennen</p>
              <button class="delete" aria-label="close" v-on:click="closeModal"></button>
            </header>
            <section class="modal-card-body">
              <div class="field">
                <div class="control">
                  <input type="text" class="input" id="newListName" placeholder="Hier den neuen Namen der Liste eingeben" v-model="list.name"  />
                </div>
              </div>
            </section>
            <footer class="modal-card-foot">
              <button class="button is-success" v-on:click="renameList">Umbenennen</button>
              <button class="button" v-on:click="closeModal">Schließen</button>
            </footer>
          </div>
        </div>            
        `
        });
    }
}