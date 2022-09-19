async function sleep(time = 100) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

class MainClass_Renderer {
  static setupSomeClasses() {
    document
      .querySelector(`[title="Roles"]`)
      ?.parentElement.parentElement.parentElement.parentElement.classList.add("roles");

    if (
      location.pathname ===
      "/index.php/%D0%97%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F_%D1%81%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0"
    ) {
      document.querySelector(".mw-parser-output > div > div:nth-child(2) > div > div")?.classList.add("set-bg");
    }

    const firstDiv = document.querySelector(".mw-parser-output > div:nth-child(1)");

    if (firstDiv?.style.display === "grid" && firstDiv?.style.float === "right") {
      [...firstDiv.children].forEach((x) => {
        [...x.children].forEach((y) => {
          if (y.style.backgroundColor === "white") {
            y.classList.add("set-bg");
          }
        });
      });
    }
  }
}

class MainClass_Base {
  static settings = {};
  static localSettings = {};

  static setupFields(initializer) {
    Object.keys(initializer).forEach((key) => {
      MainClass_Base[key] = initializer[key];
    });
  }

  static setOptions(options) {
    browser.storage.sync.set(options).catch(() => {
      clearInterval(MainClass_Base.interval);
    });

    browser.runtime.sendMessage({ action: "settingsUpdated", data: { ...MainClass_Base.settings, ...options } });
  }

  static setLocalOptions(options) {
    browser.storage.local.set(options).catch(() => {
      clearInterval(MainClass_Base.interval);
    });

    browser.runtime.sendMessage({ action: "localSettingsUpdated", data: MainClass_Base.localSettings });
  }

  static setupStyleBySettings() {
    if (MainClass_Base.settings.enableBackground) {
      document.documentElement.classList.add("kd-bg");
    } else {
      document.documentElement.classList.remove("kd-bg");
    }

    document.documentElement?.classList.remove("kd-pre");

    const settingsStyle = document.head.querySelector("#kd-settings-style") || document.createElement("style");
    settingsStyle.id = "kd-settings-style";

    const bgColor = MainClass_Base.settings.background;
    const color = MainClass_Base.settings.color;
    const linksColor = MainClass_Base.settings.linksColor;

    const getContrastColor = (colorHex, threshold = 128) => {
      if (!colorHex) {
        return "#000";
      }

      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorHex);

      if (!result) {
        return "#000";
      }

      return (parseInt(result[1], 16) * 299 + parseInt(result[2], 16) * 587 + parseInt(result[3], 16) * 114) / 1000 >=
        threshold
        ? "#000"
        : "#fff";
    };

    let text = "";

    text += `
      :root {
        --kd-bg: ${bgColor};
        --kd-color: ${color};
        --kd-link-color: ${linksColor};
        `;

    text += `}`;

    text = text.replaceAll("\n", "");

    while (text.includes("  ")) {
      text = text.replaceAll("  ", " ");
    }

    text = text
      .replaceAll("; ", ";")
      .replaceAll(/\s*{\s*/g, "{")
      .replaceAll(/\s*}\s*/g, "}")
      .replaceAll(/\s*:\s*/g, ":")
      .replaceAll(/\s*,\s*/g, ",");

    settingsStyle.innerText = text;

    document.head.insertAdjacentElement("beforeend", settingsStyle);
  }
}

class MainClass_Events {
  static collapseThreadClick(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const collapser = e.target;
    const thread = collapser.parentElement.parentElement;
    const threadId = +thread.querySelector(".post__reflink")?.id;

    if (!!thread) {
      const collapse = !thread.classList.contains("collapsed");

      if (collapse) {
        if (collapser.parentElement.getBoundingClientRect().top > thread.getBoundingClientRect().top) {
          thread.scrollIntoView();
        }

        thread.classList.add("collapsed");

        const arr = MainClass_Base.isBThread
          ? MainClass_Base.localSettings.collapsedThreads.b
          : MainClass_Base.localSettings.collapsedThreads.all;
        if (isFinite(threadId) && arr.every((x) => x.id !== threadId)) {
          const obj = {
            id: threadId,
          };

          if (MainClass_Base.isBThread) {
            obj.date = +new Date();
          }

          arr.push(obj);
          MainClass_Base.setLocalOptions(MainClass_Base.localSettings);
        }
      } else {
        thread.classList.remove("collapsed");

        if (isFinite(threadId)) {
          const arr = MainClass_Base.isBThread
            ? MainClass_Base.localSettings.collapsedThreads.b
            : MainClass_Base.localSettings.collapsedThreads.all;
          const index = arr.find((x) => x.id === threadId);

          if (index > -1) {
            arr.splice(index, 1);

            MainClass_Base.setLocalOptions(MainClass_Base.localSettings);
          }
        }
      }

      collapser.innerText = collapse ? "˄" : "˅";
    }
  }

  static setupCoreListeners() {
    browser.runtime.onMessage.addListener((message) => {
      switch (message.action) {
        case "settingsUpdated":
          const newSettings = message.data;
          const currentSettings = MainClass_Base.settings;

          const enableBackgroundChanged = newSettings.enableBackground !== currentSettings.enableBackground;
          const backgroundChanged = newSettings.background !== currentSettings.background;
          const colorChanged = newSettings.color !== currentSettings.color;
          const linksColorChanged = newSettings.linksColor !== currentSettings.linksColor;

          MainClass_Base.settings = newSettings;

          if (backgroundChanged || colorChanged || linksColorChanged || enableBackgroundChanged) {
            MainClass_Base.setupStyleBySettings();
          }

          break;

        case "redirect":
          location = message.data;
          break;
        case "savedLinksUpdated":
          MainClass_Base.localSettings.links = message.data;
          break;

        case "saveCurrentLink":
          const name = window.prompt("Сохранить текушую страницу?\nИмя:");

          if (name === null) {
            break;
          }

          let link = decodeURI(location.pathname + location.hash);

          const newLink = {
            link,
            name,
          };

          MainClass_Base.localSettings.links.push(newLink);

          MainClass_Base.setLocalOptions({
            links: MainClass_Base.localSettings.links,
          });

          browser.runtime.sendMessage({ action: "savedLinksUpdated", data: MainClass_Base.localSettings.links });
          break;

        default:
          break;
      }
    });
  }
}
