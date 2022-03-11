try {
  // NO ARCHIVACH
  if (new RegExp("/.+/arch/*/").test(location.pathname)) {
    throw "No Archivach please";
  }

  let toggled;
  let interval;
  let intervalTimeout = 5000;

  consoleLog = (...args) => {
    if (localStorage.getItem("kd-debug")) {
      console.log(...args);
    }
  };

  render = () => {
    const threads = [...document.querySelectorAll(".thread:not([data-missed-moved])")];

    consoleLog(`Komponan32's design: `, "threads to update missed posts count place", threads.length);

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

    const posts = [...document.querySelectorAll(".post:not([data-original-href]):not(.post_preview)")];

    consoleLog(`Komponan32's design: `, "posts to update image source", posts.length);

    if (posts.length === 0) {
      return;
    }

    posts.forEach((post, _, arr) => {
      const post_oppost_detail = post.querySelector(".post_type_oppost .post__details");

      if (!!post_oppost_detail) {
        post_oppost_detail.classList.add("post__details__oppost");

        post_oppost_detail.parentElement.parentElement.parentElement.insertAdjacentElement(
          "afterbegin",
          post_oppost_detail
        );

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
        // setTimeout(() => {
        x.removeAttribute("height");
        x.removeAttribute("width");
        // });
        if (!x || x.src === x.dataset.src) {
          return;
        }
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

    consoleLog("posts updated");
  };

  toggled =
    localStorage.getItem("toggled") === "true" ? true : localStorage.getItem("toggled") === "false" ? false : null;

  setToggled = (toggledValue) => {
    toggled = toggledValue;
    localStorage.setItem("toggled", toggled);

    if (toggled) {
      document.body.classList.add("kd-toggle");

      clearInterval(interval);
      interval = setInterval(render, intervalTimeout);
    } else {
      document.body.classList.remove("kd-toggle");
      clearInterval(interval);
    }
  };

  if (toggled === null) {
    setToggled(true);
  } else {
    setToggled(!!toggled);
  }

  setTimeout(() => {
    if (toggled) {
      render();
    } else {
      setToggled(false);
    }
  }, 100);

  const extensionSettings = document.createElement("span");
  extensionSettings.id = "kd-settings";
  extensionSettings.innerHTML = `
    <span id="kd-toggler">
        <span class="nm__switcher">
            <span class="nm__bullet"></span>
        </span>
        <label>Включить Kompoman32's design</label>
    </span>
    `;

  const toggler = extensionSettings.querySelector("#kd-toggler");

  if (toggled) {
    toggler.classList.add("toggled");
  }

  toggler.addEventListener("click", () => {
    toggled = !toggled;

    if (toggled) {
      toggler.classList.add("toggled");

      setTimeout(() => {
        render();
      }, 100);
    } else {
      toggler.classList.remove("toggled");
    }

    setToggled(toggled);
  });

  document.querySelector(".header__adminbar .adminbar__boards").appendChild(extensionSettings);
} catch (e) {
  console.error(e);
}
