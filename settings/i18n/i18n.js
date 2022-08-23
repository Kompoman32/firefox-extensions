var i18nLanguageEnum = {
  ru: "ru",
  en: "en",
};

const parseLange = (json) => {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
};

var ru = i18n_ru_lang_lines;
var en = i18n_en_lang_lines;

class I18N {
  static lang = i18nLanguageEnum.ru;

  static lines = {
    ru: ru,
    en: en,
  };

  static setLanguage(lang) {
    I18N.lang = lang;
  }

  static getLine(line) {
    const lines = I18N.lines[I18N.lang];

    if (!lines) {
      return null;
    }

    const hierarchy = line.split(".");

    line = lines;

    for (let i = 0; i < hierarchy.length; i++) {
      line = line[hierarchy[i]];

      if (line === undefined) {
        return null;
      }
    }

    return line;
  }
}
