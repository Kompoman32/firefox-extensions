browser.runtime.onMessage.addListener(function (message) {
  switch (message.action) {
    case "settingsUpdated":
    case "localSettingsUpdated":
    case "redirect":
    case "savedLinksUpdated":
      browser.tabs.query({}).then((tabs) => {
        tabs.forEach((tab) => {
          browser.tabs.sendMessage(tab.id, { action: message.action, data: message.data }).catch(() => {});
        });
      });
      break;
    case "log":
      console.log(message);
      break;
    case "download":
      const zipName = message.data.zipName;
      const files = message.data.files;

      if (!files?.length) {
        break;
      }

      (async () => {
        const blob = await ZIP.downloadZip(files).blob();

        saveAs(blob, zipName);
      })();

      break;
    default:
      break;
  }
});
