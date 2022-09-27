import Vue from "vue";
import MarkdownEditor from "v-markdown-editor";
import "v-markdown-editor/dist/v-markdown-editor.css";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faGear,
  faNoteSticky,
  faFileCirclePlus,
  faFloppyDisk,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faGear, faNoteSticky, faFileCirclePlus, faFloppyDisk, faRotate);
Vue.component("fa-icon", FontAwesomeIcon);

Vue.use(MarkdownEditor);

import App from "./App.vue";
import { store } from "./store";

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
  store: store,
}).$mount("#app");
