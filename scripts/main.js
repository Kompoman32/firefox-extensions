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

async function sleep(time = 100) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

function getAllKeyboardMisstypoSynonyms(text) {
  const normal = `ё1234567890-=йцукенгшщзхъ\\фывапролджэячсмитьбю.`;
  const translated = `\`1234567890-=qwertyuiop[]\\asdfghjkl;'zxcvbnm,./`;
  const normalUppercase = `Ё!"№;%:?*()_+ЙЦУКЕНГШЩЗХЪ/ФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,`.toLocaleLowerCase();
  const translatedUppercase = `~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:"ZXCVBNM<>?`.toLocaleLowerCase();

  const missLeftNormal = `ёё1234567890-ййцукенгшщзхъффывапролджяячсмитьбю`;
  const missLeftTranslated = `\`\`1234567890-qqwertyuiop[]aasdfghjkl;'zzxcvbnm,.`;
  const missLeftNormalUppercase = `ЁЁ!"№;%:?*()_ЙЙЦУКЕНГШЩЗХЪФФЫВАПРОЛДЖЯЯЧСМИТЬБЮ`.toLocaleLowerCase();
  const missLeftTranslatedUppercase = `~~!@#$%^&*()_QQWERTYUIOP{}AASDFGHJKL:ZZXCVBNM<>`.toLocaleLowerCase();

  const missRightNormal = `1234567890-==цукенгшщзхъ\\\\ывапролджээчсмитьбю..`;
  const missRightTranslated = `1234567890-==wertyuiop[]\\\\sdfghjkl;''xcvbnm,.//`;
  const missRightNormalUppercase = `!"№;%:?*()_++ЦУКЕНГШЩЗХЪ//ЫВАПРОЛДЖЭЭЧСМИТЬБЮ,,`.toLocaleLowerCase();
  const missRightTranslatedUppercase = `!@#$%^&*()_++WERTYUIOP{}||SDFGHJKL:""XCVBNM<>??`.toLocaleLowerCase();

  const results = [];

  text.split("").forEach((char, i) => {
    let arrsToCheck = [
      normal,
      translated,
      normalUppercase,
      translatedUppercase,
      missLeftNormal,
      missLeftTranslated,
      missLeftNormalUppercase,
      missLeftTranslatedUppercase,
      missRightNormal,
      missRightTranslated,
      missRightNormalUppercase,
      missRightTranslatedUppercase,
    ];
    let index = -1;

    const foundedArrIndex = arrsToCheck.findIndex((arr) => arr.includes(char));

    if (foundedArrIndex > -1) {
      index = arrsToCheck[foundedArrIndex].indexOf(char);
      arrsToCheck.splice(foundedArrIndex, 1);
    }

    if (index < 0) {
      return;
    }

    results.push(
      ...arrsToCheck
        .map((arr) => {
          const newText = text.split("");

          newText.splice(i, 1, arr[index]);
          return newText.join("");
        })
        .filter((x, i, arr) => arr.indexOf(x) === i)
    );
  });

  return results.filter((x, i, arr) => arr.indexOf(x) === i);
}

var bumpsSynonyms = [];
var rollsSynonyms = [];

function isPostTextBump(text) {
  text = text.toLocaleLowerCase().trim();

  return bumpsSynonyms.includes(text);
}

function isPostTextRoll(text) {
  text = text.toLocaleLowerCase().trim();

  return rollsSynonyms.includes(text);
}

