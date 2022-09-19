var globalLinks = [];

var autoSave = true;

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

    if (el.name.startsWith("color.")) {
      const field = el.name.substring(6);
      res.colors = res.colors || {};
      res.colors[field] = el.value;
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
    .then((updatedSettungs) => {
      browser.runtime.sendMessage({ action: "settingsUpdated", data: settings });
      setLoader(true);
    })
    .catch(onError);
}

function setLocalSettings(settings) {
  function onError(error) {
    setLoader(true);
    console.log(`Error: ${error}`);
  }

  browser.storage.local
    .set(settings)
    .then(() => {
      browser.runtime.sendMessage({ action: "localSettingsUpdated", data: settings });
      setLoader(true);
    })
    .catch(onError);
}

function saveOptions(e = { target: document.querySelector("form") }) {
  e.preventDefault && e.preventDefault();

  let form = formSerializer(e.target);
  // form.lang = I18N.lang;

  // form.shortcuts = {};

  // // shortcuts
  // document.querySelectorAll(".shortcut[name]").forEach((x) => {
  //   const additional = [...x.querySelectorAll(".additionals input")].map((x) => x.checked);
  //   const button = x.querySelector(".button input").value;

  //   form.shortcuts[x.getAttribute("name")] = [...additional, button];
  // });

  setSettings(form);
}

