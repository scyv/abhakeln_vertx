class ShareList {
    constructor(appCtx) {
        this.appCtx = appCtx;
    }

    register() {
        const appCtx = this.appCtx;
        Vue.component("ah-sharelist", {
            props: ["visible", "list"],
            methods: {
                shareList() {
                    appCtx.api.shareList(
                        this.list,
                        document.querySelector("#shareUserName").value,
                        document.querySelector("#shareListName").value,
                        document.querySelector("#shareListPwd").value
                    );
                    this.closeModal();
                    appCtx.closeMenus();
                },
                closeModal() {
                    appCtx.appState.shareListVisible = false;
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
    }
}