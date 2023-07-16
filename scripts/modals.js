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

  selectionDraggable = false;
  selectionDraggableValue = false;

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
    const header = document.createElement("header");
    wrapper.appendChild(header);

    //Header title
    const title = document.createElement("h2");
    title.innerText = "Выберите изображения для скачивания";
    header.appendChild(title);

    const selectAllButton = document.createElement("button");
    selectAllButton.classList.add("kd-button", "secondary");
    selectAllButton.innerText = "Выбрать все";
    selectAllButton.addEventListener("click", this.onSelectAllButtonClick.bind(this));
    header.appendChild(selectAllButton);

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
      image.setAttribute("draggable", false);

      image.dataset.src = x.dataset.src;
      image.dataset.title = x.dataset.title;
      image.dataset.size = x.parentElement.parentElement.querySelector(".post__filezise")?.innerText || "";

      imagesList.appendChild(image);
    });

    // imagesList.addEventListener("click", this.onImageListClick.bind(this));
    imagesList.addEventListener("mousedown", this.onImageListMouseDown.bind(this));
    document.addEventListener("mouseup", this.onImageListMouseUp.bind(this));
    imagesList.addEventListener("mousemove", this.onImageListMouseMove.bind(this));

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

  onSelectAllButtonClick() {
    const images = [...this.modalRef.querySelectorAll(".images img")];

    let allSelected = true;
    let allUnselected = true;

    for (let i = 0; i < images.length; i++) {
      if (images[i].classList.contains("selected")) {
        allUnselected = false;
      } else {
        allSelected = false;
      }

      if (!allSelected && !allUnselected) {
        break;
      }
    }

    if (allSelected) {
      images.forEach((x) => x.classList.remove("selected"));
    } else {
      images.forEach((x) => x.classList.add("selected"));
    }

    this.refreshSizeText();
    this.upadateIsValid();
  }

  onImageListClick(e) {
    e.preventDefault();

    const target = e.target;

    if (target.tagName !== "IMG") {
      return;
    }

    target.classList.toggle("selected", !target.classList.contains("selected"));

    this.refreshSizeText();
    this.upadateIsValid();
  }
  onImageListMouseDown(e) {
    e.preventDefault();

    const target = e.target;

    if (target.tagName !== "IMG") {
      return;
    }

    this.selectionDraggable = true;
    this.selectionDraggableValue = !target.classList.contains("selected");

    target.classList.toggle("selected", this.selectionDraggableValue);

    this.refreshSizeText();
    this.upadateIsValid();
  }

  onImageListMouseUp(e) {
    this.selectionDraggable = false;
  }

  onImageListMouseMove(e) {
    e.preventDefault();

    const target = e.target;

    if (target.tagName !== "IMG" || !this.selectionDraggable) {
      return;
    }

    const oldValue = target.classList.contains("selected");

    target.classList.toggle("selected", this.selectionDraggableValue);

    if (oldValue !== this.selectionDraggableValue) {
      this.refreshSizeText();
      this.upadateIsValid();
    }
  }

  parseSize(text) {
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

  getImagesSize() {
    const images = [...this.modalRef.querySelectorAll(".images img.selected")];
    return images.reduce((acc, x) => acc + this.parseSize(x.dataset.size), 0);
  }

  refreshSizeText() {
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

    const size = this.getImagesSize();

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
    } else {
      sizeText.classList.remove("warning");
      sizeText.title = "";
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
    const errorImgs = [];

    this.setLoading(this.getImagesSize());

    const namesMap = new Map();

    images.forEach(async (img, i) => {
      let filename = img.dataset.title;
      const imgSize = this.parseSize(img.dataset.size);

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
            this.setLoadingProgress(imgSize);

            const blob = await x.blob();
            files.push({
              name: filename,
              input: blob,
              size: blob.size,
            });
          })
          .catch((e) => {
            errorImgs.push(img);
            throw e;
          })
      );
    });

    Promise.allSettled(promises).then((promises) => {
      if (promises.some((x) => x.status === "rejected" && x.reason === "aborted")) {
        return;
      }

      const hasErrors = promises.some((x) => x.status === "rejected");

      if (hasErrors) {
        alert("Некоторые файлы не были загружены из-за непредвиденной ошибки. Они остались выделенными.");
      }

      browser.runtime.sendMessage({
        action: this.isZip ? "downloadZip" : "download",
        data: {
          zipName: this.zipFilename,
          files: files,
        },
      });

      if (!hasErrors) {
        this.close();
      } else {
        this.processErrorImages(errorImgs);
      }
    });
  }

  setLoading(maxCount) {
    this.loadingMaxCount = maxCount;

    const loaderWrapper = this.modalRef.querySelector(".loader-wrapper");

    loaderWrapper.classList.remove("hidden");

    this.loadingCount = 0;
    this.setLoadingProgress(0);
  }

  setLoadingProgress(size) {
    this.loadingCount += size;

    const statusBar = this.modalRef.querySelector(".loader-wrapper .status-bar");
    statusBar.style.width = ((this.loadingCount / this.loadingMaxCount) * 100).toFixed(2) + "%";
  }

  processErrorImages(errorImages) {
    const images = [...this.modalRef.querySelectorAll(".images img.selected")];
    images.forEach((img) => {
      if (errorImages.every((x) => x !== img)) {
        img.classList.remove("selected");
      }
    });

    this.refreshSizeText();
    this.upadateIsValid();

    this.abortLoading();
  }

  abortLoading() {
    this.abortController.abort("aborted");

    const loaderWrapper = this.modalRef.querySelector(".loader-wrapper");
    loaderWrapper.classList.add("hidden");

    this.loadingCount = 0;
    this.setLoadingProgress(0);
  }
}

