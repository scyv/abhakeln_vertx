class List {
    constructor(appCtx) {
        this.appCtx = appCtx;
    }

    register() {
        const appCtx = this.appCtx;
        Vue.component("ah-list", {
            props: ["list", "selected"],
            methods: {
                select() {
                    appCtx.appState.selectedList = this.list;
                    const items = appCtx.appState.allItems[this.list._id] || [];
                    items.sort((a, b) => {
                        if (a.done && b.done) {
                            return a.completedAt < b.completedAt ? 1 : a.completedAt === b.completedAt ? 0 : -1;
                        } else if (!a.done && !b.done) {
                            if (a.sortOrder && b.sortOrder) {
                                return a.sortOrder > b.sortOrder ? 1 : a.sortOrder === b.sortOrder ? 0 : -1;
                            }
                            return a.createdAt < b.createdAt ? 1 : a.createdAt === b.createdAt ? 0 : -1;
                        }
                        return a.done && !b.done ? 1 : -1;
                    });

                    appCtx.appState.listData.items = items;
                    appCtx.appState.selectedItem = null;
                    appCtx.showItems();
                }
            },
            template: `
                <transition name="fade">
                <li v-bind:id="list._id" v-on:click="select" v-bind:class="{'is-active': selected}">{{list.name}}</li>
                </transition>
              `
        });
    }
}