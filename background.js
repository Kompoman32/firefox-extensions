browser.runtime.onMessage.addListener(function (message) {
  switch (message.action) {
    case "settingsUpdated":
    case "localSettingsUpdated":
    case "redirect":
    case "savedLinksUpdated":
    case "saveCurrentLink":
      browser.tabs.query({}).then((tabs) => {
        tabs.forEach((tab) => {
          browser.tabs.sendMessage(tab.id, { action: message.action, data: message.data }).catch(() => {});
        });
      });
      break;
    case "log":
      console.log(message);
      break;
    default:
      break;
  }
});