function isDuplicatePostText(source, target) {
  source = source.toLocaleLowerCase().trim();
  target = target.toLocaleLowerCase().trim();

  const isSourceBump = isPostTextBump(source);
  const isTargetBump = isPostTextBump(target);
  const isSourceRoll = isPostTextRoll(source);
  const isTargetRoll = isPostTextRoll(target);

  return (isSourceBump && isTargetBump) || (isSourceRoll && isTargetRoll) || source === target;
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

    const bumps = ["bump", "bamp", "бамп", "бумп", "бам", "bam"];

    bumpsSynonyms = bumps.reduce((acc, x) => {
      acc.push(...getAllKeyboardMisstypoSynonyms(x));
      return acc;
    }, []);

    const rolls = ["roll", "ролл", "rull", "рулл", "rol", "рол"];

    rollsSynonyms = rolls.reduce((acc, x) => {
      acc.push(...getAllKeyboardMisstypoSynonyms(x));
      return acc;
    }, []);
  }

  static saveAllSettings() {
    MainClass_Base.setOptions(MainClass_Base.settings);
  }

  static saveAllLocalSettings() {
    MainClass_Base.setLocalOptions(MainClass_Base.localSettings);
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

    window.onbeforeunload = MainClass_Events.beforeUnload;

    MainClass_Events.resetThreadPosition();

    setTimeout(() => {
      if (!!location.hash) {
        location = location;
        MainClass_Events.fixScrollToPost(location.hash.substring(1));
      }
    }, 100);
  }

  static stop() {
    clearInterval(MainClass_Base.interval);
    MainClass_Derender.derender();

    MainClass_Base.toggled = false;
    MainClass_Base.settings.toggled = false;

    MainClass_Base.setOptions({ toggled: false });

    window.onbeforeunload = null;
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
    MainClass_Render.updateModals();
    document.documentElement.classList.add("kd-toggle");
    if (MainClass_Base.isBeta) {
      document.documentElement.classList.add("beta");
    }

    if (!MainClass_Base.settings.showPlashque) {
      document.documentElement.classList.add("hide-plashque");
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

      MainClass_Render.addPostNbleClass(thread);

      if (MainClass_Base.isBThread && !isBThreadTitlesEnabled) {
        thread.dataset.threadUpdated = true;
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
    MainClass_Render.addPostHider(post);

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

          if (!gif.dataset.thumbSrc) {
            gif.dataset.thumbSrc = x.src;
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

      if (!x.dataset.thumbSrc) {
        x.dataset.thumbSrc = x.src;
      }
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

    const isDuplicate = isDuplicatePostText(currentText, previousText);

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

    while (nextSibling?.classList.contains("duplicate")) {
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
      post = post.parentElement.parentElement;
    }

    let button = post.querySelector('[*|href="#icon__addmenu"]');
    button = button && button.parentElement;

    if (!button) {
      return;
    }

    button.removeEventListener("click", MainClass_Events.postMenuClickListener);
    button.addEventListener("click", MainClass_Events.postMenuClickListener);
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

      if (MainClass_Base.settings.popupSkipVideo && !video.dataset.rendered) {
        video.removeAttribute("loop");

        // to prevent user select to loop this video
        video.dataset.rendered = true;

        if (!video.onended) {
          video.onended = async () => {
            await sleep(500);

            const sourceFileLink = document.querySelector(
              `[href="${video.querySelector("source")?.getAttribute("src")}"`
            );
            let post = sourceFileLink?.parentElement.parentElement.parentElement.parentElement;

            if (!sourceFileLink || !post || !post.classList.contains("post")) {
              return;
            }

            const num = post.dataset.num;
            const threadNum = post.parentElement.id.substring(7);

            const postImageElement = sourceFileLink.parentElement.parentElement;
            const postImageIndex = [...postImageElement.parentElement.children].indexOf(postImageElement);

            const selector =
              `.post[data-num="${num}"] .post__image:nth-child(${
                postImageIndex + 1
              }) ~ .post__image .post__file-webm,` +
              `.post[data-num="${num}"] ~ .post .post__file-webm,` +
              `#thread-${threadNum} ~ .thread .post__file-webm`;

            const nextFile = document.querySelector(selector);

            if (nextFile) {
              nextFile.click();
              nextFile.scrollIntoView({ behavior: "smooth", block: "center" });

              MainClass_Events.fixScrollToPost(
                nextFile.parentElement.parentElement.parentElement.parentElement.dataset.num
              );
            } else {
              const goNextBut = document.querySelector("#js-mv-r");
              goNextBut && goNextBut.click();
            }
          };
        }
      }
    }
  }
  static setPreviewMediaTypeClass(modal, mvMain) {
    const video = mvMain.querySelector("video");
    const img = mvMain.querySelector("img");

    const isVid = !!video;
    const isImgOrGif = !!img;

    // let mediaInfo = mvMain.dataset.mediainfo || "";
    // mediaInfo = mediaInfo.substring(
    //   0,
    //   mediaInfo.lastIndexOf(".") + mediaInfo.substring(mediaInfo.lastIndexOf(".")).indexOf(" ")
    // );

    // const img = document.querySelector(`[data-title="${mediaInfo}"`);

    let sourceFile;

    if (isImgOrGif) {
      sourceFile = document
        .querySelector(`[href="${img.getAttribute("src")}"`)
        ?.parentElement.parentElement.querySelector("img");
    }

    let mediaClass = "img";

    switch (true) {
      case isVid: {
        mediaClass = "vid";
        break;
      }

      case sourceFile?.dataset.type === "4": {
        mediaClass = "gif";
        break;
      }
    }

    if (modal.classList.contains(mediaClass)) {
      return;
    }

    ["img", "gif", "vid"].forEach((x) => modal.classList.remove(x));

    modal.classList.add(mediaClass);
  }

  static updateModals() {
    let modals = document.querySelector(" body > .kd-modals");

    if (modals) {
      return;
    }

    modals = document.createElement("div");
    modals.classList.add("kd-modals");

    document.body.appendChild(modals);
  }

  static addPostHider(post) {
    if (!post) {
      return;
    }

    const hider = post.querySelector(".post_hide-btn") || document.createElement("div");
    hider.classList.add("post_hide-btn");
    hider.innerText = "👁";

    hider.removeEventListener("click", MainClass_Events.hidePost);
    hider.addEventListener("click", MainClass_Events.hidePost);

    post.insertAdjacentElement("afterbegin", hider);
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
    document.documentElement.classList.remove("kd-toggle");
    document.documentElement.classList.remove("hide-plashque");
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
    MainClass_Derender.deupdatePostMenu(post);
    MainClass_Derender.removePostHider(post);

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

    button.removeEventListener("click", MainClass_Events.postMenuClickListener);

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

      video.setAttribute("loop", 1);
      video.onended = null;
      delete video.dataset.rendered;
    }

    ["img", "gif", "vid"].forEach((x) => modal.classList.remove(x));
  }

  static removePostHider(post) {
    const hider = post?.querySelector(".post_hide-btn");
    if (!post || !hider) {
      return;
    }

    hider.removeEventListener("click", MainClass_Events.hidePost);
    hider.remove();
  }
}

