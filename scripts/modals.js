class ModalClass {
  modalRef = {};

  constructor(params) {}

  getHtml() {}

  onShow() {}

  close() {}
}

class Modal_ImageDownloader extends ModalClass {
  isZip = false;
  zipFilename = "";
  imageElements = [];

  loadingCount = 0;
  loadingMaxCount = 0;

  constructor(params) {
    super(params);
    this.imageElements = params.images || [];
    this.isZip = params.zip || false;
    this.zipFilename = params.zipFilename || "archive.zip";

    this.abortController = new AbortController();
  }

  getHtml() {
    const wrapper = document.createElement("div");

    //Header
    const header = document.createElement("h2");
    header.innerText = "Выберите изображения для скачивания";
    wrapper.appendChild(header);

    // Images
    const imagesList = document.createElement("div");
    imagesList.classList.add("images");

    (this.imageElements || []).forEach((x) => {
      const src = x.dataset.thumbSrc || x.dataset.src || x.src;

      const height = (x.dataset.thumbHeight || x.getAttribute("height")) + "px";
      const width = (x.dataset.thumbWidth || x.getAttribute("width")) + "px";

      const image = document.createElement("img");
      image.classList.add("selected");
      image.loading = "lazy";
      image.src = src;
      image.style.height = height;
      image.style.width = width;
      image.title = x.dataset.title;

      image.dataset.src = x.dataset.src;
      image.dataset.title = x.dataset.title;
      image.dataset.size = x.parentElement.parentElement.querySelector(".post__filezise")?.innerText || "";

      imagesList.appendChild(image);
    });

    imagesList.addEventListener("click", (e) => {
      e.preventDefault();

      const target = e.target;

      if (target.tagName !== "IMG") {
        return;
      }

      if (target.classList.contains("selected")) {
        target.classList.remove("selected");
      } else {
        target.classList.add("selected");
      }

      this.refreshSizeText();
      this.upadateIsValid();
    });

    wrapper.appendChild(imagesList);

    // Footer
    const footer = document.createElement("div");
    footer.classList.add("footer");

    const sizeText = document.createElement("div");
    sizeText.classList.add("size");
    footer.appendChild(sizeText);

    const CancelButton = document.createElement("div");
    CancelButton.classList.add("kd-button");
    CancelButton.classList.add("secondary");
    CancelButton.innerText = "Отменить";

    CancelButton.addEventListener("click", (e) => {
      e.preventDefault();

      this.close();
    });
    footer.appendChild(CancelButton);

    const OkButton = document.createElement("div");
    OkButton.classList.add("kd-button");
    OkButton.classList.add("primary");
    OkButton.innerText = "Загрузить";
    OkButton.addEventListener("click", (e) => {
      e.preventDefault();

      let confirmed = true;

      if (sizeText.title) {
        confirmed = confirm(sizeText.title);
      }

      if (confirmed === true) {
        this.saveImages();
      }
    });

    footer.appendChild(OkButton);

    wrapper.appendChild(footer);

    // Loading
    const loaderWrapper = document.createElement("div");
    loaderWrapper.classList.add("loader-wrapper");
    loaderWrapper.classList.add("hidden");

    const loader = document.createElement("div");
    loader.classList.add("loader");
    loaderWrapper.appendChild(loader);

    const statusBar = document.createElement("div");
    statusBar.classList.add("status-bar");
    statusBar.style.width = "0px";
    loaderWrapper.appendChild(statusBar);

    const AbortLoadingButton = document.createElement("div");
    AbortLoadingButton.classList.add("kd-button");
    AbortLoadingButton.classList.add("secondary");
    AbortLoadingButton.innerText = "Отменить";

    AbortLoadingButton.addEventListener("click", (e) => {
      e.preventDefault();

      this.abortLoading();
    });
    loaderWrapper.appendChild(AbortLoadingButton);

    wrapper.appendChild(loaderWrapper);

    return wrapper;
  }

  getModalClasses() {
    return ["download-images"];
  }

  onShow() {
    this.refreshSizeText();
    this.upadateIsValid();
  }

  close() {
    this.abortController.abort();
    this.modalRef?.remove();
  }

