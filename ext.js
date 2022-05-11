var defaultOptionsValues = {
  maxHeight: 700,
  // Reversed (if true => replace)
  thumbImages: true,
  bTitles: true,
  bTitlesSize: 47,
  runGif: true,

  previewBackground: true,
  previewBackgroundColor: "#15202b",
  previewBackgroundOpacity: 0.86328125,

  links: [],

  autoSave: false,
  toggled: true,
  intervalTimeout: 5000,
};

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

  [...document.querySelectorAll("img")].forEach(x => {
    x.setAttribute("loading", "lazy");
  });

  try {
    // NO ARCHIVACH
    if (new RegExp("/.+/arch/*/").test(location.pathname)) {
      throw "No Archivach please";
    }

    const settings = await browser.storage.sync.get(defaultOptionsValues);

    if (!settings) {
      return;
    }

    const isThreadPage = new RegExp("/.+/res/*/").test(location.pathname);
    const threadGroup = location.pathname.substring(0, location.pathname.substr(1).indexOf("/") + 2);

    let { toggled, intervalTimeout } = settings;

    if (!isFinite(intervalTimeout) || intervalTimeout < 0) {
      intervalTimeout = 5000;
    }

    toggled = !!toggled;

    class MainClass {
      static settings = {};

      static toggled = toggled;
      static interval = null;

      static toggler = null;
      static settingsPageButton = null;

      static setOptions(options) {
        browser.storage.sync.set(options)
        .catch(() => {
          consoleError("Toggled sync error", toggledValue);
          clearInterval(MainClass.interval);
        });
      }

      static start() {
        clearInterval(MainClass.interval);
        MainClass.render();
        MainClass.interval = setInterval(MainClass.render, intervalTimeout);

        MainClass.toggled = true;
        MainClass.settings.toggled = true;

        MainClass.setOptions({ toggled: true });

        const form = document.querySelector('#posts-form');

        if (form) {
          form.removeEventListener('click', MainClass.savePostMenuListener);
          form.addEventListener('click', MainClass.savePostMenuListener);
        }

        setTimeout(() => {
          if (!!location.hash) {
            location = location
          }
        }, 100)
      }

      static stop() {
        clearInterval(MainClass.interval);
        MainClass.derender();

        MainClass.toggled = false;
        MainClass.settings.toggled = false;

        MainClass.setOptions({ toggled: false });

        const form = document.querySelector('#posts-form');

        if (form) {
          form.removeEventListener('click', MainClass.savePostMenuListener);

          const menu = document.querySelector('#ABU-select');

          if (!!menu) {
            let el = menu.querySelector('div.splitter');
            if (!!el) {
              el.remove()
            }
            
            el = menu.querySelector('a.save-link');
            if (!!el) {
              el.remove()
            }
          }
        }
      }

      static render() {
        consoleGroup("KD -", "Render");
        MainClass.updateThreads();
        MainClass.updatePosts();
        document.body.classList.add("kd-toggle");
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
        const postOppost = thread.querySelector(".post_type_oppost .post__details");

        if (!!postOppost) {
          postOppost.classList.add("post__details__oppost");

          thread.insertAdjacentElement("afterbegin", postOppost);

          if (!!missedPostCount) {
            postOppost.insertAdjacentElement("beforeend", missedPostCount);
          }

          if (!isThreadPage) {
            const collapser = postOppost.querySelector(".collapser") || document.createElement("span");
            collapser.classList.add("collapser");
            collapser.innerText = thread.classList.contains("collapsed") ? "˄" : "˅";

            collapser.removeEventListener("click", MainClass.collapseThreadClick);
            collapser.addEventListener("click", MainClass.collapseThreadClick);

            postOppost.insertAdjacentElement("afterbegin", collapser);
          }

          let title = updateGeneratedTitle ? undefined : postOppost.querySelector(".post__title");

          const isBThread = threadGroup === "/b/";
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
            a.href = postOppost.querySelector(".post__reflink").href;
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

        consoleGroup("Posts");
        consoleLog("Posts updated: ", posts.length);
        if (posts.length === 0) {
          consoleGroupEnd();
          return;
        }

        posts.forEach((post) => MainClass.updatePost(post));

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

        post.dataset.postUpdated = true;
      }

      static derender() {
        consoleGroup("KD -", "DeRender");
        MainClass.deUpdateThreads();
        MainClass.deUpdatePosts();
        document.body.classList.remove("kd-toggle");
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
        const postOppost = thread.querySelector(".post_type_oppost .post__details");

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

        document.querySelector(".header__adminbar .adminbar__boards").appendChild(extensionSettingsEl);

        const toggler = extensionSettingsEl.querySelector("#kd-toggler");

        if (MainClass.toggled) {
          toggler.classList.add("toggled");
          document.body.classList.add("kd-toggle");
        } else {
          toggler.classList.remove("toggled");
          document.body.classList.remove("kd-toggle");
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

        if (!!thread) {
          const collapse = !thread.classList.contains("collapsed");

          if (collapse) {
            if (collapser.parentElement.getBoundingClientRect().top > thread.getBoundingClientRect().top) {
              thread.scrollIntoView();
            }

            thread.classList.add("collapsed");
          } else {
            thread.classList.remove("collapsed");
          }

          collapser.innerText = collapse ? "˄" : "˅";
        }
      }

      static setupStyleBySettings() {
        const settingsStyle = document.head.querySelector("#kd-settings-style") || document.createElement("style");
        settingsStyle.id = "kd-settings-style";

        settingsStyle.innerText = `
          body.kd-toggle .post:not(.post_preview) .post__image-link img {
            max-height: ${MainClass.settings.maxHeight}px;
          }
    
        `;

        if (MainClass.settings.previewBackground) {
          const color =
            MainClass.settings.previewBackgroundColor +
            Math.round(Math.min(Math.max(MainClass.settings.previewBackgroundOpacity, 0), 1) * 255).toString(16);

          settingsStyle.innerText += `
          body.kd-toggle .mv {
            position: fixed;
            background: ${color};
          }
          `;
        }

        document.head.insertAdjacentElement("beforeend", settingsStyle);
      }

      static setupListeners() {
        browser.runtime.onMessage.addListener((message) => {
          switch (message.action) {
            case "settingsUpdated":
              const newSettings = message.data;
              const currentSettings = MainClass.settings;

              const maxHeightChanged = newSettings.maxHeight !== currentSettings.maxHeight;
              const thumbImagesChanged = newSettings.thumbImages !== currentSettings.thumbImages;
              const bTitlesChanged = newSettings.bTitles !== currentSettings.bTitles;
              const bTitlesSizeChanged = newSettings.bTitlesSize !== currentSettings.bTitlesSize;
              const runGifChanged = newSettings.runGif !== currentSettings.runGif;
              const previewBackgroundChanged = newSettings.previewBackground !== currentSettings.previewBackground;
              const previewBackgroundColorChanged =
                newSettings.previewBackgroundColor !== currentSettings.previewBackgroundColor;
              const previewBackgroundOpacityChanged =
                newSettings.previewBackgroundOpacity !== currentSettings.previewBackgroundOpacity;
              const toggledChanged = newSettings.toggled !== currentSettings.toggled;
              const intervalTimeoutChanged = newSettings.intervalTimeout !== currentSettings.intervalTimeout;

              MainClass.settings = newSettings;

              if (bTitlesChanged || bTitlesSizeChanged) {
                const threads = [...document.querySelectorAll(".thread")];

                threads.forEach((thread) => {
                  MainClass.updateThread(thread, true);
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
                previewBackgroundOpacityChanged
              ) {
                MainClass.setupStyleBySettings();
              }

              if (intervalTimeoutChanged && newSettings.toggled) {
                clearInterval(MainClass.interval);
                MainClass.interval = setInterval(MainClass.render, MainClass.settings.intervalTimeout);
              }
              break;
            
            case "redirect":
              location = message.data;
              break;
            case "savedLinksUpdated":
              MainClass.settings.links = message.data;
              break;
            
            default:
              break;
          }
        });
      }

      static savePostMenuListener(e) {
        const menu = document.querySelector('#ABU-select');

        if (!menu) {
          return;
        }

        let splitter = menu.querySelector('div.splitter');
        if (!splitter) {
          splitter = document.createElement('div');
          splitter.classList.add('splitter');
        };

        menu.appendChild(splitter);

        let a = menu.querySelector('a.save-link');
        if (!a) {
          a = document.createElement('a');
          a.classList.add('save-link');
          a.href = '#';
          a.innerText = 'Сохранить ссылку';

          a.addEventListener('click', MainClass.savePostLink);

          a._postRefLink = e.target.parentElement.parentElement.querySelector('.post__reflink');
        };

        menu.appendChild(a);
      }

      static savePostLink(e) {
        e.preventDefault();

        const postLink = e.target._postRefLink;

        if (!postLink) {
          return;
        }
        
        const name = window.prompt("Название ссылки",`Пост №${postLink.id}`);

        if (name === null) {
          return;
        }

        const newLink = {
          link: `${postLink.pathname}#${postLink.id}`,
          name: name
        }

        MainClass.settings.links.push(newLink);

        MainClass.setOptions({
          links: MainClass.settings.links
        });
      }
    }

    MainClass.settings = settings;

    MainClass.setupTopBar();
    MainClass.setupStyleBySettings();
    MainClass.setupListeners();

    setTimeout(() => {
      MainClass.setToggled(MainClass.toggled);
    }, 100);
  } catch (e) {
    console.error(e);
  }
})();