function restoreOptions() {
  function setupLinks(links) {
    let table = document.querySelector(`.links.tab table`);
    const existedLinks = table.querySelectorAll("tr");
    existedLinks.forEach((x) => x.remove());

    const saveLinks = () => {
      browser.runtime.sendMessage({ action: "savedLinksUpdated", data: globalLinks });
      setLocalSettings({
        links: globalLinks,
      });
    };

    links.forEach((x) => {
      const tr = document.createElement("tr");
      tr.classList.add("links");

      /** LINK **/
      {
        const td_ = document.createElement("td");
        const td = document.createElement("div");
        td.classList.add("link-div");
        td_.appendChild(td);
        const link = document.createElement("a");
        link.href = `https://wiki.ss220.space${x.link}`;
        link.innerText = x.link;
        link.addEventListener("click", (e) => {
          e.preventDefault();

          browser.runtime.sendMessage({ action: "redirect", data: link.href });
        });

        td.appendChild(link);

        const editLink = document.createElement("div");
        editLink.classList.add("pen");
        editLink.title = "Редактировать";
        editLink.addEventListener("click", (e) => {
          const newLink = window.prompt("Новая ссылка - https://wiki.ss220.space<#ССЫЛКА#>", x.link);

          if (newLink === null) {
            return;
          }

          x.link = newLink;
          link.href = `https://wiki.ss220.space${newLink}`;
          link.innerText = newLink;

          saveLinks();
        });
        td.appendChild(editLink);

        tr.appendChild(td_);
      }
      /** LINK **/

      /** NAME **/
      {
        const td_ = document.createElement("td");
        const td = document.createElement("div");
        td.classList.add("name-div");
        td_.appendChild(td);

        const name = document.createElement("span");
        name.innerText = x.name;

        td.appendChild(name);

        const editName = document.createElement("div");
        editName.classList.add("pen");
        editName.title = "Редактировать";
        editName.addEventListener("click", (e) => {
          const newName = window.prompt("Новое имя", x.name);

          if (newName === null) {
            return;
          }

          x.name = newName;
          name.innerText = newName;

          saveLinks();
        });
        td.appendChild(editName);

        tr.appendChild(td_);
      }
      /** NAME **/

      /** DELETE **/
      {
        const td = document.createElement("td");
        td.innerText = "X";
        td.title = "Удалить";
        td.addEventListener("click", () => {
          globalLinks = globalLinks.filter((l) => l !== x);

          saveLinks();

          tr.remove();
        });
        tr.appendChild(td);
      }

      /** DELETE **/

      table.appendChild(tr);
    });
  }

  function setupLabelsByLanguage(lang) {
    return;
    // document.querySelectorAll(".langs div.lang").forEach((x) => x.classList.remove("selected"));
    // const langEl = document.querySelector(`.langs div.lang.${lang}`);

    // if (langEl) {
    //   langEl.classList.add("selected");
    // }

    // I18N.setLanguage(lang);

    // document.querySelectorAll("[data-i18n]").forEach((element) => {
    //   const line = I18N.getLine(element.dataset.i18n);

    //   if (line === null) {
    //     return;
    //   }

    //   element.innerHTML = line;
    // });
  }

  function setCurrentChoice(result) {
    setLoader(true);

    // result.shortcuts.popupBackground = [false, false, true, "KeyB"];

    [...Object.keys(result)].forEach((key) => {
      const control = document.querySelector(`[name="${key}"`);

      if (!control) {
        return;
      }

      switch (control.tagName) {
        case "INPUT": {
          switch (control.type) {
            case "color":
            case "range":
            case "number":
              control.value = result[key];
              break;
            case "checkbox":
              control.checked = result[key];
              break;
          }
          break;
        }
        case "SELECT": {
          control.value = result[key];
          break;
        }
      }
    });

    // [...Object.keys(result.colors)].forEach((key) => {
    //   const control = document.querySelector(`[name="color.${key}"`);

    //   if (!control) {
    //     return;
    //   }

    //   control.value = result.colors[key];
    // });

    // document.querySelectorAll(`.shortcut[name]`).forEach((shortcutEl) => {
    //   const name = shortcutEl.getAttribute("name");

    //   const shortcutValues = result.shortcuts[name] || defaultOptionsValues.shortcuts[name];

    //   result.shortcuts[name] = shortcutValues;

    //   if (!shortcutValues) {
    //     return;
    //   }

    //   const shift = shortcutValues[0];
    //   const ctrl = shortcutValues[1];
    //   const alt = shortcutValues[2];
    //   const keyCode = shortcutValues[3];

    //   const shiftInput = shortcutEl.querySelector(".shift");
    //   shiftInput.checked = shift;
    //   const ctrlInput = shortcutEl.querySelector(".ctrl");
    //   ctrlInput.checked = ctrl;
    //   const altInput = shortcutEl.querySelector(".alt");
    //   altInput.checked = alt;

    //   const keyInput = shortcutEl.querySelector(".button input");
    //   keyInput.value = keyCode;
    //   keyInput._val = keyCode;
    // });

    globalLinks = result.links || [];
    setupLinks(globalLinks);

    setupLabelsByLanguage(result.lang);

    setListeners(result);
  }

  function setListeners(settings) {
    function setSectionToggler(section) {
      const el = document.querySelector(`.section-${section}-toggler input`);

      if (!el) {
        return;
      }

      const func = function () {
        const checked = this.checked;
        document.querySelectorAll(`.section-${section}`).forEach((e) => {
          if (checked) {
            e.classList.remove("disabled");
          } else {
            e.classList.add("disabled");
          }
        });

        const collapsers = document.querySelectorAll(`.section-${this.dataset.collapseSection} .collapser`);
        if (collapsers.length) {
          collapsers.forEach((x) => {
            x.classList.add("collapsed");
            x.parentElement.parentElement.classList.add("collapsed");
          });
        }
      };

      func.call(el);
      el.addEventListener("change", func.bind(el));
    }

    function setPicker(name, callback) {
      const domEl = document.getElementById(`${name}-picker`);
      const valEl = document.getElementById(`${name}`);

      if (!domEl || !valEl) {
        return;
      }

      const picker = new ColorPicker({
        dom: domEl,
        value: valEl.value,
      });

      valEl._picker = picker;

      picker.addEventListener("change", (e) => {
        valEl.value = picker.value;

        typeof callback === "function" && callback();
      });
    }

    setSectionToggler("background");

    let el;

    //#region COLLAPSERS
    /*----------------------COLLAPSERS----------------------*/

    el = document.querySelectorAll(`.collapser`);
    el &&
      el.forEach((x) => {
        x.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          const collapsed = e.target.classList.contains("collapsed");

          setTimeout(() => {
            if (collapsed) {
              e.target.classList.remove("collapsed");
              e.target.parentElement.parentElement.classList.remove("collapsed");
            } else {
              e.target.classList.add("collapsed");
              e.target.parentElement.parentElement.classList.add("collapsed");
            }
          });
        });
      });

    /*----------------------COLLAPSERS----------------------*/
    //#endregion COLLAPSERS

    //#region BACKGROUND-PREVIEW
    /*----------------------BACKGROUND-PREVIEW----------------------*/

    ["background-color", "color", "links-color"].forEach((name) => setPicker(name));

    /*----------------------BACKGROUND-PREVIEW----------------------*/
    //#endregion BACKGROUND-PREVIEW

    //#region POST-COLORS
    /*----------------------POST-COLORS----------------------*/

    /*----------------------POST-COLORS----------------------*/
    //#endregion POST-COLORS

    //#region LINKS
    /*----------------------LINKS-----------------------------------*/

    el = document.querySelector(".add-link");
    el &&
      el.addEventListener("click", () => {
        browser.runtime.sendMessage({ action: "saveCurrentLink", data: undefined });
      });

    /*----------------------LINKS-----------------------------------*/
    //#endregion LINKS

    //#region TABS

    /*----------------------TABS-----------------------------------*/

    el = document.querySelectorAll(`.tabs div.tab`);
    el &&
      el.forEach((x) =>
        x.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (e.target.classList.contains("selected")) {
            return;
          }

          document.querySelectorAll(`.tabs div.tab`).forEach((x) => x.classList.remove("selected"));
          const tab = [...e.target.classList].find((x) => x !== "tab");
          e.target.classList.add("selected");

          setTimeout(() => {
            document.querySelectorAll(`table.tab`).forEach((x) => x.classList.remove("selected"));
            document.querySelector(`table.tab.${tab}`).classList.add("selected");
          });
        })
      );

    el = document.querySelectorAll(`.langs div.lang`);
    el &&
      el.forEach((x) =>
        x.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (e.target.classList.contains("selected")) {
            return;
          }

          const lang = [...e.target.classList].find((x) => x !== "lang");

          setupLabelsByLanguage(lang);
          saveOptions();
        })
      );

    /*----------------------TABS-----------------------------------*/
    //#endregion

    //#region SHORTCUTS
    /*----------------------SHORTCUTS-----------------------------------*/

    // const shortcutsTd = [...document.querySelectorAll(".shortcut[name]")];
    // const shortcuts = shortcutsTd.map((s) => s.querySelector(".button input"));
    // const shortcutsAditionalKeys = shortcutsTd.reduce((acc, x) => {
    //   acc.push(...x.querySelectorAll(".additionals input"));
    //   return acc;
    // }, []);

    // function resetShortcuts(inputs = shortcuts) {
    //   inputs.forEach((inp) => {
    //     inp.value = inp._val;
    //     inp.classList.add("disabled");
    //   });
    // }

    // shortcutsAditionalKeys.forEach((inp) => {
    //   inp.addEventListener("change", (e) => {
    //     saveOptions();
    //   });
    // });

    // shortcuts.forEach((inp) => {
    //   const name = inp.parentElement.parentElement.getAttribute("name");
    //   const shortcut = settings.shortcuts[name];
    //   const [shift, ctrl, alt, code] = shortcut;

    //   inp._val = code;

    //   inp.parentElement.parentElement.querySelector("input.shift").checked = shift;
    //   inp.parentElement.parentElement.querySelector("input.ctrl").checked = ctrl;
    //   inp.parentElement.parentElement.querySelector("input.alt").checked = alt;

    //   inp.addEventListener("click", (e) => {
    //     e.preventDefault();
    //     e.stopPropagation();

    //     if (!e.target.classList.contains("disabled")) {
    //       return;
    //     }
    //     resetShortcuts();

    //     e.target.classList.remove("disabled");
    //   });

    //   const approveButton = inp.nextElementSibling;
    //   const cancelButton = approveButton.nextElementSibling;

    //   approveButton.addEventListener("click", (e) => {
    //     inp._val = inp._new;
    //     resetShortcuts();
    //     saveOptions();
    //   });
    //   cancelButton.addEventListener("click", (e) => {
    //     resetShortcuts();
    //   });
    // });

    // // click to cancel
    // document.addEventListener("click", (e) => {
    //   const stillEditing = shortcutsTd.some((td) => td.contains(e.target));

    //   if (stillEditing) {
    //     return;
    //   }

    //   resetShortcuts();
    // });

    // document.addEventListener("keydown", (e) => {
    //   const editingShortcuts = shortcuts.find((x) => x && !x.classList.contains("disabled"));

    //   if (!editingShortcuts) {
    //     return;
    //   }

    //   const blackedKeys = ["ShiftLeft", "ControlLeft", "AltLeft", "ShiftRight", "ControlRight", "AltRight"];

    //   if (blackedKeys.includes(e.code)) {
    //     return;
    //   }

    //   e.preventDefault();
    //   e.stopImmediatePropagation();
    //   e.stopPropagation();

    //   editingShortcuts.value = e.code;
    //   editingShortcuts._new = e.code;
    // });

    /*----------------------SHORTCUTS-----------------------------------*/
    //#endregion SHORTCUTS

    //#region POSTPROCESSING
    /*----------------------POSTPROCESSING-----------------------------------*/

    [...document.querySelectorAll("[name]")].forEach((control) => {
      if (!!control._picker) {
        control = control._picker;
      }

      // shortcuts
      if (control.tagName === "TD") {
        return;
      }

      control.addEventListener("change", () => {
        if (autoSave) {
          saveOptions();
        }
      });
    });

    function setRangeToInput(e) {
      let _el = document.getElementById(e.target.dataset.valueInput);
      _el && (_el.value = e.target.value);

      _el && typeof _el._callback === "function" && _el._callback();
    }

    function setInputToRange(e) {
      if (!e.target.validity.valid) {
        return;
      }
      let _el = document.getElementById(e.target.dataset.rangeInput);
      _el && (_el.value = e.target.value);

      _el && typeof _el._callback === "function" && _el._callback();

      if (autoSave) {
        saveOptions();
      }
    }

    document.querySelectorAll('input[type="range"][data-value-input]').forEach((x) => {
      x.addEventListener("input", setRangeToInput);
    });
    document.querySelectorAll("input[data-range-input]").forEach((x) => {
      x.addEventListener("change", setInputToRange);
    });

    browser.runtime.onMessage.addListener((message) => {
      switch (message.action) {
        case "savedLinksUpdated": {
          globalLinks = message.data || [];
          setupLinks(globalLinks);
          break;
        }
      }
    });

    /*----------------------POSTPROCESSING-----------------------------------*/
    //#endregion POSTPROCESSING
  }

  function onError(error) {
    setLoader(false);
    console.log(`Error: ${error}`);
  }

  const getting = browser.storage.sync.get(defaultOptionsValues);
  getting
    .then((settings) => {
      return browser.storage.local.get(defaultLocalOptionsValues).then((localSettings) => {
        return { settings, localSettings };
      });
    }, onError)
    .then(({ settings, localSettings }) => {
      setCurrentChoice({ ...settings, ...localSettings });
    });
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
  clearTimeout(DOMContentLoadedTimeout);
  setTimeout(() => {
    restoreOptions();
  }, 100);
});
var form = document.querySelector("form");
form && form.addEventListener("submit", saveOptions);
