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

class MainClass_Base {
  static settings = {};
  static localSettings = {};

  static toggled = false;
  static interval = null;

  static toggler = null;
  static settingsPageButton = null;

  static threadName = null;
  static isThreadPage = false;
  static currentThreadId = null;

  static isBThread = false;

  static isBeta = false;
  static isMuon = false;

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

  static setToggled(toggledValue) {
    consoleLog("SetToggled", toggledValue);

    if (toggledValue) {
      MainClass_Base.start();
    } else {
      MainClass_Base.stop();
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
      if (MainClass_Base.toggled) {
        toggler.classList.add("toggled");
        document.body.classList.add("kd-toggle");
        if (MainClass_Base.isBeta) {
          document.body.classList.add("beta");
        }
      } else {
        toggler.classList.remove("toggled");
        document.body.classList.remove("kd-toggle");
      }
    }

    MainClass_Base.toggler = toggler;

    MainClass_Base.toggler.removeEventListener("click", MainClass_Base.togglerClick);
    MainClass_Base.toggler.addEventListener("click", MainClass_Base.togglerClick);
  }

  static togglerClick() {
    const toggled = !MainClass_Base.toggled;

    consoleLog("TogglerClick", toggled);

    if (MainClass_Base.toggler) {
      if (toggled) {
        MainClass_Base.toggler.classList.add("toggled");
      } else {
        MainClass_Base.toggler.classList.remove("toggled");
      }
    }

    MainClass_Base.setToggled(toggled);
  }

  static start() {
    const modal = document.querySelector("body > .mv");

    if (modal) {
      if (MainClass_Base.settings.popupAnimate) {
        modal.classList.add("animated");
      }

      animationValues.forEach((x) => {
        modal.classList.remove(x);
      });

      modal.classList.add(MainClass_Base.settings.popupAnimation);
    }

    clearInterval(MainClass_Base.interval);
    MainClass_Render.render();
    MainClass_Events.setupListeners();
    MainClass_Base.interval = setInterval(MainClass_Render.render, MainClass_Base.settings.intervalTimeout);

    MainClass_Base.toggled = true;
    MainClass_Base.settings.toggled = true;

    MainClass_Base.setOptions({ toggled: true });

    setTimeout(() => {
      if (!!location.hash) {
        location = location;
      }
    }, 100);
  }

  static stop() {
    clearInterval(MainClass_Base.interval);
    MainClass_Derender.derender();

    MainClass_Base.toggled = false;
    MainClass_Base.settings.toggled = false;

    MainClass_Base.setOptions({ toggled: false });
  }

