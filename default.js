var animationValues = ["jumping", "circle", "rotating"];
var downloadWarningScaleValues = ["Kb", "Mb"];

var defaultOptionsValues = {
  lang: "ru",
  autoSave: true,
  toggled: true,
  intervalTimeout: 5000,

  maxHeight: 700,
  // Reversed (if true => replace)
  thumbImages: true,
  bTitles: true,
  bTitlesSize: 47,

  titleToBottom: false,

  showPlashque: true,

  runGif: true,

  saveThreadPosition: false,

  downloadWarning: true,
  downloadWarningSize: 10,
  downloadWarningScale: "Mb",

  popupBlockClicks: false,

  popupBackground: true,
  popupBackgroundColor: "#15202b",
  popupBackgroundOpacity: 0.86328125,
  popupBackground_img: true,
  popupBackground_vid: true,
  popupBackground_gif: true,

  popupSkipVideo: false,

  popupAnimate: false,
  popupAnimation: "jumping",
  popupAnimationTime: 2,

  colorPost: true,
  colors: {
    double: "#b5b5b5",
    triple: "#deb8e1",
    quadruple: "#f5f982",
    quintuple: "#82f98f",
    sextuple: "#ee8b99",
    septuple: "#ee8b99",
    octuple: "#ee8b99",
    noncuple: "#ee8b99",
  },

  collapseDuplicates: true,

  shortcuts: {
    // Shift, Ctrl, Alt, Code
    popupBackground: [false, false, true, "KeyB"],
    popupAnimating: [false, false, true, "KeyP"],
    popupChangeAnimation: [false, false, true, "KeyO"],
    nbleHighlight: [false, false, true, "KeyH"],
    popupSkipVideo: [false, false, true, "KeyS"],
  },
};

var defaultLocalOptionsValues = {
  links: [],
  collapsedThreads: {
    b: [],
    all: [],
  },
  savedPositions: {
    b: {},
    all: {},
  },
};
