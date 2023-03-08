function notFoundPage() {
  const threadGroup = location.pathname.substring(0, location.pathname.substr(1).indexOf("/") + 2);

  let threadId = location.pathname.substring(location.pathname.indexOf("/res/") + 5);

  threadId = threadId.substring(0, threadId.indexOf("."));

  if (isNaN(+threadId)) {
    return;
  }

  const a = document.createElement("a");
  a.innerText = "arhivach.top";
  a.href = `https://www.google.com/search?hl=ru&q=%2F${threadGroup}%2Fres%2F${threadId}%20site%3Aarhivach.top`;

  const textWrapper = document.querySelector(".box__header.nf__header");

  textWrapper?.insertBefore(document.createElement("br"), textWrapper.childNodes[4]);
  textWrapper?.insertBefore(document.createTextNode("Хотя можно поискать на "), textWrapper.childNodes[5]);
  textWrapper?.insertBefore(a, textWrapper.childNodes[6]);
}

(async () => {
  try {
    console.log(new RegExp("/.+/arch/.+/res/").test(location.pathname) && document.title === "Not Found");
    // ONLY ARCHIVACH
    if (!new RegExp("/.+/arch/*/").test(location.pathname)) {
      return;
    }

    // archived thread and 404 has title "Not Found"
    if (new RegExp("/.+/arch/.+/res/").test(location.pathname) && document.title === "Not found") {
      notFoundPage();
      return;
    }
  } catch (e) {
    console.error(e);
  }
})();
