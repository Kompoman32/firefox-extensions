function removeHash() {
  history.pushState("", document.title, window.location.pathname + window.location.search);
}

(() => {
  const hash = location.hash.substring(1);
  console.log(hash);

  const nameInput = document.querySelector("[name='thread_url']");

  if (!hash || !nameInput) {
    return;
  }

  nameInput.value = `https://2ch.hk${hash}.html`;

  const captchaInput = document.querySelector("[name='captcha_code']");
  captchaInput?.focus();

  removeHash();
})();
