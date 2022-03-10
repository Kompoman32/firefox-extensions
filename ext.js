try {
  const createElement = (tag, id) => {
    const existedEl = document.querySelector(`#${id}`);

    if (!!existedEl) {
      return existedEl;
    }

    const el = document.createElement(tag);
    el.id = id;

    return el;
  };

  const controls = createElement("div", "ffk-controls");
  controls.classList.add("ffk-controls");

  const links = createElement("input", "ffk-links");
  links.value = localStorage.getItem("ffk-links-qs") || "";
  const linksL = createElement("label", "ffk-links-label");
  linksL.setAttribute("for", "ffk-links");
  linksL.innerText = "LINKS selector:";

  const prev = createElement("input", "ffk-prev");
  prev.value = localStorage.getItem("ffk-prev-qs") || "";
  const prevL = createElement("label", "ffk-prev-label");
  prevL.setAttribute("for", "ffk-prev");
  prevL.innerText = "PREV selector:";

  const next = createElement("input", "ffk-next");
  next.value = localStorage.getItem("ffk-next-qs") || "";
  const nextL = createElement("label", "ffk-next-label");
  nextL.setAttribute("for", "ffk-next");
  nextL.innerText = "NEXT selector:";

  const first = createElement("input", "ffk-first");
  first.value = localStorage.getItem("ffk-first-qs") || "";
  const firstL = createElement("label", "ffk-first-label");
  firstL.setAttribute("for", "ffk-first");
  firstL.innerText = "FIRST selector:";

  const last = createElement("input", "ffk-last");
  last.value = localStorage.getItem("ffk-last-qs") || "";
  const lastL = createElement("label", "ffk-last-label");
  lastL.setAttribute("for", "ffk-last");
  lastL.innerText = "LAST selector:";

  const openImageCheckbox = createElement("input", "ffk-fulscreen");
  openImageCheckbox.type = "checkbox";
  openImageCheckbox.checked = localStorage.getItem("ffk-fulscreen-qs") === "true" || false;
  const openImageCheckboxL = createElement("label", "ffk-fulscreen-label");
  openImageCheckboxL.classList.add("checkbox");
  openImageCheckboxL.setAttribute("for", "ffk-fulscreen");
  openImageCheckboxL.innerText = "Open fulscreen?:";

  if (openImageCheckbox.checked) {
    setTimeout(() => {
      const img = document.querySelector("#submissionImg");
      img && img.click();
    });
  }

  const inputChange = ({ target }) => {
    localStorage.setItem(target.id + "-qs", target.value);
  };

  links.addEventListener("change", inputChange);
  prev.addEventListener("change", inputChange);
  first.addEventListener("change", inputChange);
  next.addEventListener("change", inputChange);
  last.addEventListener("change", inputChange);
  openImageCheckbox.addEventListener("change", ({ target }) => {
    localStorage.setItem(target.id + "-qs", target.checked);

    if (target.checked) {
      const img = document.querySelector("#submissionImg");
      img && img.click();
    }
  });

  document.body.appendChild(controls);

  [linksL, links, prevL, prev, nextL, next, firstL, first, lastL, last, openImageCheckboxL, openImageCheckbox].forEach(
    (x) => !!x && controls.appendChild(x)
  );

  const go = (selector) => {
    const el = document.querySelector(selector);

    if (el.tagName === "A") {
      el.click();
    }
  };

  document.addEventListener("keyup", (e) => {
    switch (e.key) {
      case "ArrowLeft": {
        go(prev.value);
        break;
      }
      case "ArrowRight": {
        go(next.value);
        break;
      }
      case "ArrowUp": {
        go(last.value);
        break;
      }
      case "ArrowDown": {
        go(first.value);
        break;
      }
    }
  });

  const hideControls = createElement("div", "ffk-hide-controls");
  document.body.appendChild(hideControls);
} catch (e) {
  console.error(e);
}
