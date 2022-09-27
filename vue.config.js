const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        appId: "me.utsob.joplinscratchpad",
        productName: "Joplin Scratchpad",
        linux: {
          target: [
            {
              target: "AppImage",
              arch: ["x64", "ia32", "arm64”"],
            },
          ],
        },
      },
    },
  },
});