class Modal_ImageViewer extends ModalClass {
  imageElements = [];

  constructor(params) {
    super(params);
    this.imageElements = params.images || [];
  }

  getHtml() {
    const wrapper = document.createElement("div");

    //Header
    const header = document.createElement("h2");
    header.innerText = "Все изображения треда";
    wrapper.appendChild(header);

    // Images
    const imagesList = document.createElement("div");
    imagesList.classList.add("images");

    (this.imageElements || []).forEach((x) => {
      const post = x.parentElement.parentElement.parentElement.parentElement;
      const src = x.dataset.thumbSrc || x.dataset.src || x.src;

      const height = (x.dataset.thumbHeight || x.getAttribute("height")) + "px";
      const width = (x.dataset.thumbWidth || x.getAttribute("width")) + "px";

      const image = document.createElement("img");
      image.loading = "lazy";
      image.src = src;
      image.style.height = height;
      image.style.width = width;
      image.title = x.dataset.title;

      image.dataset.src = x.dataset.src;
      image.dataset.title = x.dataset.title;
      image.__sourceImage = x;

      const imageWrapper = document.createElement("div");
      imageWrapper.classList.add("image-wrapper");
      imagesList.appendChild(imageWrapper);

      const originalDownloadIcon = x.parentElement.parentElement.querySelector(".js-post-saveimg");

      const downloadIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      downloadIcon.classList.add("icon");

      const downloadIcon_use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      downloadIcon_use.setAttribute("xlink:href", "#icon__saveimg");
      downloadIcon_use.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#icon__saveimg");
      downloadIcon.appendChild(downloadIcon_use);
      downloadIcon.title = "Скачать";

      downloadIcon.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        originalDownloadIcon.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window,
          })
        );
      });

      const buttonsWrapper = document.createElement("div");
      buttonsWrapper.classList.add("header");

      buttonsWrapper.appendChild(downloadIcon);

      const postLink = document.createElement("span");
      postLink.classList.add("post-link");
      postLink.innerText = "Пост №" + post.dataset.num;

      postLink.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        post.scrollIntoView({ behavior: "smooth", block: "center" });

        MainClass_Events.fixScrollToPost(post.dataset.num);

        this.close();
      });

      buttonsWrapper.appendChild(postLink);

      imageWrapper.appendChild(buttonsWrapper);
      imageWrapper.appendChild(image);
    });

    imagesList.addEventListener("click", (e) => {
      e.preventDefault();

      const target = e.target;

      if (target.tagName !== "IMG") {
        return;
      }

      // IMAGE CLICK

      setTimeout(() => {
        target.__sourceImage.click();
      });
    });

    wrapper.appendChild(imagesList);

    return wrapper;
  }

  getModalClasses() {
    return ["view-images"];
  }

  onShow() {}

  close() {
    this.modalRef?.remove();
  }
}
