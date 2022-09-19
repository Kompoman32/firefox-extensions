document.documentElement?.classList.add("kd-pre");

function setDefaultSettingsIfUndefined(settings, defaultSettings) {
  Object.keys(defaultSettings).forEach((setting) => {
    if (settings[setting] === undefined) {
      settings[setting] = defaultSettings[setting];
      return;
    }

    if (typeof settings[setting] === "object" && !Array.isArray(settings[setting])) {
      setDefaultSettingsIfUndefined(settings[setting], defaultSettings[setting]);
      return;
    }
  });
}

(async () => {
  [...document.querySelectorAll("img")].forEach((x) => {
    x.setAttribute("loading", "lazy");
  });

  try {
    const settings = await browser.storage.sync.get(defaultOptionsValues);
    const localSettings = await browser.storage.local.get(defaultLocalOptionsValues);

    if (!settings) {
      return;
    }

    setDefaultSettingsIfUndefined(settings, defaultOptionsValues);

    if (settings.links && settings.links.length) {
      localSettings.links = [...settings.links, ...localSettings.links];
      settings.links = [];

      MainClass_Base.setOptions(settings);
      MainClass_Base.setLocalOptions(localSettings);
    }

    MainClass_Base.setupFields({
      settings,
      localSettings,
    });

    MainClass_Renderer.setupSomeClasses();
    MainClass_Base.setupStyleBySettings();
    MainClass_Events.setupCoreListeners();

    const togglerLI = document.querySelector(".li-toggler") || document.createElement("li");
    togglerLI.classList.add("mw-list-item");
    togglerLI.classList.add("li-toggler");

    const toggler = togglerLI.querySelector(".toggler") || document.createElement("div");
    toggler.classList.add("toggler");
    toggler.innerText = "🌙";

    toggler.addEventListener("mouseup", () => {
      MainClass_Base.setOptions({ enableBackground: !MainClass_Base.settings.enableBackground });
    });

    togglerLI.appendChild(toggler);
    document.querySelector("#p-personal .vector-menu-content-list")?.appendChild(togglerLI);
  } catch (e) {
    console.error(e);
  }
})();
