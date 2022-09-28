import axios from "axios";
import { differenceByDays } from "./common";

export function validateConfig(config) {
  if (!config.host || typeof config.host !== "string" || !config.host.length) {
    return false;
  }
  if (!config.port || typeof config.port !== "number") {
    return false;
  }
  if (
    !config.apiToken ||
    typeof config.apiToken !== "string" ||
    !config.apiToken.length
  ) {
    return false;
  }
  return true;
}

export function getNoteLabel() {
  const date = new Date();
  return `Scratchpad ${date.toLocaleDateString()}`;
}

export function getBaseURL(config) {
  return `http://${config.host}:${config.port}`;
}

export async function getNotebooks(config) {
  let page = 1;
  let { data } = await axios.get(
    `${getBaseURL(config)}/folders?token=${config.apiToken}&page=${page}`
  );
  let notebooks = data.items;
  while (data.has_more == true) {
    page++;
    data = await axios.get(
      `${getBaseURL(config)}/folders?token=${config.apiToken}&page=${page}`
    ).data;
    notebooks = [...notebooks, data.item];
  }
  return notebooks;
}

export async function getScratchPad(config, nblabel) {
  if (!validateConfig(config) || !nblabel) {
    return null;
  }
  // console.log(config, nblabel);
  const query = `${getBaseURL(config)}/search?token=${
    config.apiToken
  }&query=tag:scratchpad notebook:${encodeURIComponent(
    nblabel
  )}&type=note&fields=body,title,id,created_time,is_todo&order_by=created_time&order_dir=DESC&limit=10`;
  const existing = await axios.get(query);
  // console.log(existing);
  if (existing && existing.data.items.length === 0) {
    return {
      id: null,
      title: null,
      content: "",
      is_todo: config.is_todo,
    };
  }
  let entry = existing.data.items[0];
  if (differenceByDays(new Date(), new Date(entry["created_time"])) == 0) {
    return {
      id: entry.id,
      title: entry.title,
      content: entry.body,
      is_todo: entry.is_todo,
    };
  }
  return {
    id: null,
    title: null,
    content: "",
    is_todo: config.is_todo,
  };
}

export async function getScratchPadTag(config) {
  if (!validateConfig(config) || config.notebook == null) {
    return null;
  }
  // console.log(config);
  const url = `${getBaseURL(config)}/search/?token=${
    config.apiToken
  }&query=scratchpad&type=tag`;
  try {
    const { data } = await axios.get(url);
    if (data.items.length) {
      return data.items[0].id;
    } else {
      try {
        const resp = await axios.post(
          `${getBaseURL(config)}/tags/?token=${config.apiToken}`,
          { title: "scratchpad" }
        );
        return resp.data.id;
      } catch (e) {
        return null;
      }
    }
  } catch (e) {
    return null;
  }
}

export async function createOrUpdateScratchPad(data, nblabel, config) {
  // console.log(data, nblabel, config, tag);
  if (!validateConfig(config) || config.notebook == null) {
    return null;
  }
  let tag = await getScratchPadTag(config);
  let url = `${getBaseURL(config)}/notes/${
    data.id !== null ? "" + data.id + "/" : ""
  }?token=${config.apiToken}`;
  let method = axios.put;
  const payload = {
    body: data.content,
    parent_id: config.notebook,
    is_todo: data.is_todo,
  };
  if (data.id == null) {
    method = axios.post;
    payload.title = data.is_todo ? data.content : getNoteLabel();
  } else {
    try {
      await axios.get(url);
    } catch (e) {
      data.id = null;
      method = axios.post;
      payload.title = data.is_todo ? data.content : getNoteLabel();
      url = `${getBaseURL(config)}/notes/${
        data.id !== null ? "" + data.id + "/" : ""
      }?token=${config.apiToken}`;
      // console.log(data, nblabel, config, tag);
    }
  }
  const response = await method(url, payload);
  await axios.post(
    `${getBaseURL(config)}/tags/${tag}/notes/?token=${config.apiToken}`,
    { id: response.data.id }
  );
  return {
    id: response.data.id,
    title: response.data.title,
    content: response.data.body,
    is_todo: response.data.is_todo,
  };
}

export async function updateTitle(id, title, config) {
  if (!validateConfig(config) || config.notebook == null) {
    return null;
  }
  let url = `${getBaseURL(config)}/notes/${id}/?token=${config.apiToken}`;
  return axios.put(url, { title });
}

export async function updateIsTodo(id, value, config) {
  if (!validateConfig(config) || config.notebook == null) {
    return null;
  }
  let url = `${getBaseURL(config)}/notes/${id}/?token=${config.apiToken}`;
  return axios.put(url, { is_todo: value });
}
