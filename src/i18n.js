import { createI18n } from "vue-i18n";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

const savedLocale = localStorage.getItem("locale") || "zh";

const i18n = createI18n({
    locale: savedLocale,
    fallbackLocale: "en",
    messages: {
        en,
        zh,
    },
});

export default i18n;
