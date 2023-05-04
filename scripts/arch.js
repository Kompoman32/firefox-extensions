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

    const originalSettings = await browser.storage.sync.get(defaultOptionsValues);
    // const localSettings = await browser.storage.local.get(defaultLocalOptionsValues);

    if (!originalSettings) {
      return;
    }

    setDefaultSettingsIfUndefined(originalSettings, defaultOptionsValues);

    const settings = defaultOptionsValues;
    settings.autoSave = false;
    settings.thumbImages = false;
    settings.maxHeight = 300;
    settings.showPlashque = false;
    settings.runGif = false;
    settings.downloadWarning = originalSettings.downloadWarning;
    settings.downloadWarningSize = originalSettings.downloadWarningSize;
    settings.downloadWarningScale = originalSettings.downloadWarningScale;
    settings.popupBackground = false;
    settings.colorPost = false;
    settings.collapseDuplicates = false;
    settings.shortcuts = {};

    const localSettings = defaultLocalOptionsValues;

    const isThreadPage = new RegExp("/.+/res/*/").test(location.pathname);
    const threadGroup = location.pathname.substring(0, location.pathname.substr(1).indexOf("/") + 2);
    const isBThread = threadGroup === "/b/";
    const isBeta = new RegExp("beta.2ch.hk").test(location.hostname);
    const isMuon = document.getElementById("SwitchStyles") && document.getElementById("SwitchStyles").value === "muon";
    const currentThreadId = isThreadPage
      ? +location.pathname.substring(location.pathname.indexOf("res/") + 4).replace(".html", "")
      : null;

    if (isMuon) {
      document.documentElement.classList.add("muon");
    }

    let { toggled, intervalTimeout } = settings;

    if (!isFinite(intervalTimeout) || intervalTimeout < 0) {
      intervalTimeout = 5000;
    }

    toggled = !!toggled;

    MainClass_Base.setupFields({
      toggled,
      isThreadPage,
      threadGroup,
      isBThread,
      isBeta,
      isMuon,
      currentThreadId,
      settings,
      localSettings,
      intervalTimeout,
    });

    if (settings.links && settings.links.length) {
      localSettings.links = [...settings.links, ...localSettings.links];
      settings.links = [];

      MainClass_Base.setOptions(settings);
      MainClass_Base.setLocalOptions(localSettings);
    }

    // MainClass_Base.setupTopBar();
    MainClass_Base.setupStyleBySettings();
    // MainClass_Events.setupCoreListeners();
    // MainClass_Events.checkExpiresLocalOptions();

    setTimeout(() => {
      MainClass_Base.setToggled(true);
    }, 100);
  } catch (e) {
    console.error(e);
  }
})();

MainClass_Events.postMenuClickListener = async function (e) {
  await sleep(50);

  const menu = document.querySelector("#ABU-select");

  if (!menu) {
    return;
  }

  const addSplitter = (className) => {
    let splitter = menu.querySelector(`div.splitter.${className}`);

    if (!splitter) {
      splitter = document.createElement("div");
      splitter.classList.add("splitter");
    }

    menu.appendChild(splitter);
  };

  const addMenuItem = (elClass, text, callback) => {
    let a = menu.querySelector(`a.${elClass}`);
    if (!a) {
      a = document.createElement("a");
      a.classList.add(elClass);
      a.href = "#";
      a.innerText = text;

      a.addEventListener("click", callback);
    }

    menu.appendChild(a);
  };

  addSplitter("splitter-1");

  const postLink = e.target.parentElement.parentElement.querySelector(".post__reflink");

  const isThreadPost =
    MainClass_Base.currentThreadId === +postLink.id ||
    e.target.parentElement.parentElement.classList.contains("post__details__oppost");

  addMenuItem("update-images", "Обновить изображения", (e) => {
    e.preventDefault();
    MainClass_Events.updateImages(e, +postLink.id, isThreadPost);
  });

  const postsImgs = [
    ...document.querySelectorAll(`#${isThreadPost ? "thread" : "post"}-${+postLink.id} .post__image-link img`),
  ];

  if (postsImgs.length) {
    if (isThreadPost) {
      addMenuItem("view-images", "Посмотреть изображения", (e) => {
        e.preventDefault();
        MainClass_Events.viewAllImages(e, postsImgs);
      });
    }

    addMenuItem("download-images", "Скачать изображения", (e) => {
      e.preventDefault();
      MainClass_Events.downloadImages(e, +postLink.id, isThreadPost, postsImgs);
    });

    addMenuItem("download-images-zip", "Скачать изображения zip", (e) => {
      e.preventDefault();
      MainClass_Events.downloadImages(e, +postLink.id, isThreadPost, postsImgs, true);
    });
  }

  // addMenuItem("save-link", "Сохранить ссылку", (e) => {
  //   e.preventDefault();
  //   MainClass_Events.savePostLink(e, postLink);
  // });

  // if (!isThreadPost) {
  //   return;
  // }

  // addMenuItem("save-bottom", "Сохранить #bottom", (e) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   MainClass_Events.savePostLink(e, postLink, true);
  // });

  // addMenuItem("save-arhivach", "Сохранить на arhivach.top", (e) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   MainClass_Events.saveArhivach(e, postLink);
  // });
};

const modalSaveImages = Modal_ImageDownloader.prototype.saveImages;

Modal_ImageDownloader.prototype.saveImages = function () {
  const images = [...this.modalRef.querySelectorAll(".images img.selected")];
  images.forEach((x) => delete x.dataset.src);

  modalSaveImages.call(this);
};
