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

var globalLinks = [];

var autoSave = false;

function formSerializer(form) {
  if (!form || form.nodeName !== "FORM") {
    return;
  }
  var i,
    j,
    res = {},
    els = form.querySelectorAll("input,textarea,select,button");

  for (i = 0; i < els.length; i++) {
    const el = els[i];
    if (!el || el.name === "") {
      continue;
    }
    switch (el.nodeName) {
      case "INPUT":
        switch (el.type) {
          case "text":
          case "hidden":
          case "password":
          case "button":
          case "reset":
          case "submit":
          case "color":
            res[el.name] = el.value;
            break;
          case "range":
          case "number":
            res[el.name] = +el.value;
            break;
          case "checkbox":
            res[el.name] = el.checked;
            break;
          case "radio":
            const radioButtons = form.querySelectorAll(`input[type="radio"][name="${el.name}"]`);
            const rb = radioButtons.find((r) => r.checked);

            res[el.name] = rb && rb.value;
            break;
          case "file":
            break;
        }
        break;
      case "TEXTAREA":
        res[el.name] = el.value;
        break;
      case "SELECT":
        switch (el.type) {
          case "select-one":
            res[el.name] = el.value;
            break;
          case "select-multiple":
            const values = [];
            for (j = el.options.length - 1; j >= 0; j = j - 1) {
              if (el.options[j].selected) {
                values.push(el.options[j].value);
              }
            }
            res[el.name] = values;
            break;
        }
        break;
      case "BUTTON":
        switch (el.type) {
          case "reset":
          case "submit":
          case "button":
            res[el.name] = el.value;
            break;
        }
        break;
    }
  }
  return res;
}

function setSettings(settings) {
  function onError(error) {
    setLoader(true);
    console.log(`Error: ${error}`);
  }

  browser.storage.sync
    .set(settings)
    .then(() => {
      browser.runtime.sendMessage({ action: "settingsUpdated", data: form });
      setLoader(true);
    })
    .catch(onError);
}

function saveOptions(e = { target: document.querySelector("form") }) {
  e.preventDefault && e.preventDefault();

  const form = formSerializer(e.target);

  setSettings(form);
}

