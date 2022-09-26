<template>
  <div id="app">
    <div id="menu-bar">
      <select
        v-if="notebooks.length"
        name="Notebook"
        id="notebook-select"
        :value="config.notebook"
        @input="(e) => updateNotebook(e)"
      >
        <option value="null">None</option>
        <option v-for="opt in notebooks" :value="opt.id" :key="opt.id">
          {{ opt.title }}
        </option>
      </select>
      <div id="menu-toggle" @click.prevent="settingsView = !settingsView">
        <img v-if="!settingsView" src="./assets/settings-icon.png" alt="" />
        <img v-else src="./assets/note-icon.png" alt="" />
      </div>
    </div>
    <div
      v-if="config.notebook && !settingsView && note !== null && tag !== null"
      id="editor"
      class="main-view"
    >
      <markdown-editor
        :value="note.content"
        height="auto"
        toolbar=""
        @input="syncScratch"
      ></markdown-editor>
    </div>
    <div v-if="settingsView" id="settings" class="main-view">
      <div class="input-group">
        <label for="host">Host</label>
        <input
          type="text"
          name="host"
          id="conf-host"
          :value="config.host"
          @input="(e) => updateCOnfig('host', e)"
        />
      </div>
      <div class="input-group">
        <label for="port">Port</label>
        <input
          type="text"
          name="port"
          id="conf-port"
          :value="config.port"
          @input="(e) => updateCOnfig('port', e)"
        />
      </div>
      <div class="input-group">
        <label for="token">API Token</label>
        <input
          type="text"
          name="token"
          id="conf-host"
          :value="config.apiToken"
          @input="(e) => updateCOnfig('apiToken', e)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from "vuex";
import {
  CONFIG,
  NOTEBOOKS,
  CURRENT_NOTEBOOK_LABEL,
} from "./store/getter.names";
import { SET_CONFIG } from "./store/mutation.names";
import {
  GET_NOTEBOOKS,
  HYDRATE_CONFIG_FROM_LOCALSTORAGE,
} from "./store/action.names";
import {
  getScratchPad,
  getScratchPadTag,
  debounce,
  createOrUpdateScratchPad,
} from "./utils/joplinClient";

export default {
  name: "App",
  components: {},
  computed: {
    ...mapGetters([CONFIG, NOTEBOOKS, CURRENT_NOTEBOOK_LABEL]),
  },
  data() {
    return {
      settingsView: false,
      note: {
        id: null,
        content: "",
      },
      tag: null,
      editorOptions: {
        markdownIt: {
          linkify: true,
        },
        linkAttributes: {
          attrs: {
            target: "_blank",
            rel: "noopener",
          },
        },
      },
    };
  },
  methods: {
    syncScratch: debounce(async function (e) {
      // console.log(e);
      if (e !== this.note.content) {
        this.note = await createOrUpdateScratchPad(
          { id: this.note.id, content: e },
          this[CURRENT_NOTEBOOK_LABEL],
          this.config,
          this.tag
        );
      }
    }, 3000),
    updateCOnfig(key, e) {
      this[SET_CONFIG]({ [key]: e.target.value });
      this[GET_NOTEBOOKS]().then(async () => {
        if (this.tag == null) {
          this.tag = await getScratchPadTag(this.config);
        }
        this.note = await getScratchPad(
          this.config,
          this[CURRENT_NOTEBOOK_LABEL]
        );
      });
    },
    async updateNotebook(e) {
      this[SET_CONFIG]({ notebook: e.target.value });
      this.note = await getScratchPad(
        this.config,
        this[CURRENT_NOTEBOOK_LABEL]
      );
    },

    ...mapMutations([SET_CONFIG]),
    ...mapActions([HYDRATE_CONFIG_FROM_LOCALSTORAGE, GET_NOTEBOOKS]),
  },
  mounted() {
    this[HYDRATE_CONFIG_FROM_LOCALSTORAGE]().then(async () => {
      this.tag = await getScratchPadTag(this.config);
      this.note = await getScratchPad(
        this.config,
        this[CURRENT_NOTEBOOK_LABEL]
      );
    });
  },
};
</script>

<style lang="scss">
* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  position: relative;
  background-color: white;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;

  #menu-bar {
    margin: 15px;
    width: calc(100% - 30px);
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    #menu-toggle {
      img {
        width: 20px;
        height: 20px;
      }
    }
  }
  .main-view {
    flex: 1;
    width: calc(100% - 30px);
    margin: 15px;
  }

  #editor {
    .md-body {
      height: 100%;
      width: 100%;
    }

    .v-md-container {
      height: 100%;
    }
  }

  #settings {
    display: flex;
    flex-direction: column;

    .input-group {
      margin-top: 15px;
      margin-bottom: 15px;

      label,
      input {
        display: block;
      }

      input {
        margin-top: 5px;
        min-width: 300px;
        height: 30px;
        padding: 5px;
      }
    }
  }
}
</style>
