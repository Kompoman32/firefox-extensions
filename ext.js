var defaultOptionsValues = {
  maxHeight: 700,
  // Reversed (if true => replace)
  thumbImages: true,
  bTitles: true,
  bTitlesSize: 47,

  titleToBottom: false,

  showPlashque: true,

  runGif: true,

  previewBackground: true,
  previewBackgroundColor: "#15202b",
  previewBackgroundOpacity: 0.86328125,

  colorPost: true,
  colors: {
    double: "#b5b5b5",
    triple: "#deb8e1",
    quadruple: "#f5f982",
    quintuple: "#82f98f",
    sextuple: "#ee8b99",
    septuple: "#ee8b99",
    noncuple: "#ee8b99",
  },

  autoSave: false,
  toggled: true,
  intervalTimeout: 5000,
};

var defaultLocalOptionsValues = {
  links: [],
  collapsedThreads: {
    b: [],
    all: [],
  },
};

var bTimeExpires = 3 * 24 * 60 * 60 * 1000;

function consoleLog(...args) {
  if (localStorage.getItem("kd-debug")) {
    console.log(...args);
  }
}
function consoleError(...args) {
  if (localStorage.getItem("kd-debug")) {
    console.error(...args);
  }
}
function consoleWarn(...args) {
  if (localStorage.getItem("kd-debug")) {
    console.warn(...args);
  }
}
function consoleGroup(...args) {
  if (localStorage.getItem("kd-debug")) {
    console.group(...args);
  }
}

