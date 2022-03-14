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

    let { toggled, intervalTimeout } = await browser.storage.sync.get({ toggled: true, intervalTimeout: 5000 });

    if (!isFinite(intervalTimeout) || intervalTimeout < 0) {
      intervalTimeout = 5000;
    }

    toggled = !!toggled;

    class MainClass {
      static toggled = toggled;
      static interval = null;

      static render() {
        consoleGroup("KD -", "Render");
        MainClass.updateThreads();
        MainClass.updatePosts();
        document.body.classList.add("kd-toggle");
        consoleGroupEnd();
      }

      static updateThreads() {
        const threads = [...document.querySelectorAll(".thread:not([data-missed-moved])")];

        consoleGroup("Threads");
        consoleLog("Threads updated:", threads.length);

        if (threads.length === 0) {
          consoleGroupEnd();
          return;
        }

        threads.forEach((thread) => {
          const missedPostCount = thread.querySelector(".thread__missed");
          const postOppost = thread.querySelector(".post_type_oppost .post__details");

          if (!postOppost || !missedPostCount) {
            thread.dataset.missedMoved = true;
            return;
          }

          postOppost.insertAdjacentElement("beforeend", missedPostCount);

          thread.dataset.missedMoved = true;
        });

        consoleGroupEnd();
      }

      static updatePosts() {
        const posts = [...document.querySelectorAll(".post:not([data-original-href]):not(.post_preview)")];

        consoleGroup("Posts");
        consoleLog("Posts updated: ", posts.length);
        if (posts.length === 0) {
          consoleGroupEnd();
          return;
        }

        posts.forEach((post, _, arr) => {
          const post_oppost_detail = post.querySelector(".post_type_oppost .post__details");
          const thread = post.parentElement.parentElement;

          if (!!post_oppost_detail) {
            post_oppost_detail.classList.add("post__details__oppost");

            thread.insertAdjacentElement("afterbegin", post_oppost_detail);

            const title = post_oppost_detail.querySelector(".post__title");

            if (!!title) {
              const a = document.createElement("a");
              a.href = post_oppost_detail.querySelector(".post__reflink").href;
              a.innerText = title.innerText;
              a.classList.add("post__title");
              a.target = "_blank";

              title.replaceWith(a);
            }
          }

          const postsImgs = [...post.querySelectorAll(".post__image-link img:not(.post__file-webm)")];
          const postsImgsVideos = [...post.querySelectorAll(".post__image-link img.post__file-webm")];

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
            x.src = x.dataset.src;
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

          post.dataset.originalHref = true;
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
        const threads = [...document.querySelectorAll(".thread[data-missed-moved]")];

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

          delete thread.dataset.missedMoved;
        });

        consoleGroupEnd();
      }

      static deUpdatePosts() {
        const posts = [...document.querySelectorAll(".post[data-original-href]:not(.post_preview)")];

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

          delete post.dataset.originalHref;
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

        if (toggled) {
          toggler.classList.add("toggled");
        } else {
          toggler.classList.remove("toggled");
        }

        MainClass.setToggled(toggled);
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

    setTimeout(() => {
      MainClass.setToggled(MainClass.toggled);
    }, 100);
  } catch (e) {
    console.error(e);
  }
})();
