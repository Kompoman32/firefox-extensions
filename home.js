(async () => {
  const section = document.querySelector(".main__meta");

  if (!section) {
    return;
  }

  let buttons = section.querySelector(".kd-buttons");

  if (buttons) {
    buttons.remove();
  }

  buttons = document.createElement("div");
  buttons.classList.add("kd-buttons");
  buttons.classList.add("buttons");

  const button = document.createElement("a");
  button.classList.add("buttons__button");
  button.href = "/b/";

  button.innerText = "Снова в Бред...";

  button.style.color = "var(--theme_link)";
  button.style.padding = "30px 14px";
  button.style.fontSize = "30px";

  section.appendChild(buttons);
  buttons.appendChild(button);
})();