  static setupStyleBySettings() {
    const settingsStyle = document.head.querySelector("#kd-settings-style") || document.createElement("style");
    settingsStyle.id = "kd-settings-style";

    const color =
      MainClass_Base.settings.popupBackgroundColor +
      Math.round(Math.min(Math.max(MainClass_Base.settings.popupBackgroundOpacity, 0), 1) * 255).toString(16);

    let text = "";

    text += `
      :root {
        --kd-max-image-height: ${MainClass_Base.settings.maxHeight}px;
        --kd-modal-bg: ${color};
        `;

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

    if (MainClass_Base.settings.colorPost) {
      text += `
      --kd-double-color: ${getContrastColor(MainClass_Base.settings.colors.double)};
      --kd-double-back-color: ${MainClass_Base.settings.colors.double};
      --kd-triple-color: ${getContrastColor(MainClass_Base.settings.colors.triple)};
      --kd-triple-back-color: ${MainClass_Base.settings.colors.triple};
      --kd-quadruple-color: ${getContrastColor(MainClass_Base.settings.colors.quadruple)};
      --kd-quadruple-back-color: ${MainClass_Base.settings.colors.quadruple};
      --kd-quintuple-color: ${getContrastColor(MainClass_Base.settings.colors.quintuple)};
      --kd-quintuple-back-color: ${MainClass_Base.settings.colors.quintuple};
      --kd-sextuple-color: ${getContrastColor(MainClass_Base.settings.colors.sextuple)};
      --kd-sextuple-back-color: ${MainClass_Base.settings.colors.sextuple};
      --kd-septuple-color: ${getContrastColor(MainClass_Base.settings.colors.septuple)};
      --kd-septuple-back-color: ${MainClass_Base.settings.colors.septuple};
      --kd-octuple-color: ${getContrastColor(MainClass_Base.settings.colors.octuple)};
      --kd-octuple-back-color: ${MainClass_Base.settings.colors.octuple};
      --kd-noncuple-color: ${getContrastColor(MainClass_Base.settings.colors.noncuple)};
      --kd-noncuple-back-color: ${MainClass_Base.settings.colors.noncuple};
      `;
    }

    text += `--kd-muon-background: #211F1A url('https://${location.host}/static/img/muon_bg.jpg') repeat;`;

    text += `}`;

    if (MainClass_Base.settings.popupBackground) {
      text += `
      html.kd-toggle body .mv {
        position: fixed;
        background: var(--kd-modal-bg);
      }
      `;
    }

    if (!MainClass_Base.settings.popupBackground_img) {
      text += `
      html.kd-toggle body .mv.img {
        position: unset;
      }
      `;
    }
    if (!MainClass_Base.settings.popupBackground_gif) {
      text += `
      html.kd-toggle body .mv.gif {
        position: unset;
      }
      `;
    }
    if (!MainClass_Base.settings.popupBackground_vid) {
      text += `
      html.kd-toggle body .mv.vid {
        position: unset;
      }
      `;
    }

    text += `
    html.kd-toggle body .mv.animated .mv__main {
      animation-duration: ${MainClass_Base.settings.popupAnimationTime}s;
    }
    `;

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

class MainClass_Render {
  static render() {
    consoleLog(MainClass_Base.settings.intervalTimeout);
    consoleGroup("KD -", "Render");
    MainClass_Render.updateThreads();
    MainClass_Render.updatePosts();
    MainClass_Render.updatePreview();
    document.body.parentElement.classList.add("kd-toggle");
    if (MainClass_Base.isBeta) {
      document.body.parentElement.classList.add("beta");
    }

    if (!MainClass_Base.settings.showPlashque) {
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

    threads.forEach((thread) => MainClass_Render.updateThread(thread));

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

      if (!MainClass_Base.isThreadPage) {
        const collapser = postOppost.querySelector(".collapser") || document.createElement("span");
        collapser.classList.add("collapser");

        let isCollapsed = false;

        if (isFinite(threadId)) {
          const checkArr = MainClass_Base.isBThread
            ? MainClass_Base.localSettings.collapsedThreads.b
            : MainClass_Base.localSettings.collapsedThreads.all;
          isCollapsed = checkArr.some((x) => x.id === threadId);
        }

        if (isCollapsed) {
          thread.classList.add("collapsed");
        } else {
          thread.classList.remove("collapsed");
        }

        collapser.innerText = thread.classList.contains("collapsed") ? "˄" : "˅";

        collapser.removeEventListener("click", MainClass_Events.collapseThreadClick);
        collapser.addEventListener("click", MainClass_Events.collapseThreadClick);

        postOppost.insertAdjacentElement("afterbegin", collapser);
      }

      let title = updateGeneratedTitle ? undefined : postOppost.querySelector(".post__title");

      const isBThreadTitlesEnabled = MainClass_Base.settings.bTitles;

      if (MainClass_Base.isBThread && !isBThreadTitlesEnabled) {
        return;
      }

      if (!title) {
        title = document.createElement("span");
        title.classList.add("post__title");
        title.classList.add("post__title__generated");

        if (MainClass_Base.isThreadPage) {
          title.innerText = document.head
            .querySelector("title")
            .innerText.replace(`${MainClass_Base.threadGroup} - `, "");
        } else {
          const postText = thread.querySelector(".post_type_oppost article").innerText;

          const textByWords = postText.replaceAll("\n", " ").replaceAll("  ", " ").split(" ");

          let titleText = "";

          for (let i = 0; i < textByWords.length; i++) {
            if (titleText.length + textByWords[i].length > MainClass_Base.settings.bTitlesSize) {
              titleText += " ...";
              break;
            }

            titleText += ` ${textByWords[i]}`;
          }

          titleText = titleText.trim();

          title.innerText = titleText || `ТРЕД №${threadId}`;

          title.title = postText;
        }

        const detailPart = postOppost.querySelector(".post__detailpart");

        if (detailPart) {
          detailPart.insertAdjacentElement("afterbegin", title);
        }
      }

      if (!MainClass_Base.isThreadPage) {
        const a = document.createElement("a");
        let href = postOppost.querySelector(".post__reflink").href;
        href = href.substring(0, href.lastIndexOf("#"));

        if (MainClass_Base.settings.titleToBottom) {
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
    const postsInPopup = [...document.querySelectorAll(".post:not([data-post-updated]).post_preview")];

    consoleGroup("Posts");
    consoleLog("Posts updated: ", posts.length + postsInPopup.length);
    if (posts.length === 0 && postsInPopup.length === 0) {
      consoleGroupEnd();
      return;
    }

    posts.forEach((post) => MainClass_Render.updatePost(post));
    postsInPopup.forEach((post) => {
      MainClass_Render.addPostNbleClass(post);

      post.dataset.postUpdated = true;
    });

    consoleGroupEnd();
  }

  static updatePost(post, updateRunGif = true) {
    MainClass_Render.updatePostImages(post);
    MainClass_Render.updatePostVideos(post, updateRunGif);

    if (MainClass_Base.isThreadPage && MainClass_Base.settings.collapseDuplicates) {
      MainClass_Render.updateDuplicatePost(post);
    }

    MainClass_Render.addPostNbleClass(post);
    MainClass_Render.updatePostMenu(post);

    post.dataset.postUpdated = true;
  }
  static updatePostImages(post) {
    const postsImgs = [...post.querySelectorAll(".post__image-link img:not(.post__file-webm)")];

    postsImgs.forEach((x) => {
      x.dataset.thumbHeight = x.height;
      x.dataset.thumbWidth = x.width;
      x.setAttribute("height", x.dataset.height);
      x.setAttribute("width", x.dataset.width);

      if (!x.dataset.thumbSrc) {
        x.dataset.thumbSrc = x.src;
      }

      let srcToChange =
        !MainClass_Base.settings.thumbImages || (x.dataset.type === "4" && !MainClass_Base.settings.runGif)
          ? x.dataset.thumbSrc
          : x.dataset.src;

      if (srcToChange !== x.src) {
        x.src = srcToChange;
      }
    });
  }
  static updatePostVideos(post, updateRunGif) {
    const postsVideos = [...post.querySelectorAll(".post__image-link img.post__file-webm")];

    if (updateRunGif) {
      const gifs = post.querySelectorAll(`.post__image-link img[data-type="4"]`);
      if (!MainClass_Base.settings.runGif) {
        postsVideos.push(...gifs);
      } else {
        gifs.forEach((gif) => {
          const title = gif.parentElement.querySelector(".video-ext");
          if (title) {
            title.remove();
          }
        });
      }
    }

    postsVideos.forEach((x) => {
      const aLink = x.parentElement;

      const title = x.dataset.title || "";
      const ext = title.substr(title.lastIndexOf(".") + 1);

      const div = document.createElement("div");
      div.classList.add("video-ext");
      div.innerText = ext;
      aLink.appendChild(div);

      aLink.classList.add("webm");
    });
  }
  static updateDuplicatePost(post) {
    const previousPost = post.previousElementSibling;

    if (
      !previousPost ||
      post.classList.contains("post_type_oppost") ||
      previousPost.classList.contains("post_type_oppost") ||
      !!post.querySelector(".post__images ")
    ) {
      return;
    }

    const currentText = post._dup_text || post.querySelector(".post__message ").innerText.toLocaleLowerCase();
    const previousText =
      previousPost._dup_text || previousPost.querySelector(".post__message ").innerText.toLocaleLowerCase();

    post._dup_text = currentText;

    const isDuplicate = currentText === previousText;

    if (!isDuplicate) {
      return;
    }

    post.classList.add("duplicate");

    let dupParent = previousPost._dup_parent;

    if (!dupParent) {
      dupParent = previousPost;
    }

    post._dup_parent = dupParent;

    MainClass_Render.updateParentDuplicateCollapser(dupParent);
  }
  static updateParentDuplicateCollapser(parentPost) {
    const postDuplicates = [];

    let nextSibling = parentPost.nextElementSibling;

    while (nextSibling.classList.contains("duplicate")) {
      postDuplicates.push(nextSibling);

      nextSibling = nextSibling.nextElementSibling;
    }

    let duplicateCollapser = parentPost.querySelector(".duplicate-collapser") || document.createElement("div");

    if (postDuplicates.length === 0) {
      duplicateCollapser.remove();
      return;
    }

    postDuplicates.forEach((x) => {
      x.classList.add("collapsed");
    });

    parentPost._duplicates = postDuplicates;

    duplicateCollapser.classList.add("duplicate-collapser");

    parentPost.insertAdjacentElement("beforeend", duplicateCollapser);

    const text = duplicateCollapser.querySelector(".text") || document.createElement("span");
    text.innerText = `Есть дупликаты +${postDuplicates.length}`;
    text.classList.add("text");

    duplicateCollapser.appendChild(text);

    let collapser = duplicateCollapser.querySelector(".collapser");

    if (collapser) {
      collapser.remove();
    }

    collapser = document.createElement("span");
    collapser.classList.add("collapser");
    collapser.classList.add("collapsed");

    const collapserText = document.createElement("span");
    collapserText.innerText = "развернуть";
    collapser.appendChild(collapserText);

    const collapserIcon = document.createElement("span");
    collapserIcon.classList.add("collapser-icon");
    collapserIcon.innerText = "^";
    collapser.appendChild(collapserIcon);

    collapser.addEventListener("click", MainClass_Events.parentDuplicateCollapserClick.bind(undefined, parentPost));

    duplicateCollapser.appendChild(collapser);
  }

  static updatePostMenu(post) {
    if (!post) {
      return;
    }

    if (post.classList.contains("post_type_oppost")) {
      post = post.parentElement;
    }

    let button = post.querySelector('[*|href="#icon__addmenu"]');
    button = button && button.parentElement;

    if (!button) {
      return;
    }

    button.removeEventListener("click", MainClass_Events.savePostMenuListener);
    button.addEventListener("click", MainClass_Events.savePostMenuListener);
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
      "octuple",
      "noncuple",
    ][count];

    if (postClass) {
      post.classList.add(postClass);
    }
  }

  static updatePreview() {
    const modal = document.querySelector(".mv");
    const mvMain = modal && modal.querySelector("#js-mv-main");

    if (!modal || !mvMain) {
      return;
    }

    MainClass_Render.setPreviewMediaTypeClass(modal, mvMain);

    const isImg = modal.classList.contains("img");
    const isGif = modal.classList.contains("gif");
    const isVid = modal.classList.contains("vid");

    if (isImg) {
    }
    if (isGif) {
    }
    if (isVid) {
      const wrapper = modal.querySelector("#js-mv-main");
      const video = modal.querySelector("video");

      if (!wrapper || !video) {
        return;
      }

      if (video.clientHeight !== wrapper.clientHeight) {
        wrapper.style.height = video.clientHeight + "px";
      }

      if (MainClass_Base.settings.popupSkipVideo) {
        video.removeAttribute("loop");

        if (!video.onended) {
          video.onended = () => {
            const goNextBut = document.querySelector("#js-mv-r");
            goNextBut && goNextBut.click();
          };
        }
      }
    }
  }
  static setPreviewMediaTypeClass(modal, mvMain) {
    if (["img", "gif", "vid"].some((x) => modal.classList.contains(x))) {
      return;
    }

    let mediaInfo = mvMain.dataset.mediainfo || "";
    mediaInfo = mediaInfo.substring(
      0,
      mediaInfo.lastIndexOf(".") + mediaInfo.substring(mediaInfo.lastIndexOf(".")).indexOf(" ")
    );

    const img = document.querySelector(`[data-title="${mediaInfo}"`);

    if (!img) {
      return;
    }

    let mediaClass = "";

    if (img.dataset.type === "4") {
      mediaClass = "gif";
    } else {
      if (img.parentElement.classList.contains("webm")) {
        mediaClass = "vid";
      } else {
        mediaClass = "img";
      }
    }

    ["img", "gif", "vid"].forEach((x) => modal.classList.remove(x));

    modal.classList.add(mediaClass);
  }
}

class MainClass_Derender {
  static derender() {
    const modal = document.querySelector("body > .mv");

    if (modal) {
      modal.classList.remove("animated");

      animationValues.forEach((x) => {
        modal.classList.remove(x);
      });
    }

    consoleGroup("KD -", "DeRender");
    MainClass_Derender.deUpdateThreads();
    MainClass_Derender.deUpdatePosts();
    MainClass_Derender.deUpdatePreview();
    MainClass_Events.deSetupListeners();
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

    threads.forEach((thread) => MainClass_Derender.deUpdateThread(thread));

    consoleGroupEnd();
  }

  static deUpdateThread(thread) {
    const missedPostCount = thread.querySelector(".thread__missed");
    const postOppost = thread.querySelector(".post_type_oppost");
    const postOppostDetails = thread.querySelector(".post__details__oppost.post__details");
    const postTitle = thread.querySelector(".post__title");

    if (postOppost && missedPostCount) {
      postOppost.insertAdjacentElement("afterend", missedPostCount);
    }

    delete thread.dataset.threadUpdated;

    if (postTitle) {
      postTitle.remove();
    }

    thread.classList.remove("collapsed");
    const collapser = postOppostDetails.querySelector(".collapser");
    if (!!collapser) {
      collapser.removeEventListener("click", MainClass_Events.collapseThreadClick);
      collapser.remove();
    }

    postOppost.insertAdjacentElement("afterbegin", postOppostDetails);
  }

  static deUpdatePosts() {
    const posts = [...document.querySelectorAll(".post[data-post-updated]:not(.post_preview)")];

    consoleGroup("Posts");
    consoleLog("Posts deUpdated: ", posts.length);

    if (posts.length === 0) {
      consoleGroupEnd();
      return;
    }

    posts.forEach((post) => MainClass_Derender.deUpdatePost(post));

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

    MainClass_Derender.deUpdatePostImages(post);
    MainClass_Derender.deUpdatePostVideos(post);
    MainClass_Derender.deupdatePostMenu(post);

    if (MainClass_Base.isThreadPage) {
      MainClass_Derender.deUpdatePostDuplicates(post);
    }

    delete post.dataset.postUpdated;
  }

  static deUpdatePostDuplicates(post) {
    post.classList.remove("duplicate");

    if (post._dup_parent) {
      MainClass_Derender.deUpdateParentDuplicateCollapser(post._dup_parent);
    }
  }

  static deUpdateParentDuplicateCollapser(parentPost) {
    const duplicateCollapser = parentPost.querySelector(".duplicate-collapser");

    if (duplicateCollapser) {
      duplicateCollapser.remove();
    }
  }

  static deUpdatePostImages(post) {
    const postsImgs = [...post.querySelectorAll(".post__image-link img:not(.post__file-webm)")];

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
  }
  static deUpdatePostVideos(post) {
    const postsImgsVideos = [...post.querySelectorAll(".post__image-link img.post__file-webm")];

    postsImgsVideos.forEach((x) => {
      const aLink = x.parentElement;

      aLink.remove(aLink.querySelector("div"));

      aLink.classList.remove("webm");
    });
  }

  static deupdatePostMenu(post) {
    let button = post.querySelector('[*|href="#icon__addmenu"]');

    if (!button) {
      return;
    }

    button.removeEventListener("click", MainClass_Events.savePostMenuListener);

    const menu = document.querySelector("#ABU-select");

    if (!menu) {
      return;
    }

    let el = menu.querySelector("div.splitter");
    if (!!el) {
      el.remove();
    }

    el = menu.querySelector("a.save-link");
    if (!!el) {
      el.remove();
    }
  }

  static deUpdatePreview() {
    const modal = document.querySelector(".mv");

    const isImg = modal.classList.contains("img");
    const isGif = modal.classList.contains("gif");
    const isVid = modal.classList.contains("vid");

    if (isImg) {
    }
    if (isGif) {
    }
    if (isVid) {
      const wrapper = modal.querySelector("#js-mv-main");
      const video = modal.querySelector("video");

      if (!wrapper || !video) {
        return;
      }

      video.addAttribute("loop");
      video.onended = null;
    }

    ["img", "gif", "vid"].forEach((x) => modal.classList.remove(x));
  }
}

class MainClass_Events {
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

          const maxHeightChanged = newSettings.maxHeight !== currentSettings.maxHeight;
          const thumbImagesChanged = newSettings.thumbImages !== currentSettings.thumbImages;
          const bTitlesChanged = newSettings.bTitles !== currentSettings.bTitles;
          const bTitlesSizeChanged = newSettings.bTitlesSize !== currentSettings.bTitlesSize;
          const showPlashqueChanged = newSettings.showPlashque !== currentSettings.showPlashque;
          const titleToBottomChanged = newSettings.titleToBottom !== currentSettings.titleToBottom;
          const runGifChanged = newSettings.runGif !== currentSettings.runGif;
          const popupBlockClicksChanged = newSettings.popupBlockClicks !== currentSettings.popupBlockClicks;
          const popupBackgroundChanged = newSettings.popupBackground !== currentSettings.popupBackground;
          const popupBackgroundImgChanged = newSettings.popupBackground_img !== currentSettings.popupBackground_img;
          const popupBackgroundGifChanged = newSettings.popupBackground_gif !== currentSettings.popupBackground_gif;
          const popupBackgroundVidChanged = newSettings.popupBackground_vid !== currentSettings.popupBackground_vid;
          const popupBackgroundMediaChanged =
            popupBackgroundImgChanged || popupBackgroundGifChanged || popupBackgroundVidChanged;
          const popupBackgroundColorChanged = newSettings.popupBackgroundColor !== currentSettings.popupBackgroundColor;
          const popupBackgroundOpacityChanged =
            newSettings.popupBackgroundOpacity !== currentSettings.popupBackgroundOpacity;
          const colorPostChanged = newSettings.colorPost !== currentSettings.colorPost;
          const someColorChanged = Object.keys(newSettings.colors).some(
            (key) => newSettings.colors[key] !== currentSettings.colors[key]
          );
          const toggledChanged = newSettings.toggled !== currentSettings.toggled;
          const intervalTimeoutChanged = newSettings.intervalTimeout !== currentSettings.intervalTimeout;
          const collapseDuplicatesChanged = newSettings.collapseDuplicates !== currentSettings.collapseDuplicates;
          const popupAnimateChanged = newSettings.popupAnimate !== currentSettings.popupAnimate;
          const popupAnimationChanged = newSettings.popupAnimation !== currentSettings.popupAnimation;
          const popupAnimationTimeChanged = newSettings.popupAnimationTime !== currentSettings.popupAnimationTime;
          const popupChangeAnimationChanged = newSettings.popupChangeAnimation !== currentSettings.popupChangeAnimation;

          MainClass_Base.settings = newSettings;

          if (titleToBottomChanged || bTitlesChanged || bTitlesSizeChanged) {
            const threads = [...document.querySelectorAll(".thread")];

            threads.forEach((thread) => {
              MainClass_Render.updateThread(thread, !titleToBottomChanged);
            });
          }

          if (runGifChanged || thumbImagesChanged) {
            const posts = [...document.querySelectorAll(".post:not(.post_preview)")];

            posts.forEach((post) => {
              MainClass_Render.updatePost(post, runGifChanged);
            });
          }

          if (
            maxHeightChanged ||
            popupBackgroundChanged ||
            popupBackgroundMediaChanged ||
            popupBackgroundColorChanged ||
            popupBackgroundOpacityChanged ||
            colorPostChanged ||
            someColorChanged
          ) {
            MainClass_Base.setupStyleBySettings();
          }

          if (intervalTimeoutChanged && newSettings.toggled) {
            clearInterval(MainClass_Base.interval);
            MainClass_Base.interval = setInterval(MainClass_Render.render, MainClass_Base.settings.intervalTimeout);
          }

          if (showPlashqueChanged) {
            if (!newSettings.showPlashque) {
              document.body.classList.add("hide-plashque");
            } else {
              document.body.classList.remove("hide-plashque");
            }
          }

          if (MainClass_Base.isThreadPage && collapseDuplicatesChanged) {
            if (newSettings.collapseDuplicates) {
              [...document.querySelectorAll(".post")].forEach((x) => {
                MainClass_Render.updateDuplicatePost(x);
              });
            } else {
              [...document.querySelectorAll(".post.duplicate")].forEach((x) => {
                MainClass_Derender.deUpdatePostDuplicates(x);
              });
            }
          }

          const modal = document.querySelector("body > .mv");
          const mvMain = document.querySelector("body > .mv .mv__main");

          if (popupAnimateChanged && modal) {
            if (newSettings.popupAnimate) {
              modal.classList.add("animated");
            } else {
              modal.classList.remove("animated");
            }
          }

          if (popupAnimationChanged && newSettings.popupAnimate && modal) {
            animationValues.forEach((x) => {
              modal.classList.remove(x);
            });

            if (MainClass_Base.toggled) {
              modal.classList.add(newSettings.popupAnimation);
            }
          }

          if (popupAnimationTimeChanged && mvMain) {
            mvMain.classList.add("animation-paused");
            MainClass_Base.setupStyleBySettings();
            setTimeout(() => {
              mvMain.classList.remove("animation-paused");
            }, 50);
          }

          break;

        case "redirect":
          location = message.data;
          break;
        case "savedLinksUpdated":
          MainClass_Base.localSettings.links = message.data;
          break;

        default:
          break;
      }
    });

    // FIX for muon
    const switchStyleSelect = document.getElementById("SwitchStyles");
    if (switchStyleSelect) {
      switchStyleSelect.addEventListener("change", (e) => {
        if (switchStyleSelect.value === "muon") {
          document.body.parentElement.classList.add("muon");
        } else {
          document.body.parentElement.classList.remove("muon");
        }
      });
    }
  }