class MainClass_Events {
  static beforeUnload(event) {
    // event.preventDefault();

    if (MainClass_Base.isThreadPage && MainClass_Base.settings.saveThreadPosition) {
      const post = [...document.querySelectorAll(".post")].find((x) => x.getBoundingClientRect().y > 0);
      const num = +post?.dataset.num;

      if (post) {
        const arr = MainClass_Base.isBThread
          ? MainClass_Base.localSettings.savedPositions.b
          : MainClass_Base.localSettings.savedPositions.all;

        const obj = { post: num, date: +new Date() };

        arr[MainClass_Base.currentThreadId] = obj;

        MainClass_Base.saveAllLocalSettings();
      }
    }
  }

  static resetThreadPosition() {
    if (!MainClass_Base.isThreadPage) {
      return;
    }

    const arr = MainClass_Base.isBThread
      ? MainClass_Base.localSettings?.savedPositions?.b
      : MainClass_Base.localSettings?.savedPositions?.all;

    const obj = arr?.[MainClass_Base.currentThreadId];

    if (!obj) {
      return;
    }

    location.hash = obj.post;
  }

  static checkExpiresLocalOptions() {
    const bTimeExpires = 3 * 24 * 60 * 60 * 1000;
    const allTimeExpires = 7 * 24 * 60 * 60 * 1000;

    const currentDate = +new Date();

    let changed = false;

    const checkExpires = (arr, timeExpires) => {
      const isArray = Array.isArray(arr);

      Object.keys(arr).forEach((key, i) => {
        const obj = arr[key];
        const date = obj?.date;

        if (date && currentDate > date + timeExpires) {
          if (isArray) {
            arr[key] = undefined;
          } else {
            delete arr[key];
          }

          changed = true;
        }
      });

      if (isArray) {
        return arr.filter((x) => !!x);
      }

      return arr;
    };

    MainClass_Base.localSettings.collapsedThreads.b = checkExpires(
      MainClass_Base.localSettings.collapsedThreads.b,
      bTimeExpires
    );
    MainClass_Base.localSettings.collapsedThreads.all = checkExpires(
      MainClass_Base.localSettings.collapsedThreads.all,
      allTimeExpires
    );
    MainClass_Base.localSettings.savedPositions.b = checkExpires(
      MainClass_Base.localSettings.savedPositions.b,
      bTimeExpires
    );
    // MainClass_Base.localSettings.savedPositions.all = checkExpires(MainClass_Base.localSettings.savedPositions.all, allTimeExpires);

    if (changed) {
      MainClass_Base.saveAllLocalSettings();
    }
  }

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
          MainClass_Base.saveAllLocalSettings();
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

