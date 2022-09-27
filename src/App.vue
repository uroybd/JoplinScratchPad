<template>
  <div id="app">
    <div id="menu-bar">
      <div>
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
        <fa-icon
          style="margin-left: 5px"
          icon="fa-solid fa-rotate"
          @click.prevent="refreshNotebooks()"
        />
      </div>
      <div id="menu-toggle" @click.prevent="settingsView = !settingsView">
        <fa-icon icon="fa-solid fa-note-sticky" v-if="settingsView" />
        <fa-icon icon="fa-solid fa-gear" v-else />
      </div>
    </div>
    <div
      v-if="config.notebook && !settingsView && note !== null"
      id="editor"
      class="main-view"
    >
      <div id="note-menu">
        <div class="title-input" v-if="note.title !== null">
          <input
            type="text"
            name="title"
            id="title"
            v-model="note.title"
            @input="titleChanged = true"
          />
          <fa-icon
            class="icon"
            icon="fa-solid fa-floppy-disk"
            v-if="titleChanged"
            @click.prevent="updateTitleHandler()"
          />
        </div>
        <div class="actions">
          <fa-icon
            v-if="synced"
            icon="fa-solid fa-file-circle-plus"
            @click.prevent="newNote()"
          />
          <fa-icon
            class="rotating-icon"
            v-else
            icon="fa-solid fa-rotate"
            style="color: #9a9a9a"
          />
        </div>
      </div>
      <markdown-editor
        :value="note.content"
        height="auto"
        toolbar=""
        @input="syncScratch"
      ></markdown-editor>
    </div>
    <div v-if="settingsView" id="settings" class="main-view">
      <h4>Joplin API Configuration</h4>
      <div class="input-group">
        <label for="host">Host</label>
        <input
          type="text"
          name="host"
          id="conf-host"
          :value="config.host"
          @input="(e) => updateConfig('host', e)"
        />
      </div>
      <div class="input-group">
        <label for="port">Port</label>
        <input
          type="number"
          name="port"
          id="conf-port"
          :value="config.port"
          @input="(e) => updateConfig('port', e)"
        />
      </div>
      <div class="input-group">
        <label for="token">API Token</label>
        <input
          type="text"
          name="token"
          id="conf-host"
          :value="config.apiToken"
          @input="(e) => updateConfig('apiToken', e)"
        />
      </div>
      <hr />
      <h4>Shortcuts</h4>
      <div class="input-group">
        <label for="token">Toggle Scratchpad</label>
        <div style="display: flex; align-items: center">
          <input
            type="text"
            name="token"
            id="conf-host"
            :value="config.toggleOn"
            ref="shortcut"
            @input="shortcutChanged = true"
          />
          <fa-icon
            class="icon"
            style="margin-left: 10px"
            icon="fa-solid fa-floppy-disk"
            v-if="shortcutChanged"
            @click.prevent="shortcutUpdateHandler()"
          />
        </div>
      </div>
      <p style="font-size: 0.8rem">(Please use Electron Style Shortcut.)</p>
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
  createOrUpdateScratchPad,
  updateTitle,
} from "./utils/joplinClient";

import { debounce } from "./utils/common";
import { ipcRenderer } from "electron";

export default {
  name: "App",
  components: {},
  computed: {
    ...mapGetters([CONFIG, NOTEBOOKS, CURRENT_NOTEBOOK_LABEL]),
  },
  watch: {
    "config.toggleOn": {
      immediate: true,
      handler(val, oldVal) {
        ipcRenderer.send("change-toggle-shortcut", { val, oldVal });
      },
    },
    config: {
      deep: true,
      handler: function (val) {
        this[GET_NOTEBOOKS](val).then(async () => {
          this.note = await getScratchPad(val, this[CURRENT_NOTEBOOK_LABEL]);
        });
      },
    },
    currentNotebookLabel: {
      deep: true,
      handler: async function (val) {
        if (val) {
          this.note = await getScratchPad(this.config, val);
        } else {
          this.note = null;
        }
      },
    },
  },
  data() {
    return {
      settingsView: false,
      note: {
        id: null,
        title: null,
        content: "",
      },
      synced: true,
      titleChanged: false,
      shortcutChanged: false,
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
    shortcutUpdateHandler() {
      this.updateConfig("toggleOn", {
        target: {
          value: this.$refs.shortcut.value,
        },
      });
      this.shortcutChanged = false;
    },
    refreshNotebooks() {
      this[GET_NOTEBOOKS](this.config).then(async () => {
        this.note = await getScratchPad(
          this.config,
          this[CURRENT_NOTEBOOK_LABEL]
        );
      });
    },
    newNote() {
      this.note = {
        id: null,
        title: null,
        content: "",
      };
    },
    async updateTitleHandler() {
      this.synced = false;
      await updateTitle(this.note.id, this.note.title, this.config);
      this.titleChanged = false;
      this.synced = true;
    },
    updateNote: debounce(async function (e) {
      // console.log(e);
      if (e !== this.note.content) {
        this.note = await createOrUpdateScratchPad(
          { id: this.note.id, content: e },
          this[CURRENT_NOTEBOOK_LABEL],
          this.config,
          this.tag
        );
        this.synced = true;
      }
    }, 3000),
    syncScratch(e) {
      this.synced = false;
      this.updateNote(e);
    },
    updateConfig(key, e) {
      this[SET_CONFIG]({
        [key]: key == "port" ? parseInt(e.target.value) : e.target.value,
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
    this[HYDRATE_CONFIG_FROM_LOCALSTORAGE]();
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

    & div:only-child {
      margin-left: auto;
    }
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
    display: flex;
    flex-direction: column;

    #note-menu {
      width: 100%;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      margin-bottom: 5px;

      & div:only-child {
        margin-left: auto;
      }

      .title-input {
        input {
          margin-top: 5px;
          height: 30px;
          padding: 5px;
        }

        .icon {
          margin-left: 5px;
          margin-right: 5px;
        }
      }

      .actions {
        display: flex;
        flex-direction: row;
        align-items: center;
      }
    }
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

    hr {
      margin-top: 15px;
      margin-bottom: 15px;
    }

    .input-group {
      margin-top: 15px;

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

@keyframes rotation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
}

.rotating-icon {
  animation: rotation 2s infinite linear;
}
</style>
