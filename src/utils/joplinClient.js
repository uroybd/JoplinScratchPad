import axios from "axios";

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
  const { data } = await axios.get(
    `${getBaseURL(config)}/folders?token=${config.apiToken}`
  );
  return data;
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
  )}&type=note&fields=body,title,id`;
  const existing = await axios.get(query);
  // console.log(existing);
  if (existing && existing.data.items.length === 0) {
    return {
      id: null,
      content: "",
    };
  } else {
    return {
      id: existing.data.items[0].id,
      content: existing.data.items[0].body,
    };
  }
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

export async function createOrUpdateScratchPad(data, nblabel, config, tag) {
  // console.log(data, nblabel, config, tag);
  if (!validateConfig(config) || config.notebook == null) {
    return null;
  }
  let url = `${getBaseURL(config)}/notes/${
    data.id !== null ? "" + data.id + "/" : ""
  }?token=${config.apiToken}`;
  let method = axios.put;
  const payload = { body: data.content, parent_id: config.notebook };
  if (data.id == null) {
    method = axios.post;
    payload.title = getNoteLabel();
  } else {
    try {
      await axios.get(url);
    } catch (e) {
      data.id = null;
      method = axios.post;
      payload.title = getNoteLabel();
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
    content: response.data.body,
  };
}

export function debounce(fn, delay) {
  var timeoutID = null;
  return function () {
    clearTimeout(timeoutID);
    var args = arguments;
    var that = this;
    timeoutID = setTimeout(function () {
      fn.apply(that, args);
    }, delay);
  };
}