  static setupListeners() {
    document.body.addEventListener("keydown", MainClass_Events.keydownBodyListener);
    document.body.addEventListener("keyup", MainClass_Events.keyupBodyListener);
    document.body.addEventListener("click", MainClass_Events.clickBodyListener);
    document.body.addEventListener("mousedown", MainClass_Events.mouseDownBodyListener);
    document.body.addEventListener("mouseup", MainClass_Events.mouseUpBodyListener);
  }
  static deSetupListeners() {
    document.body.removeEventListener("keydown", MainClass_Events.keydownBodyListener);
    document.body.removeEventListener("keyup", MainClass_Events.keyupBodyListener);
    document.body.removeEventListener("click", MainClass_Events.clickBodyListener);
  }

  static keydownBodyListener(event) {
    MainClass_Shortcuts.shortcutsHandler(event, false);
  }
  static keyupBodyListener(event) {
    MainClass_Shortcuts.shortcutsHandler(event, true);
  }
  static clickBodyListener(event) {
    const modal = document.querySelector("body > .mv");

    if (MainClass_Base.settings.popupBlockClicks && modal && modal.contains(event.target) && event.target !== modal) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }
  static mouseDownBodyListener(event) {
    const modal = document.querySelector("body > .mv .mv__main");

    if (MainClass_Base.settings.popupAnimate && modal && modal.contains(event.target)) {
      modal.classList.add("animation-paused");
    }
  }

