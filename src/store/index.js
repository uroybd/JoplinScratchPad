import { getNotebooks, validateConfig } from "@/utils/joplinClient";
import Vue from "vue";
import Vuex from "vuex";
import { CONFIG, CURRENT_NOTEBOOK_LABEL, NOTEBOOKS } from "./getter.names";
import { SET_CONFIG, SET_NOTEBOOKS } from "./mutation.names";
import {
  GET_NOTEBOOKS,
  HYDRATE_CONFIG_FROM_LOCALSTORAGE,
} from "./action.names";

Vue.use(Vuex);

export const store = new Vuex.Store({
  state: {
    config: {
      host: "localhost",
      port: 41184,
      apiToken: null,
      notebook: null,
    },
    notebooks: [],
  },
  getters: {
    [CONFIG](state) {
      return state.config;
    },
    [NOTEBOOKS](state) {
      return state.notebooks;
    },
    [CURRENT_NOTEBOOK_LABEL](state) {
      if (state.config.notebook == null) {
        return null;
      }
      const entry = state.notebooks.find((v) => {
        return v.id == state.config.notebook;
      });
      if (entry) {
        return entry.title;
      }
      return null;
    },
  },
  actions: {
    async [GET_NOTEBOOKS]({ commit, getters }) {
      const config = getters[CONFIG];
      if (validateConfig(config)) {
        try {
          const data = await getNotebooks(config);
          commit(SET_NOTEBOOKS, data.items);
        } catch (e) {
          // console.log(e);
        }
      } else {
        commit(SET_NOTEBOOKS, []);
      }
    },
    async [HYDRATE_CONFIG_FROM_LOCALSTORAGE]({ commit, dispatch }) {
      const lconf = window.localStorage.getItem("config");
      if (lconf) {
        commit(SET_CONFIG, JSON.parse(lconf));
      }
      dispatch(GET_NOTEBOOKS);
    },
  },
  mutations: {
    [SET_NOTEBOOKS](state, payload) {
      state.notebooks = payload;
    },
    [SET_CONFIG](state, payload) {
      state.config = { ...state.config, ...payload };
      window.localStorage.setItem("config", JSON.stringify(state.config));
    },
  },
});
