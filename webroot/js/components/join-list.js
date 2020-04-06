class JoinList {
    constructor(appCtx) {
        this.appCtx = appCtx;
    }

    register() {
        const appCtx = this.appCtx;

        Vue.component("ah-joinlist-item", {
            props: ["list"],
            methods: {
                showJoinList() {
                    appCtx.appState.joinList = this.list;
                    appCtx.appState.joinListVisible = true;
                }
            },
            template: `<a v-on:click="showJoinList">{{list.name}}</a>`
        });

        Vue.component("ah-joinlist", {
            props: ["visible"],
            data: function () {
                return {
                    decryptError: null
                };
            },
            methods: {
                joinList() {
                    (async () => {
                        try {
                            await appCtx.api.confirmShareList(appCtx.appState.joinList, document.querySelector("#joinListKey").value);
                            this.closeModal();
                            appCtx.startSync();
                            appCtx.closeMenus();
                        } catch (err) {
                            this.decryptError = err;
                        }
                    })();
                },
                closeModal() {
                    appCtx.appState.joinListVisible = false;
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
    }
}