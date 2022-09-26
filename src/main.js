import Vue from "vue";
import MarkdownEditor from "v-markdown-editor";
import "v-markdown-editor/dist/v-markdown-editor.css";

Vue.use(MarkdownEditor);

import App from "./App.vue";
import { store } from "./store";

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
  store: store,
}).$mount("#app");
