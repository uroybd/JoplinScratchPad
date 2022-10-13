const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        appId: "me.utsob.joplinscratchpad",
        productName: "Joplin Scratchpad",
        mac: {
          target: [
            {
              target: "dmg",
              arch: ["x64", "arm64"],
            },
          ],
        },
        linux: {
          target: [
            {
              target: "AppImage",
              arch: ["x64", "arm64"],
            },
          ],
        },
      },
    },
  },
});
