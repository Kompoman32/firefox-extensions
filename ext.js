var defaultOptionsValues = {
  maxHeight: 700,
  // Reversed (if true => replace)
  thumbImages: true,
  bTitles: true,
  bTitlesSize: 47,
  runGif: true,
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

    let { toggled, intervalTimeout } = await browser.storage.sync.get({ toggled: true, intervalTimeout: 5000 });

    if (!isFinite(intervalTimeout) || intervalTimeout < 0) {
      intervalTimeout = 5000;
    }

    toggled = !!toggled;

    class MainClass {
      static toggled = toggled;
      static interval = null;

      static toggler = null;
      static settingsPageButton = null;

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

        threads.forEach((thread) => {
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

              collapser.removeEventListener("click", MainClass.collapseClick);
              collapser.addEventListener("click", MainClass.collapseClick);

              postOppost.insertAdjacentElement("afterbegin", collapser);
            }

            let title = postOppost.querySelector(".post__title");

            const isBThread = threadGroup === "/b/";
            const isBThreadTitlesEnabled = settings.bTitles;

            if (isBThread && !isBThreadTitlesEnabled) {
              return;
            }

            if (!title) {
              title = document.createElement("span");
              title.classList.add("post__title");

              if (isThreadPage) {
                title.innerText = document.head.querySelector("title").innerText.replace(`${threadGroup} - `, "");
              } else {
                const postText = thread.querySelector(".post_type_oppost article").innerText;

                const textByWords = postText.replaceAll("\n", " ").replaceAll("  ", " ").split(" ");

                let titleText = "";

                for (let i = 0; i < textByWords.length; i++) {
                  if (titleText.length + textByWords[i].length > settings.bTitlesSize) {
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
              a.target = "_blank";

              a.title = title.title;

              title.replaceWith(a);
            }
          }

          thread.dataset.threadUpdated = true;
        });

        consoleGroupEnd();
      }

      static updatePosts() {
        const posts = [...document.querySelectorAll(".post:not([data-post-updated]):not(.post_preview)")];

        consoleGroup("Posts");
        consoleLog("Posts updated: ", posts.length);
        if (posts.length === 0) {
          consoleGroupEnd();
          return;
        }

        posts.forEach((post, _, arr) => {
          const postsImgs = [...post.querySelectorAll(".post__image-link img:not(.post__file-webm)")];
          const postsImgsVideos = [...post.querySelectorAll(".post__image-link img.post__file-webm")];

          if (!settings.runGif) {
            postsImgsVideos.push(...post.querySelectorAll(`.post__image-link img[data-type="4"]`));
          }

          postsImgs.forEach((x) => {
            // if (!x || x.src === `${location.origin}${x.dataset.src}`) {
            //   return;
            // }

            x.dataset.thumbHeight = x.height;
            x.dataset.thumbWidth = x.width;
            x.setAttribute("height", x.dataset.height);
            x.setAttribute("width", x.dataset.width);
            x.setAttribute("loading", "lazy");

            x.dataset.thumbSrc = x.src;
            if (settings.thumbImages && (x.dataset.type !== "4" || settings.runGif)) {
              x.src = x.dataset.src;
            }
          });

          postsImgsVideos.forEach((x) => {
            const aLink = x.parentElement;

            const title = x.dataset.title || "";
            const ext = title.substr(title.lastIndexOf(".") + 1);

            const div = document.createElement("div");
            div.innerText = ext;
            aLink.appendChild(div);

            aLink.classList.add("webm");
          });

          post.dataset.postUpdated = true;
        });

        consoleGroupEnd();
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

        threads.forEach((thread) => {
          const missedPostCount = thread.querySelector(".thread__missed");
          const postOppost = thread.querySelector(".post_type_oppost .post__details");

          if (postOppost && missedPostCount && thread.children[0]) {
            thread.children[0].insertAdjacentElement("afterend", missedPostCount);
          }

          delete thread.dataset.threadUpdated;

          thread.classList.remove("collapsed");
          const collapser = postOppost.querySelector(".collapser");
          if (!!collapser) {
            collapser.removeEventListener("click", MainClass.collapseClick);
            collapser.remove();
          }
        });

        consoleGroupEnd();
      }

      static deUpdatePosts() {
        const posts = [...document.querySelectorAll(".post[data-post-updated]:not(.post_preview)")];

        consoleGroup("Posts");
        consoleLog("Posts deUpdated: ", posts.length);

        if (posts.length === 0) {
          consoleGroupEnd();
          return;
        }

        posts.forEach((post, _, arr) => {
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
        });

        consoleGroupEnd();
      }

      static setToggled(toggledValue) {
        consoleLog("SetToggled", toggledValue);

        MainClass.toggled = toggledValue;

        browser.storage.sync
          .set({
            toggled: toggledValue,
          })
          .then(() => {
            if (toggledValue) {
              clearInterval(MainClass.interval);
              MainClass.render();
              MainClass.interval = setInterval(MainClass.render, intervalTimeout);
            } else {
              clearInterval(MainClass.interval);
              MainClass.derender();
            }
          })
          .catch(() => {
            consoleError("Toggled sync error", toggledValue);
            clearInterval(MainClass.interval);
          });
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

      static settingsPageButtonClick() {
        function onOpened() {
          console.log(`Options page opened`);
        }

        function onError(error) {
          console.log(`Error: ${error}`);
        }

        let opening = browser.runtime.openOptionsPage();
        opening.then(onOpened, onError);

        // browser.runtime.openOptionsPage().then(console.log).catch(console.error);
      }

      static collapseClick(e) {
        const collapser = e.target;
        const thread = collapser.parentElement.parentElement;

        if (!!thread) {
          const collapse = !thread.classList.contains("collapsed");

          if (collapse) {
            thread.classList.add("collapsed");
          } else {
            thread.classList.remove("collapsed");
          }

          collapser.innerText = collapse ? "˄" : "˅";
        }
      }
    }

    const extensionSettingsEl = document.querySelector("#kd-settings") || document.createElement("span");
    extensionSettingsEl.id = "kd-settings";
    extensionSettingsEl.innerHTML = `
      <span id="kd-toggler">
          <span class="nm__switcher">
              <span class="nm__bullet"></span>
          </span>
          <label>Включить Kompoman32's design</label>
      </span>
      <span class="settings" title="Open settings">⛭</span>
      `;

    document.querySelector(".header__adminbar .adminbar__boards").appendChild(extensionSettingsEl);

    const toggler = extensionSettingsEl.querySelector("#kd-toggler");
    const settingsPageButton = extensionSettingsEl.querySelector("#kd-settings > .settings");

    if (MainClass.toggled) {
      toggler.classList.add("toggled");
      document.body.classList.add("kd-toggle");
    } else {
      toggler.classList.remove("toggled");
      document.body.classList.remove("kd-toggle");
    }

    MainClass.toggler = toggler;
    MainClass.settingsPageButton = settingsPageButton;

    MainClass.toggler.removeEventListener("click", MainClass.togglerClick);
    MainClass.toggler.addEventListener("click", MainClass.togglerClick);

    MainClass.settingsPageButton.removeEventListener("click", MainClass.settingsPageButtonClick);
    MainClass.settingsPageButton.addEventListener("click", MainClass.settingsPageButtonClick);

    setTimeout(() => {
      MainClass.setToggled(MainClass.toggled);
    }, 100);

    const settingsStyle = document.head.querySelector("#kd-settings-style") || document.createElement("style");
    settingsStyle.id = "kd-settings-style";

    settingsStyle.innerText = `
      body.kd-toggle .post:not(.post_preview) .post__image-link img {
        max-height: ${settings.maxHeight}px;
      }
    `;

    document.head.insertAdjacentElement("beforeend", settingsStyle);
  } catch (e) {
    console.error(e);
  }
})();