function consoleGroupEnd() {
  if (localStorage.getItem("kd-debug")) {
    console.groupEnd();
  }
}

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
    const currentThreadId = isThreadPage
      ? +location.pathname.substring(location.pathname.indexOf("res/") + 4).replace(".html", "")
      : null;

    let { toggled, intervalTimeout } = settings;

    if (!isFinite(intervalTimeout) || intervalTimeout < 0) {
      intervalTimeout = 5000;
    }

    toggled = !!toggled;

    class MainClass {
      static settings = {};
      static localSettings = {};

      static toggled = toggled;
      static interval = null;

      static toggler = null;
      static settingsPageButton = null;

      static threadName = threadGroup;
      static isThreadPage = isThreadPage;
      static currentThreadId = currentThreadId;

      static setOptions(options) {
        browser.storage.sync.set(options).catch(() => {
          clearInterval(MainClass.interval);
        });

        browser.runtime.sendMessage({ action: "settingsUpdated", data: MainClass.settings });
      }

      static setLocalOptions(options) {
        browser.storage.local.set(options).catch(() => {
          clearInterval(MainClass.interval);
        });

        browser.runtime.sendMessage({ action: "localSettingsUpdated", data: MainClass.localSettings });
      }

      static start() {
        clearInterval(MainClass.interval);
        MainClass.render();
        MainClass.setupListeners();
        MainClass.interval = setInterval(MainClass.render, intervalTimeout);

        MainClass.toggled = true;
        MainClass.settings.toggled = true;

        MainClass.setOptions({ toggled: true });

        const form = document.querySelector("#posts-form");

        if (form) {
          form.removeEventListener("click", MainClass.savePostMenuListener);
          form.addEventListener("click", MainClass.savePostMenuListener);
        }

        setTimeout(() => {
          if (!!location.hash) {
            location = location;
          }
        }, 100);
      }

      static stop() {
        clearInterval(MainClass.interval);
        MainClass.derender();

        MainClass.toggled = false;
        MainClass.settings.toggled = false;

        MainClass.setOptions({ toggled: false });

        const form = document.querySelector("#posts-form");

        if (form) {
          form.removeEventListener("click", MainClass.savePostMenuListener);

          const menu = document.querySelector("#ABU-select");

          if (!!menu) {
            let el = menu.querySelector("div.splitter");
            if (!!el) {
              el.remove();
            }

            el = menu.querySelector("a.save-link");
            if (!!el) {
              el.remove();
            }
          }
        }
      }

      static render() {
        console.log(MainClass.settings.intervalTimeout);
        consoleGroup("KD -", "Render");
        MainClass.updateThreads();
        MainClass.updatePosts();
        document.body.parentElement.classList.add("kd-toggle");
        if (isBeta) {
          document.body.parentElement.classList.add("beta");
        }

        if (!MainClass.settings.showPlashque) {
          document.body.parentElement.classList.add("hide-plashque");
        }

        consoleGroupEnd();
      }

      static updateThreads() {
        const threads = [...document.querySelectorAll(".thread:not([data-thread-updated])")];

        consoleGroup("Threads");
        consoleLog("Threads updated:", threads.length);

        if (threads.length === 0) {
          consoleGroupEnd();
          return;
        }

        threads.forEach((thread) => MainClass.updateThread(thread));

        consoleGroupEnd();
      }

      static updateThread(thread, updateGeneratedTitle = false) {
        const missedPostCount = thread.querySelector(".thread__missed");
        const postOppost = thread.querySelector(".post_type_oppost .post__details, .post__details__oppost");

        if (!!postOppost) {
          postOppost.classList.add("post__details__oppost");

          const threadId = +thread.querySelector(".post__reflink")?.id;

          thread.insertAdjacentElement("afterbegin", postOppost);

          if (!!missedPostCount) {
            postOppost.insertAdjacentElement("beforeend", missedPostCount);
          }

          if (!isThreadPage) {
            const collapser = postOppost.querySelector(".collapser") || document.createElement("span");
            collapser.classList.add("collapser");

            let isCollapsed = false;

            if (isFinite(threadId)) {
              const checkArr = isBThread
                ? MainClass.localSettings.collapsedThreads.b
                : MainClass.localSettings.collapsedThreads.all;
              isCollapsed = checkArr.some((x) => x.id === threadId);
            }

            if (isCollapsed) {
              thread.classList.add("collapsed");
            } else {
              thread.classList.remove("collapsed");
            }

            collapser.innerText = thread.classList.contains("collapsed") ? "˄" : "˅";

            collapser.removeEventListener("click", MainClass.collapseThreadClick);
            collapser.addEventListener("click", MainClass.collapseThreadClick);

            postOppost.insertAdjacentElement("afterbegin", collapser);
          }

          let title = updateGeneratedTitle ? undefined : postOppost.querySelector(".post__title");

          const isBThreadTitlesEnabled = MainClass.settings.bTitles;

          if (isBThread && !isBThreadTitlesEnabled) {
            return;
          }

          if (!title) {
            title = document.createElement("span");
            title.classList.add("post__title");
            title.classList.add("post__title__generated");

            if (isThreadPage) {
              title.innerText = document.head.querySelector("title").innerText.replace(`${threadGroup} - `, "");
            } else {
              const postText = thread.querySelector(".post_type_oppost article").innerText;

              const textByWords = postText.replaceAll("\n", " ").replaceAll("  ", " ").split(" ");

              let titleText = "";

              for (let i = 0; i < textByWords.length; i++) {
                if (titleText.length + textByWords[i].length > MainClass.settings.bTitlesSize) {
                  titleText += " ...";
                  break;
                }

                titleText += ` ${textByWords[i]}`;
              }

              titleText = titleText.trim();

              title.innerText = titleText;

              title.title = postText;
            }

            const detailPart = postOppost.querySelector(".post__detailpart");

            if (detailPart) {
              detailPart.insertAdjacentElement("afterbegin", title);
            }
          }

          if (!isThreadPage) {
            const a = document.createElement("a");
            let href = postOppost.querySelector(".post__reflink").href;
            href = href.substring(0, href.lastIndexOf("#"));

            if (MainClass.settings.titleToBottom) {
              href = href + "#bottom";
            }

            a.href = href;
            a.innerText = title.innerText;
            a.classList.add("post__title");
            if (title.classList.contains("post__title__generated")) {
              a.classList.add("post__title__generated");
            }
            a.target = "_blank";

            a.title = title.title;

            title.replaceWith(a);
          }
        }

        thread.dataset.threadUpdated = true;
      }

      static updatePosts() {
        const posts = [...document.querySelectorAll(".post:not([data-post-updated]):not(.post_preview)")];
        const postsInPreview = [...document.querySelectorAll(".post:not([data-post-updated]).post_preview")];

        consoleGroup("Posts");
        consoleLog("Posts updated: ", posts.length + postsInPreview.length);
        if (posts.length === 0 && postsInPreview.length === 0) {
          consoleGroupEnd();
          return;
        }

        posts.forEach((post) => MainClass.updatePost(post));
        postsInPreview.forEach((post) => {
          MainClass.addPostNbleClass(post);

          post.dataset.postUpdated = true;
        });

        consoleGroupEnd();
      }

      static updatePost(post, updateRunGif = true) {
        const postsImgs = [...post.querySelectorAll(".post__image-link img:not(.post__file-webm)")];
        const postsImgsVideos = [...post.querySelectorAll(".post__image-link img.post__file-webm")];

        if (updateRunGif) {
          const gifs = post.querySelectorAll(`.post__image-link img[data-type="4"]`);
          if (!MainClass.settings.runGif) {
            postsImgsVideos.push(...gifs);
          } else {
            gifs.forEach((gif) => {
              const title = gif.parentElement.querySelector(".video-ext");
              if (title) {
                title.remove();
              }
            });
          }
        }

        postsImgs.forEach((x) => {
          x.dataset.thumbHeight = x.height;
          x.dataset.thumbWidth = x.width;
          x.setAttribute("height", x.dataset.height);
          x.setAttribute("width", x.dataset.width);

          if (!x.dataset.thumbSrc) {
            x.dataset.thumbSrc = x.src;
          }

          let srcToChange =
            !MainClass.settings.thumbImages || (x.dataset.type === "4" && !MainClass.settings.runGif)
              ? x.dataset.thumbSrc
              : x.dataset.src;

          if (srcToChange !== x.src) {
            x.src = srcToChange;
          }
        });

        postsImgsVideos.forEach((x) => {
          const aLink = x.parentElement;

          const title = x.dataset.title || "";
          const ext = title.substr(title.lastIndexOf(".") + 1);

          const div = document.createElement("div");
          div.classList.add("video-ext");
          div.innerText = ext;
          aLink.appendChild(div);

          aLink.classList.add("webm");
        });

        MainClass.addPostNbleClass(post);

        post.dataset.postUpdated = true;
      }

      static addPostNbleClass(post) {
        let postHeader = post.querySelector(".post__details");

        if (!postHeader) {
          return;
        }

        if (post.classList.contains("post_type_oppost")) {
          postHeader = post.parentElement.previousElementSibling;
        }

        const num = postHeader.querySelector(".post__reflink").id;
        const character = num[num.length - 1];

        let count = 1;

        for (let i = num.length - 2; i > -1; i--, count++) {
          if (num[i] !== character) {
            break;
          }
        }

        const postClass = [
          undefined,
          undefined,
          "double",
          "triple",
          "quadruple",
          "quintuple",
          "sextuple",
          "septuple",
          "noncuple",
        ][count];

        if (postClass) {
          post.classList.add(postClass);
        }
      }

      static derender() {
        consoleGroup("KD -", "DeRender");
        MainClass.deUpdateThreads();
        MainClass.deUpdatePosts();
        MainClass.deSetupListeners();
        document.body.parentElement.classList.remove("kd-toggle");
        document.body.parentElement.classList.remove("hide-plashque");
        consoleGroupEnd();
      }

      static deUpdateThreads() {
        const threads = [...document.querySelectorAll(".thread[data-thread-updated]")];

        consoleGroup("Threads");
        consoleLog("Threads deUpdated:", threads.length);
        if (threads.length === 0) {
          consoleGroupEnd();
          return;
        }

        threads.forEach((thread) => MainClass.deUpdateThread(thread));

        consoleGroupEnd();
      }

      static deUpdateThread(thread) {
        const missedPostCount = thread.querySelector(".thread__missed");
        const postOppost = thread.querySelector(".post__details__oppost.post__details");

        if (postOppost && missedPostCount && thread.children[0]) {
          thread.children[0].insertAdjacentElement("afterend", missedPostCount);
        }

        delete thread.dataset.threadUpdated;

        thread.classList.remove("collapsed");
        const collapser = postOppost.querySelector(".collapser");
        if (!!collapser) {
          collapser.removeEventListener("click", MainClass.collapseThreadClick);
          collapser.remove();
        }
      }

      static deUpdatePosts() {
        const posts = [...document.querySelectorAll(".post[data-post-updated]:not(.post_preview)")];

        consoleGroup("Posts");
        consoleLog("Posts deUpdated: ", posts.length);

        if (posts.length === 0) {
          consoleGroupEnd();
          return;
        }

        posts.forEach((post) => MainClass.deUpdatePost(post));

        consoleGroupEnd();
      }

      static deUpdatePost(post) {
        const thread = post.parentElement.parentElement;
        const post_oppost_detail = thread.querySelector(".post_type_oppost .post__details");

        if (!!post_oppost_detail) {
          post_oppost_detail.classList.remove("post__details__oppost");

          const originalPost = thread.querySelector(".post");

          originalPost.insertAdjacentElement("afterbegin", post_oppost_detail);

          const title = post_oppost_detail.querySelector(".post__title");

          if (!!title) {
            const span = document.createElement("span");
            span.innerText = title.innerText;
            span.classList.add("post__title");

            title.replaceWith(span);
          }
        }

        const postsImgs = [...post.querySelectorAll(".post__image-link img:not(.post__file-webm)")];
        const postsImgsVideos = [...post.querySelectorAll(".post__image-link img.post__file-webm")];

        postsImgs.forEach((x) => {
          if (!x.dataset.thumbSrc) {
            x.removeAttribute("width");
            x.removeAttribute("height");
            return;
          }

          x.setAttribute("width", x.dataset.thumbWidth);
          x.setAttribute("height", x.dataset.thumbHeight);
          x.removeAttribute("loading");

          // x.src = x.dataset.thumbSrc;
        });

        postsImgsVideos.forEach((x) => {
          const aLink = x.parentElement;

          aLink.remove(aLink.querySelector("div"));

          aLink.classList.remove("webm");
        });

        delete post.dataset.postUpdated;
      }

      static setToggled(toggledValue) {
        consoleLog("SetToggled", toggledValue);

        if (toggledValue) {
          MainClass.start();
        } else {
          MainClass.stop();
        }
      }

      static setupTopBar() {
        const extensionSettingsEl = document.querySelector("#kd-settings") || document.createElement("span");
        extensionSettingsEl.id = "kd-settings";
        extensionSettingsEl.innerHTML = `
          <span id="kd-toggler">
              <span class="nm__switcher">
                  <span class="nm__bullet"></span>
              </span>
              <label>Включить Kompoman32's design</label>
          </span>
          `;

        // no beta || beta
        const header =
          document.querySelector(".header__adminbar .adminbar__boards") || document.querySelector(".header__opts");

        if (header) {
          header.appendChild(extensionSettingsEl);
        }

        const toggler = extensionSettingsEl.querySelector("#kd-toggler");

        if (toggler) {
          if (MainClass.toggled) {
            toggler.classList.add("toggled");
            document.body.classList.add("kd-toggle");
            if (isBeta) {
              document.body.classList.add("beta");
            }
          } else {
            toggler.classList.remove("toggled");
            document.body.classList.remove("kd-toggle");
          }
        }

        MainClass.toggler = toggler;

        MainClass.toggler.removeEventListener("click", MainClass.togglerClick);
        MainClass.toggler.addEventListener("click", MainClass.togglerClick);
      }

      static togglerClick() {
        const toggled = !MainClass.toggled;

        consoleLog("TogglerClick", toggled);

        if (MainClass.toggler) {
          if (toggled) {
            MainClass.toggler.classList.add("toggled");
          } else {
            MainClass.toggler.classList.remove("toggled");
          }
        }

        MainClass.setToggled(toggled);
      }

      static collapseThreadClick(e) {
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

            const arr = isBThread
              ? MainClass.localSettings.collapsedThreads.b
              : MainClass.localSettings.collapsedThreads.all;
            if (isFinite(threadId) && arr.every((x) => x.id !== threadId)) {
              const obj = {
                id: threadId,
              };

              if (isBThread) {
                obj.date = +new Date();
              }

              arr.push(obj);
              MainClass.setLocalOptions(MainClass.localSettings);
            }
          } else {
            thread.classList.remove("collapsed");

            if (isFinite(threadId)) {
              const arr = isBThread
                ? MainClass.localSettings.collapsedThreads.b
                : MainClass.localSettings.collapsedThreads.all;
              const index = arr.find((x) => x.id === threadId);

              if (index > -1) {
                arr.splice(index, 1);

                MainClass.setLocalOptions(MainClass.localSettings);
              }
            }
          }

          collapser.innerText = collapse ? "˄" : "˅";
        }
      }

      static setupStyleBySettings() {
        const settingsStyle = document.head.querySelector("#kd-settings-style") || document.createElement("style");
        settingsStyle.id = "kd-settings-style";

        const color =
          MainClass.settings.previewBackgroundColor +
          Math.round(Math.min(Math.max(MainClass.settings.previewBackgroundOpacity, 0), 1) * 255).toString(16);

        let text = "";

        text += `:root {
            --kd-max-image-height: ${MainClass.settings.maxHeight}px;
            --kd-modal-bg: ${color};`;

        if (MainClass.settings.colorPost) {
          text +=
            "" +
            `--kd-double-color: ${MainClass.settings.colors.double};
          --kd-triple-color: ${MainClass.settings.colors.triple};
          --kd-quadruple-color: ${MainClass.settings.colors.quadruple};
          --kd-quintuple-color: ${MainClass.settings.colors.quintuple};
          --kd-sextuple-color: ${MainClass.settings.colors.sextuple};
          --kd-septuple-color: ${MainClass.settings.colors.septuple};
          --kd-noncuple-color: ${MainClass.settings.colors.noncuple};`;
        }

        text += `}`;

        if (MainClass.settings.previewBackground) {
          text += `
          
          hrml.kd-toggle body .mv {
            position: fixed;
            background: var(--kd-modal-bg);
          }`;
        }

        text = text.replaceAll("\n", "");

        while (text.includes("  ")) {
          text = text.replaceAll("  ", " ");
        }

        settingsStyle.innerText = text;

        document.head.insertAdjacentElement("beforeend", settingsStyle);
      }

      static setupCoreListeners() {
        browser.runtime.onMessage.addListener((message) => {
          switch (message.action) {
            case "settingsUpdated":
              const newSettings = message.data;
              const currentSettings = MainClass.settings;

              const maxHeightChanged = newSettings.maxHeight !== currentSettings.maxHeight;
              const thumbImagesChanged = newSettings.thumbImages !== currentSettings.thumbImages;
              const bTitlesChanged = newSettings.bTitles !== currentSettings.bTitles;
              const bTitlesSizeChanged = newSettings.bTitlesSize !== currentSettings.bTitlesSize;
              const showPlashqueChanged = newSettings.showPlashque !== currentSettings.showPlashque;
              const titleToBottomChanged = newSettings.titleToBottom !== currentSettings.titleToBottom;
              const runGifChanged = newSettings.runGif !== currentSettings.runGif;
              const previewBackgroundChanged = newSettings.previewBackground !== currentSettings.previewBackground;
              const previewBackgroundColorChanged =
                newSettings.previewBackgroundColor !== currentSettings.previewBackgroundColor;
              const previewBackgroundOpacityChanged =
                newSettings.previewBackgroundOpacity !== currentSettings.previewBackgroundOpacity;
              const colorPostChanged = newSettings.colorPost !== currentSettings.colorPost;
              const someColorChanged = Object.keys(newSettings.colors).some(
                (key) => newSettings.colors[key] !== currentSettings.colors[key]
              );
              const toggledChanged = newSettings.toggled !== currentSettings.toggled;
              const intervalTimeoutChanged = newSettings.intervalTimeout !== currentSettings.intervalTimeout;

              MainClass.settings = newSettings;

              if (titleToBottomChanged || bTitlesChanged || bTitlesSizeChanged) {
                const threads = [...document.querySelectorAll(".thread")];

                threads.forEach((thread) => {
                  MainClass.updateThread(thread, !titleToBottomChanged);
                });
              }

              if (runGifChanged || thumbImagesChanged) {
                const posts = [...document.querySelectorAll(".post:not(.post_preview)")];

                posts.forEach((post) => {
                  MainClass.updatePost(post, runGifChanged);
                });
              }

              if (
                maxHeightChanged ||
                previewBackgroundChanged ||
                previewBackgroundColorChanged ||
                previewBackgroundOpacityChanged ||
                colorPostChanged ||
                someColorChanged
              ) {
                MainClass.setupStyleBySettings();
              }

              if (intervalTimeoutChanged && newSettings.toggled) {
                clearInterval(MainClass.interval);
                MainClass.interval = setInterval(MainClass.render, MainClass.settings.intervalTimeout);
              }

              if (showPlashqueChanged) {
                if (!newSettings.showPlashque) {
                  document.body.classList.add("hide-plashque");
                } else {
                  document.body.classList.remove("hide-plashque");
                }
              }

              break;

            case "redirect":
              location = message.data;
              break;
            case "savedLinksUpdated":
              MainClass.localSettings.links = message.data;
              break;

            default:
              break;
          }
        });
      }

      static setupListeners() {
        document.body.addEventListener("keydown", MainClass.keydownBodyListener);
        document.body.addEventListener("keyup", MainClass.keyupBodyListener);
      }

      static deSetupListeners() {
        document.body.removeEventListener("keydown", MainClass.keydownBodyListener);
        document.body.removeEventListener("keyup", MainClass.keyupBodyListener);
      }

      static keydownBodyListener(event) {
        const previewVideo = document.querySelector("#js-mv-main video");

        const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

        if (!!previewVideo && event.shiftKey && arrowKeys.includes(event.key)) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          event.cancelBubble = true;

          const volume = (forward) => {
            const increaseVolume = 0.1 * (forward ? 1 : -1);
            previewVideo.volume += increaseVolume;
          };

          const time = (more) => {
            const duration = previewVideo.duration;
            const skipTime = Math.min(duration / 10, 15) * (more ? 1 : -1);
            previewVideo.currentTime += skipTime;
          };

          switch (event.key) {
            case "ArrowUp":
              volume(true);
              break;
            case "ArrowDown":
              volume(false);
              break;
            case "ArrowRight":
              time(true);
              break;
            case "ArrowLeft":
              time(false);
              break;

            default:
              break;
          }
        }
      }
      static keyupBodyListener(event) {
        const previewVideo = document.querySelector("#js-mv-main video");

        const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

        if (!!previewVideo && event.shiftKey && arrowKeys.includes(event.key)) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          event.cancelBubble = true;
        }
      }

      static savePostMenuListener(e) {
        const menu = document.querySelector("#ABU-select");

        if (!menu) {
          return;
        }

        let splitter = menu.querySelector("div.splitter");
        if (!splitter) {
          splitter = document.createElement("div");
          splitter.classList.add("splitter");
        }

        menu.appendChild(splitter);

        const postLink = e.target.parentElement.parentElement.querySelector(".post__reflink");

        let a = menu.querySelector("a.save-link");
        if (!a) {
          a = document.createElement("a");
          a.classList.add("save-link");
          a.href = "#";
          a.innerText = "Сохранить ссылку";

          a.addEventListener("click", (e) => {
            MainClass.savePostLink(e, postLink);
          });
        }

        menu.appendChild(a);

        const saveBottom =
          MainClass.currentThreadId === +postLink.id ||
          e.target.parentElement.parentElement.classList.contains("post__details__oppost");

        if (saveBottom) {
          a = menu.querySelector("a.save-bottom");
          if (!a) {
            a = document.createElement("a");
            a.classList.add("save-bottom");
            a.href = "#";
            a.innerText = `Сохранить #bottom`;

            a.addEventListener("click", (e) => {
              MainClass.savePostLink(e, postLink, true);
            });
          }
        }

        menu.appendChild(a);
      }

      static savePostLink(e, postLink, saveBottom = false) {
        e.preventDefault();

        if (!postLink) {
          return;
        }

        let defaultPostName =
          MainClass.currentThreadId === +postLink.id || saveBottom
            ? postLink.parentElement.parentElement.querySelector(".post__title").innerText.trim()
            : `Пост №${postLink.id} в ${MainClass.threadName}`;
        defaultPostName = defaultPostName || document.head.querySelector("title").innerText.trim();

        const name = window.prompt("Название ссылки", defaultPostName);

        if (name === null) {
          return;
        }

        let link =
          MainClass.currentThreadId === +postLink.id || saveBottom
            ? postLink.pathname
            : `${postLink.pathname}#${postLink.id}`;
        link = saveBottom ? link + `#bottom` : link;

        const newLink = {
          link,
          name,
        };

        MainClass.localSettings.links.push(newLink);

        MainClass.setLocalOptions({
          links: MainClass.localSettings.links,
        });

        browser.runtime.sendMessage({ action: "savedLinksUpdated", data: MainClass.settings.links });
      }
    }

    MainClass.settings = settings;
    MainClass.localSettings = localSettings;

    if (settings.links && settings.links.length) {
      localSettings.links = [...settings.links, ...localSettings.links];
      settings.links = [];

      MainClass.setOptions(settings);
      MainClass.setLocalOptions(localSettings);
    }

    MainClass.setupTopBar();
    MainClass.setupStyleBySettings();
    MainClass.setupCoreListeners();

    setTimeout(() => {
      MainClass.setToggled(MainClass.toggled);
    }, 100);
  } catch (e) {
    console.error(e);
  }
})();
