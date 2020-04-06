class Item {
    constructor(appCtx) {
        this.appCtx = appCtx;
    }

    register() {
        const appCtx = this.appCtx;

        Vue.component("ah-item", {
            props: ["item", "selected"],
            data: function () {
                return {
                    transitionEnabled: "nofade"
                };
            },
            methods: {
                select(evt) {
                    this.transitionEnabled = "fade";
                    appCtx.api.updateItem(
                        {
                            _id: this.item._id,
                            done: !this.item.done
                        },
                        appCtx.appState.selectedList
                    );
                },
                nobubble(evt) {
                    evt.stopPropagation();
                },
                showDetails(evt) {
                    appCtx.appState.selectedItem = this.item;
                    appCtx.showDetails();
                }
            },
            template: `
        <transition name="fade" v-bind:name="transitionEnabled">
        <div class="ah-checkbox ah-checkbox-label" v-bind:class="{'is-active': selected}" v-on:click="showDetails">
            <span>{{ item.task }}</span>
            <label v-on:click="nobubble">
            <input type="checkbox" checked="checked" v-on:input="select" v-bind:id="item._id" v-model="item.done" />
            <div class="ah-checkbox-check"></div>
            </label>
        </div>
        </transition>
        `
        });
    }
}