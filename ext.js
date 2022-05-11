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

  const comicRBut = createElement("input", "ffk-comic-rb");
  comicRBut.classList.add('pic-mode-visible');
  comicRBut.type = 'radio';
  comicRBut.name = 'mode';
  comicRBut.checked = localStorage.getItem("ffk-comic-rb") || false;
  const comicRButL = createElement("label", "ffk-comic-rb-label");
  comicRButL.classList.add('pic-mode-visible');
  comicRButL.setAttribute("for", "ffk-comic-rb");
  comicRButL.innerText = "Comics mode";
  
  const picRBut = createElement("input", "ffk-pic-rb");
  picRBut.classList.add('pic-mode-visible');
  picRBut.type = 'radio'
  picRBut.name = 'mode';
  picRBut.checked = localStorage.getItem("ffk-pic-rb");
  if (localStorage.getItem("ffk-pic-rb") === null) {
    picRBut.checked = true;
  }
  const picRButL = createElement("label", "ffk-pic-rb-label");
  picRButL.classList.add('pic-mode-visible');
  picRButL.setAttribute("for", "ffk-pic-rb");
  picRButL.innerText = "Pictures mode";

  localStorage.setItem("ffk-comic-rb", comicRBut.checked);
  localStorage.setItem("ffk-pic-rb", picRBut.checked);

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
  openImageCheckbox.classList.add('pic-mode-visible');
  openImageCheckbox.type = "checkbox";
  openImageCheckbox.checked = localStorage.getItem("ffk-fulscreen-qs") === "true" || false;
  const openImageCheckboxL = createElement("label", "ffk-fulscreen-label");
  openImageCheckboxL.classList.add('pic-mode-visible');
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

  const controls = createElement("div", "ffk-controls");

  if (picRBut.checked) {
    controls.classList.add('pic-mode');
  }

  const rbChange = ({ target }) => {
    switch (target.id) {
      case 'ffk-comic-rb': {
        controls.classList.remove('pic-mode');
        break;
      }
      case 'ffk-pic-rb': {
        controls.classList.add('pic-mode');
        break;
      }
    }

    localStorage.setItem("ffk-comic-rb", comicRBut.checked);
    localStorage.setItem("ffk-pic-rb", picRBut.checked);
  };

  comicRBut.addEventListener("change", rbChange);
  picRBut.addEventListener("change", rbChange);



  document.body.appendChild(controls);

  [comicRBut, comicRButL, picRBut, picRButL, linksL, links, prevL, prev, nextL, next, firstL, first, lastL, last, openImageCheckboxL, openImageCheckbox].forEach(
    (x) => !!x && controls.appendChild(x)
  );

  const go = (selector, picMode = false, next = true) => {
    if (picMode) {
      const id = parseInt(location.pathname.substring(6));

      let links = [...document.querySelectorAll('.preview-gallery a')];

      let goTo;

      if (next) {
        links = links.filter(x => parseInt(x.pathname.substring(6)) > id)
        goTo = links[links.length-1];
      } else {
        goTo = links.find(x => parseInt(x.pathname.substring(6)) < id);
      }

      if (!!goTo) {
        goTo.click();
      }

      return;
    }


    const el = document.querySelector(selector);

    if (el && el.tagName === "A") {
      el.click();
    }
  };

  document.addEventListener("keyup", (e) => {
    const isPicMode = picRBut.checked;

    switch (e.key) {
      case "ArrowLeft": {
        go(prev.value, isPicMode, false);
        break;
      }
      case "ArrowRight": {
        go(next.value, isPicMode, true);
        break;
      }
      case "ArrowUp": {
        if (!isPicMode) {
          go(last.value);
        }
        break;
      }
      case "ArrowDown": {
        if (!isPicMode) {
          go(first.value);
        }
        break;
      }
    }
  });

  const hideControls = createElement("div", "ffk-hide-controls");
  document.body.appendChild(hideControls);
} catch (e) {
  console.error(e);
}
