"use strict";

import {
  app,
  protocol,
  BrowserWindow,
  Tray,
  ipcMain,
  globalShortcut,
} from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import path from "path";
import positioner from "electron-traywindow-positioner";

let win, tray;
const isDevelopment = process.env.NODE_ENV !== "production";
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

ipcMain.once("quit", (event, args) => {
  app.quit();
});

function showWindow(trayWindow, tray) {
  positioner.position(trayWindow, tray.getBounds());
  trayWindow.show();
}

export function toggleWindow() {
  if (win.isVisible()) {
    globalShortcut.unregister("Escape");
    return win.hide();
  } else {
    globalShortcut.register("Escape", () => {
      toggleWindow();
    });
    return showWindow(win, tray);
  }
}

async function createWindow() {
  // Create the browser window.
  const iconPath = process.env.WEBPACK_DEV_SERVER_URL
    ? path.join(__dirname, "/tray.png")
    : path.join(__dirname, "/tray/tray.png");
  tray = new Tray(iconPath);

  win = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    resizable: true,
    show: false,
    movable: false,
    minimizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    maximizable: false,
    title: "Joplin Scratchpad",
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
  }

  tray.on("click", () => {
    toggleWindow(win, tray);
  });
  return win;
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }
  win = await createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

ipcMain.on("change-toggle-shortcut", (evt, { val, oldVal }) => {
  if (oldVal) {
    globalShortcut.unregister(oldVal);
  }
  if (val) {
    globalShortcut.register(val, () => {
      toggleWindow();
    });
  }
});