            MainClass_Base.saveAllLocalSettings();
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
          const saveThreadPositionChanged = newSettings.saveThreadPosition !== currentSettings.saveThreadPosition;
          const downloadWarningChanged =
            newSettings.downloadWarning !== currentSettings.downloadWarning ||
            newSettings.downloadWarningSize !== currentSettings.downloadWarningSize ||
            newSettings.downloadWarningScale !== currentSettings.downloadWarningScale;
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
          const popupSkipVideoChanged = newSettings.popupSkipVideo !== currentSettings.popupSkipVideo;

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

          if (popupSkipVideoChanged) {
            MainClass_Derender.deUpdatePreview();
            MainClass_Render.updatePreview();
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
          document.documentElement.classList.add("muon");
        } else {
          document.documentElement.classList.remove("muon");
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
    const target = event.target;

    if (MainClass_Base.settings.popupBlockClicks && modal && modal.contains(event.target) && event.target !== modal) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    if (target?.tagName === "A" && target.dataset.num) {
      MainClass_Events.fixScrollToPost(target.dataset.num);
    }

    if (
      target?.tagName === "A" &&
      target.classList.contains("post__reflink") &&
      !target.classList.contains("js-post-reply-btn")
    ) {
      const post = target.parentElement.parentElement.parentElement;

      document.querySelectorAll(".post.post_type_highlight").forEach((x) => x.classList.remove("post_type_highlight"));
      setTimeout(() => {
        post?.classList.add("post_type_highlight");

        MainClass_Events.fixScrollToPost(target.dataset.num);
      });
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
    const target = event.target;

    if (MainClass_Base.settings.popupAnimate && modal && modal.contains(event.target)) {
      modal.classList.remove("animation-paused");
    }
  }

  static async postMenuClickListener(e) {
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

    addMenuItem("save-link", "Сохранить ссылку", (e) => {
      e.preventDefault();
      MainClass_Events.savePostLink(e, postLink);
    });

    if (!isThreadPost) {
      return;
    }

    addMenuItem("save-bottom", "Сохранить #bottom", (e) => {
      e.preventDefault();
      e.stopPropagation();
      MainClass_Events.savePostLink(e, postLink, true);
    });

    addMenuItem("save-arhivach", "Сохранить на arhivach.top", (e) => {
      e.preventDefault();
      e.stopPropagation();
      MainClass_Events.saveArhivach(e, postLink);
    });
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

    browser.runtime.sendMessage({ action: "savedLinksUpdated", data: MainClass_Base.localSettings.links });
  }

  static saveArhivach(e, postLink) {
    postLink = postLink.pathname;
    postLink = (postLink.match(/^\/\w+\/\w+\/\d+/g) || [])[0];

    if (!postLink) {
      return;
    }

    const a = document.createElement("a");
    a.href = `https://arhivach.top/add/#${postLink}`;
    a.target = "_blank";
    a.click();
  }

  static updateImages(e, postId, isThreadPost) {
    let post = document.querySelector(`#${isThreadPost ? "thread" : "post"}-${postId}`);

    const postsImgs = [...post.querySelectorAll(".post__image-link img:not(.post__file-webm)")];

    postsImgs.forEach((x) => {
      x.src = x.src;
    });
  }

  static downloadImages(e, postId, isThreadPost, postsImgs, isZip) {
    const zipFilename = `${isThreadPost ? "thread" : "post"}-${postId}.zip`;

    MainClass_Modals.showModal(
      new Modal_ImageDownloader({
        images: postsImgs,
        zip: isZip,
        zipFilename: zipFilename,
      })
    );
  }

  static viewAllImages(e, postsImgs) {
    MainClass_Modals.showModal(
      new Modal_ImageViewer({
        images: postsImgs,
      })
    );
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

  static fixScrollToPost(postNum) {
    let timer;

    const scrollSome = () => {
      window.removeEventListener("scroll", scrolEv);

      const post = document.querySelector(`.post[data-num="${postNum}"]`);
      if (post && post.getBoundingClientRect().top < 35) {
        window.scrollBy(0, -(35 - post.getBoundingClientRect().top));
      }
    };

    const scrolEv = () => {
      clearTimeout(timer);
      timer = setTimeout(scrollSome, 30);
    };

    window.addEventListener("scroll", scrolEv);
  }

  static hidePost(event) {
    const post = event.target.parentElement;

    if (post.classList.contains("post_type_hidden") || post.classList.contains("post_preview")) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    const menuButton = post.querySelector(".post__btn_type_menu");
    if (menuButton) {
      MainClass_Events.dispatchClick(menuButton);

      setTimeout(() => {
        const menu = document.querySelector("#ABU-select") || { childNodes: [] };
        const hideMenuItem = [...menu.childNodes].find((x) => x.innerText === "Скрыть");

        if (hideMenuItem) {
          MainClass_Events.dispatchClick(hideMenuItem);
        }
      });
    }
  }

  static dispatchClick(target) {
    target.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
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
      shortcut = shortcut || [];
      return shortcut[0] === shift && shortcut[1] === ctrl && shortcut[2] === alt && shortcut[3] === key;
    };

    switch (true) {
      case checkMatch(MainClass_Base.settings.shortcuts?.popupAnimating): {
        stopEvent();
        MainClass_Base.setOptions({ popupAnimate: !MainClass_Base.settings.popupAnimate });
        break;
      }
      case checkMatch(MainClass_Base.settings.shortcuts?.popupBackground): {
        stopEvent();
        MainClass_Base.setOptions({ popupBackground: !MainClass_Base.settings.popupBackground });
        break;
      }
      case checkMatch(MainClass_Base.settings.shortcuts?.popupChangeAnimation): {
        stopEvent();

        const currentPopupAnimationIndex = animationValues.indexOf(MainClass_Base.settings.popupAnimation);
        const nextAnimationIndex = (currentPopupAnimationIndex + animationValues.length + 1) % animationValues.length;

        MainClass_Base.setOptions({ popupAnimation: animationValues[nextAnimationIndex] });
        break;
      }
      case checkMatch(MainClass_Base.settings.shortcuts?.nbleHighlight): {
        stopEvent();
        MainClass_Base.setOptions({ colorPost: !MainClass_Base.settings.colorPost });
        break;
      }
      case checkMatch(MainClass_Base.settings.shortcuts?.popupSkipVideo): {
        stopEvent();
        MainClass_Base.setOptions({ popupSkipVideo: !MainClass_Base.settings.popupSkipVideo });
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

class MainClass_Modals {
  static showModal(modal) {
    if (!modal instanceof ModalClass) {
      return;
    }

    const modalsWrapper = document.querySelector(" body > .kd-modals");

    if (!modalsWrapper) {
      return;
    }

    const modalEl = document.createElement("div");
    modal.modalRef = modalEl;
    modalEl.classList.add("kd-modal");

    const html = modal.getHtml();
    html.classList.add("kd-modal-content");
    modalEl.appendChild(html);

    modalEl.classList.add(...modal.getModalClasses());

    modalsWrapper.appendChild(modalEl);

    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) {
        typeof modal.close === "function" && modal.close();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        // e.preventDefault();
        // e.stopImmediatePropagation();

        typeof modal.close === "function" && modal.close();
      }
    });

    typeof modal.onShow === "function" && modal.onShow();
  }
}
