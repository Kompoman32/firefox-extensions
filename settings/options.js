var defaultOptionsValues = {
  maxHeight: 700,
  // Reversed (if true => replace)
  thumbImages: true,
  bTitles: true,
  bTitlesSize: 47,
  runGif: true,
};

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
            res[el.name] = el.value;
            break;
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

function saveOptions(e) {
  function onError(error) {
    setLoader(true);
    console.log(`Error: ${error}`);
  }

  e.preventDefault();

  const form = formSerializer(e.target);

  browser.storage.sync
    .set(form)
    .then(() => {
      alert("Saved. Reload 2ch page please!");
      setLoader(true);
    })
    .catch(onError);
}

function restoreOptions() {
  function setCurrentChoice(result) {
    setLoader(true);

    document.querySelector("#max-height").value = result.maxHeight || defaultOptionsValues.maxHeight;
    document.querySelector("#thumb-images").checked = result.thumbImages || defaultOptionsValues.thumbImages;
    document.querySelector("#b-titles").checked = result.bTitles || defaultOptionsValues.bTitles;
    document.querySelector("#b-titles-size").value = result.bTitlesSize || defaultOptionsValues.bTitlesSize;
    document.querySelector("#run-gif").checked = result.runGif || defaultOptionsValues.runGif;
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

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form") && document.querySelector("form").addEventListener("submit", saveOptions);
