class ImportWunderlist {

    constructor(appCtx) {
        this.appCtx = appCtx;
    }

    register() {
        const appCtx = this.appCtx;
        Vue.component("ah-wunderlist-import", {
            props: ["visible"],
            data: function () {
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
                        reader.onloadend = function (evt) {
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
                            appCtx.api.createList({
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
                            const idx = appCtx.appState.lists.findIndex(list => list.name === data[0].title);

                            if (idx >= 0) {
                                appCtx.appState.selectedList = appCtx.appState.lists[idx];
                                let sortOrder = 0;
                                data[0].tasks.forEach(task => {
                                    try {
                                        appCtx.api.createItem(
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
                                            appCtx.appState.selectedList
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
                    appCtx.appState.wunderlistImportVisible = false;
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