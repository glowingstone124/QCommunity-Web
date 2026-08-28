import { createI18n } from "vue-i18n";
import en from "./locales/en.json";
import zh from "./locales/zh.json";
import { pageMessages } from "./locales/pageMessages.js";

const savedLocale = localStorage.getItem("locale") || "zh";

function mergeLocaleMessages(base, additions) {
    const sections = new Set([...Object.keys(base), ...Object.keys(additions)]);
    return Object.fromEntries([...sections].map((section) => {
        const baseValue = base[section];
        const additionValue = additions[section];
        const bothObjects = baseValue && additionValue
            && typeof baseValue === 'object'
            && typeof additionValue === 'object'
            && !Array.isArray(baseValue)
            && !Array.isArray(additionValue);

        return [section, bothObjects ? { ...baseValue, ...additionValue } : (additionValue ?? baseValue)];
    }));
}

const i18n = createI18n({
    locale: savedLocale,
    fallbackLocale: "en",
    messages: {
        en: mergeLocaleMessages(en, pageMessages.en),
        zh: mergeLocaleMessages(zh, pageMessages.zh),
    },
});

export default i18n;
