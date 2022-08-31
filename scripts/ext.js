(async () => {
  [...document.querySelectorAll("img")].forEach((x) => {
    x.setAttribute("loading", "lazy");
  });

  try {
    // NO ARCHIVACH
    if (new RegExp("/.+/arch/*/").test(location.pathname)) {
      throw "No Archivach please";
    }

    const settings = await browser.storage.sync.get(defaultOptionsValues);
    const localSettings = await browser.storage.local.get(defaultLocalOptionsValues);

    if (!settings) {
      return;
    }

    const isThreadPage = new RegExp("/.+/res/*/").test(location.pathname);
    const threadGroup = location.pathname.substring(0, location.pathname.substr(1).indexOf("/") + 2);
    const isBThread = threadGroup === "/b/";
    const isBeta = new RegExp("beta.2ch.hk").test(location.hostname);
    const isMuon = document.getElementById("SwitchStyles") && document.getElementById("SwitchStyles").value === "muon";
    const currentThreadId = isThreadPage
      ? +location.pathname.substring(location.pathname.indexOf("res/") + 4).replace(".html", "")
      : null;

    if (isMuon) {
      document.body.parentElement.classList.add("muon");
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

    MainClass_Base.setupTopBar();
    MainClass_Base.setupStyleBySettings();
    MainClass_Events.setupCoreListeners();

    setTimeout(() => {
      MainClass_Base.setToggled(MainClass_Base.toggled);
    }, 100);
  } catch (e) {
    console.error(e);
  }
})();