function restoreOptions() {
  function setupLinks(links) {
    let table = document.querySelector(`.links table`);
    
    links.forEach(x => {
      const tr =  document.createElement('tr');
      tr.classList.add('links');

      let td = document.createElement('td');
      const a = document.createElement('a');
      a.href=`https://2ch.hk${x.link}`;
      a.innerText = x.link;
      td.appendChild(a);
      tr.appendChild(td);

      td.childNodes[0].addEventListener('click',(e) => {
        e.preventDefault();

        browser.runtime.sendMessage({ action: "redirect", data: `https://2ch.hk${x.link}` });
      });
      
      td = document.createElement('td');
      td.innerText = x.name;
      tr.appendChild(td);

      td = document.createElement('td');
      td.innerText = 'X';
      td.title = 'Удалить';
      td.addEventListener('click', () => {
        globalLinks = globalLinks.filter(l => l !== x);
        browser.runtime.sendMessage({ action: "savedLinksUpdated", data: globalLinks });
        setSettings({
          links: globalLinks
        });
        tr.remove();
      })
      tr.appendChild(td);

      table.appendChild(tr);
    });
  }

  function setCurrentChoice(result) {
    setLoader(true);

    document.querySelector("#interval-timeout").value = result.intervalTimeout;

    document.querySelector("#max-height").value = result.maxHeight;
    document.querySelector("#thumb-images").checked = result.thumbImages;

    document.querySelector("#b-titles").checked = result.bTitles;
    document.querySelector("#b-titles-size").value = result.bTitlesSize;

    document.querySelector("#run-gif").checked = result.runGif;

    document.querySelector("#preview-background").checked = result.previewBackground;
    document.querySelector("#preview-background-color").value = result.previewBackgroundColor;
    document.querySelector("#preview-background-opacity").value = result.previewBackgroundOpacity;
    document.querySelector("#preview-background-opacity-value").value = result.previewBackgroundOpacity;

    globalLinks = result.links || [];
    setupLinks(globalLinks);

    autoSave = result.autoSave;
    document.querySelector("#auto-save").checked = autoSave;

    if (autoSave) {
      document.getElementById(`save-button`).parentElement.classList.add("disabled");
    } else {
      document.getElementById(`save-button`).parentElement.classList.remove("disabled");
    }

    setListeners(result);
  }

  function setListeners(settings) {
    function setDisabled(section) {
      const el = document.querySelector(`.${section}-toggler input`);

      const func = function (e) {
        const checked = this.checked;
        document.querySelectorAll(`.${section}`).forEach((e) => {
          if (checked) {
            e.classList.remove("disabled");
          } else {
            e.classList.add("disabled");
          }
        });
      };

      func.call(el);
      el.addEventListener("change", func.bind(el));
    }

    setDisabled("section-preview");
    setDisabled("section-b");

    let el;

    /*----------------------BACKGROUND-PREVIEW----------------------*/

    const previewBackgroundColorPicker = new ColorPicker({
      dom: document.getElementById("preview-background-color-picker"),
      value: document.getElementById("preview-background-color").value,
    });

    const setBackgroundPreview = () => {
      const color =
        document.getElementById("preview-background-color").value +
        Math.round(
          Math.min(Math.max(document.getElementById(`preview-background-opacity`).value, 0), 1) * 255
        ).toString(16);

      document.querySelector("td.background-preview .preview").style.backgroundColor = color;
    };

    setBackgroundPreview();

    previewBackgroundColorPicker.addEventListener("change", (e) => {
      document.getElementById("preview-background-color").value = previewBackgroundColorPicker.value;
      setBackgroundPreview();
    });

    el = document.querySelector(`.background-preview .collapser`);
    el &&
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        const collapsed = e.target.classList.contains("collapsed");

        setTimeout(() => {
          if (collapsed) {
            e.target.classList.remove("collapsed");
          } else {
            e.target.classList.add("collapsed");
          }
        });
      });

    el = document.querySelector(`.section-preview-toggler input`);
    el &&
      el.addEventListener("change", (e) => {
        if (!e.target.checked) {
          document.querySelector(`.background-preview .collapser`).classList.add("collapsed");
        }
      });
    el = document.getElementById(`preview-background-opacity`);
    el &&
      el.addEventListener("input", (e) => {
        let _el = document.getElementById(`preview-background-opacity-value`);
        _el && (_el.value = e.target.value);

        setBackgroundPreview();
      });

    el = document.getElementById(`preview-background-opacity-value`);
    el &&
      el.addEventListener("change", (e) => {
        if (!e.target.validity.valid) {
          return;
        }
        let _el = document.getElementById(`preview-background-opacity`);
        _el && (_el.value = e.target.value);

        setBackgroundPreview();
      });

    /*----------------------BACKGROUND-PREVIEW----------------------*/

    /*----------------------LINKS-----------------------------------*/

    el = document.querySelector(`.links .collapser`);
    el &&
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();

        const element = e.target.parentElement.parentElement;

        const collapsed = element.classList.contains("collapsed");

        setTimeout(() => {
          if (collapsed) {
            element.classList.remove("collapsed");
          } else {
            element.classList.add("collapsed");
          }
        });
      });

    /*----------------------LINKS-----------------------------------*/
    

    el = document.getElementById(`auto-save`);
    el &&
      el.addEventListener("change", (e) => {
        autoSave = e.target.checked;
        if (autoSave) {
          document.getElementById(`save-button`).parentElement.classList.add("disabled");
        } else {
          document.getElementById(`save-button`).parentElement.classList.remove("disabled");
        }
      });

    [...document.querySelectorAll("[name]")].forEach((control) => {
      const event = control.id === "preview-background-opacity" ? "change" : "change";
      control.addEventListener(event, () => {
        if (autoSave) {
          saveOptions();
        }
      });
    });
  }

  function onError(error) {
    setLoader(false);
    console.log(`Error: ${error}`);
  }

  const getting = browser.storage.sync.get(defaultOptionsValues);
  getting.then(setCurrentChoice, onError);
}

function setLoader(completed = false) {
  const loader = document.querySelector("#loader");
  if (loader) {
    loader.dataset.completed = completed;
  }
}

setLoader(false);


let DOMContentLoadedTimeout;
document.addEventListener("DOMContentLoaded", () => {
  clearTimeout(DOMContentLoadedTimeout)
  setTimeout(() => {
    restoreOptions();
  }, 100)
});
var form = document.querySelector("form");
form && form.addEventListener("submit", saveOptions);
