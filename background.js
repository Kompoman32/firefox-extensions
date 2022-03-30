browser.runtime.onMessage.addListener(function (message) {
  switch (message.action) {
    case "settingsUpdated":
      browser.tabs.query({ currentWindow: true, active: false }).then((tabs) => {
        tabs.forEach((tab) => {
          browser.tabs.sendMessage(tab.id, { action: "settingsUpdated", data: message.data });
        });
      });
      break;
    case "openOptionsPage":
      openOptionsPage();
      break;
    case "log":
      console.log(message);
      break;
    default:
      break;
  }
});

function openOptionsPage() {
  browser.runtime.openOptionsPage();
}
