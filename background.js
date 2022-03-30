browser.runtime.onMessage.addListener(function (message) {
  switch (message.action) {
    case "openOptionsPage":
      openOptionsPage();
      break;
    default:
      break;
  }
});

function openOptionsPage() {
  browser.runtime.openOptionsPage();
}