  refreshSizeText() {
    function parseSize(text) {
      text = text.split(",")[0] || "";
      const val = +text.substring(0, text.length - 2) || 0;
      switch (true) {
        case text.includes("Кб"):
          return val;

        case text.includes("Мб"):
          return val * 1024;

        case text.includes("Гб"):
          return val * 1024 * 1024;
      }
      return val;
    }

    function needWarning(size) {
      const needWarning = MainClass_Base.settings.downloadWarning;

      if (!needWarning) {
        return false;
      }

      const warningScale = MainClass_Base.settings.downloadWarningScale;
      const warningSize =
        MainClass_Base.settings.downloadWarningSize *
        Math.pow(1024, Math.max(downloadWarningScaleValues.indexOf(warningScale), 0));

      return size > warningSize;
    }

    function formatSize(size) {
      const sizeLabels = ["Kb", "Mb", "Gb", "Tb"];

      let i = 0;
      for (; i < sizeLabels.length; i++) {
        if (size < 1024) {
          break;
        }
        size = size / 1024;
      }

      const labelInd = Math.min(i, sizeLabels.length - 1);

      return `${size.toFixed("2")}${sizeLabels[labelInd]}`;
    }

    const images = [...this.modalRef.querySelectorAll(".images img.selected")];
    const size = images.reduce((acc, x) => acc + parseSize(x.dataset.size), 0);

    const sizeFormatted = formatSize(size);

    const sizeText = this.modalRef.querySelector(".footer .size");
    sizeText.innerText = sizeFormatted + (this.isZip ? ` unzipped` : "");

    if (needWarning(size)) {
      const warningText =
        `Скачиваемые файлы больше чем ${MainClass_Base.settings.downloadWarningSize}${
          MainClass_Base.settings.downloadWarningScale
        } (${sizeFormatted}${this.isZip ? " без компрессии" : ""})\n` + `Вы уверены?`;

      sizeText.classList.add("warning");
      sizeText.title = warningText;
    }
  }

  upadateIsValid() {
    const button = this.modalRef.querySelector(".kd-button.primary");

    const images = [...this.modalRef.querySelectorAll(".images img.selected")];
    const isValid = !!images.length;

    if (isValid) {
      button.removeAttribute("disabled");
    } else {
      button.setAttribute("disabled", true);
    }
  }

  saveImages() {
    const images = [...this.modalRef.querySelectorAll(".images img.selected")];

    if (images.length === 0) {
      return;
    }

    const promises = [];
    const files = [];

    this.setLoading(images.length);

    const namesMap = new Map();

    images.forEach(async (img, i) => {
      let filename = img.dataset.title;

      if (namesMap.has(filename)) {
        const originalFileName = filename;
        const extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        const count = namesMap.get(originalFileName);
        filename = filename.substring(0, filename.lastIndexOf("."));

        filename = `${filename} (${count})${extension}`;
        namesMap.set(originalFileName, count + 1);
      } else {
        namesMap.set(filename, 1);
      }

      const imgURL = img.dataset.src ? `${location.origin}${img.dataset.src}` : img.src;

      promises.push(
        fetch(imgURL, { signal: this.abortController.signal })
          .then(async (x) => {
            this.setLoadingProgress();

            const blob = await x.blob();
            files.push({
              name: filename,
              input: blob,
              size: blob.size,
            });
          })
          .catch((e) => {
            this.setLoadingProgress();
            throw e;
          })
      );
    });

    Promise.allSettled(promises).then((promises) => {
      if (promises.some((x) => x.status === "rejected" && x.reason === "aborted")) {
        return;
      }

      if (promises.some((x) => x.status === "rejected")) {
        alert("Некоторые файлы не были загружены из-за непредвиденной ошибки");
      }

      browser.runtime.sendMessage({
        action: this.isZip ? "downloadZip" : "download",
        data: {
          zipName: this.zipFilename,
          files: files,
        },
      });

      this.close();
    });
  }

  setLoading(maxCount) {
    this.loadingMaxCount = maxCount;

    const loaderWrapper = this.modalRef.querySelector(".loader-wrapper");

    loaderWrapper.classList.remove("hidden");

    this.loadingCount = -1;
    this.setLoadingProgress();
  }

  setLoadingProgress() {
    this.loadingCount++;

    const statusBar = this.modalRef.querySelector(".loader-wrapper .status-bar");
    statusBar.style.width = ((this.loadingCount / this.loadingMaxCount) * 100).toFixed(2) + "%";
  }

  abortLoading() {
    this.abortController.abort("aborted");

    const loaderWrapper = this.modalRef.querySelector(".loader-wrapper");
    loaderWrapper.classList.add("hidden");
  }
}
