function goToThread() {
  let [thread, _, num] = location.pathname.split("/");

  if (!thread || !num) {
    return;
  }

  window.location;
}

(async () => {
  let a = document.querySelector("a.toThread") || document.createElement("a");
  a.classList.add("toThread");

  a.innerText = "В тред";

  a.style.position = "fixed";
  a.style.top = "20px";
  a.style.left = "20px";
  a.style.zIndex = 100;
  a.style.width = "100px";
  a.style.height = "50px";

  a.style.display = "flex";
  a.style.flexDirection = "row";
  a.style.alignItems = "center";
  a.style.justifyContent = "center";

  a.style.border = "none";
  a.style.borderRadius = "1em";

  a.style.fontSize = "25px";
  a.style.textAlign = "center";
  a.style.textDecoration = "none";

  a.style.background = "#c3672a";
  a.style.color = "white";

  a.style.cursor = "pointer";

  document.body.appendChild(a);

  let [_, thread, __, num] = location.pathname.split("/");

  if (!thread || !num) {
    return;
  }

  a.href = `/${thread}/res/${num}.html`;
})();