  static mouseUpBodyListener(event) {
    const modal = document.querySelector("body > .mv .mv__main");

    if (MainClass_Base.settings.popupAnimate && modal && modal.contains(event.target)) {
      modal.classList.remove("animation-paused");
    }
  }

  static async savePostMenuListener(e) {
    await new Promise((r) => {
      setTimeout(() => {
        r();
      }, 50);
    });

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
        MainClass_Events.savePostLink(e, postLink);
      });
    }

    menu.appendChild(a);

    const saveBottom =
      MainClass_Base.currentThreadId === +postLink.id ||
      e.target.parentElement.parentElement.classList.contains("post__details__oppost");

    if (saveBottom) {
      a = menu.querySelector("a.save-bottom");
      if (!a) {
        a = document.createElement("a");
        a.classList.add("save-bottom");
        a.href = "#";
        a.innerText = `Сохранить #bottom`;

        a.addEventListener("click", (e) => {
          MainClass_Events.savePostLink(e, postLink, true);
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
      MainClass_Base.currentThreadId === +postLink.id || saveBottom
        ? postLink.parentElement.parentElement.querySelector(".post__title").innerText.trim()
        : `Пост №${postLink.id} в ${MainClass_Base.threadName}`;
    defaultPostName = defaultPostName || document.head.querySelector("title").innerText.trim();

    const name = window.prompt("Название ссылки", defaultPostName);

    if (name === null) {
      return;
    }

    let link =
      MainClass_Base.currentThreadId === +postLink.id || saveBottom
        ? postLink.pathname
        : `${postLink.pathname}#${postLink.id}`;
    link = saveBottom ? link + `#bottom` : link;

    const newLink = {
      link,
      name,
    };

    MainClass_Base.localSettings.links.push(newLink);

    MainClass_Base.setLocalOptions({
      links: MainClass_Base.localSettings.links,
    });

    browser.runtime.sendMessage({ action: "savedLinksUpdated", data: MainClass_Base.settings.links });
  }

  static parentDuplicateCollapserClick(parentPost, e) {
    e.preventDefault();
    e.stopPropagation();

    const isCollapsed = e.currentTarget.classList.contains("collapsed");

    if (isCollapsed) {
      e.currentTarget.classList.remove("collapsed");
      (parentPost._duplicates || []).forEach((x) => {
        x.classList.remove("collapsed");
      });
    } else {
      e.currentTarget.classList.add("collapsed");
      (parentPost._duplicates || []).forEach((x) => {
        x.classList.add("collapsed");
      });
    }
  }
}

class MainClass_Shortcuts {
  static shortcutsHandler(event, keyUp = true) {
    if (keyUp) {
      MainClass_Shortcuts.shortcutsHandlerKeyUp(event);
    } else {
      MainClass_Shortcuts.shortcutsHandlerKeyDown(event);
    }
  }

  static shortcutsHandlerKeyDown(event) {
    const ctrl = event.ctrlKey;
    const shift = event.shiftKey;
    const alt = event.altKey;
    const key = event.key;

    const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

    const stopEvent = () => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.cancelBubble = true;
    };

    const checkMatch = (shortcut) => {
      return shortcut[0] === shift && shortcut[1] === ctrl && shortcut[2] === alt && shortcut[3] === key;
    };

    switch (true) {
      // stop event to control video
      case arrowKeys.reduce((acc, x) => acc && checkMatch([true, false, false, key]), true) &&
        !!document.querySelector("#js-mv-main video"): {
        stopEvent();
        MainClass_Shortcuts.videoShortcuts(event);
      }
    }
  }

  static shortcutsHandlerKeyUp(event) {
    const shift = event.shiftKey;
    const ctrl = event.ctrlKey;
    const alt = event.altKey;
    const key = event.code;

    const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

    const stopEvent = () => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.cancelBubble = true;
    };

    const checkMatch = (shortcut) => {
      return shortcut[0] === shift && shortcut[1] === ctrl && shortcut[2] === alt && shortcut[3] === key;
    };

    switch (true) {
      case checkMatch(MainClass_Base.settings.shortcuts.popupAnimating): {
        stopEvent();
        MainClass_Base.setOptions({ popupAnimate: !MainClass_Base.settings.popupAnimate });
        break;
      }
      case checkMatch(MainClass_Base.settings.shortcuts.popupBackground): {
        stopEvent();
        MainClass_Base.setOptions({ popupBackground: !MainClass_Base.settings.popupBackground });
        break;
      }
      case checkMatch(MainClass_Base.settings.shortcuts.popupChangeAnimation): {
        stopEvent();

        const currentPopupAnimationIndex = animationValues.indexOf(MainClass_Base.settings.popupAnimation);
        const nextAnimationIndex = (currentPopupAnimationIndex + animationValues.length + 1) % animationValues.length;

        MainClass_Base.setOptions({ popupAnimation: animationValues[nextAnimationIndex] });
        break;
      }
      case checkMatch(MainClass_Base.settings.shortcuts.nbleHighlight): {
        stopEvent();
        MainClass_Base.setOptions({ colorPost: !MainClass_Base.settings.colorPost });
        break;
      }
      // stop event to control video
      case arrowKeys.reduce((acc, x) => acc && checkMatch([true, false, false, key]), true) &&
        !!document.querySelector("#js-mv-main video"): {
        stopEvent();
        break;
      }
    }
  }

  static videoShortcuts(event) {
    const popupVideo = document.querySelector("#js-mv-main video");

    const volume = (forward) => {
      const increaseVolume = 0.1 * (forward ? 1 : -1);
      popupVideo.volume += increaseVolume;
    };

    const time = (more) => {
      const duration = popupVideo.duration;
      const skipTime = Math.min(duration / 10, 15) * (more ? 1 : -1);
      popupVideo.currentTime += skipTime;
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
