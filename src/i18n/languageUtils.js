const STORAGE_KEY = 'epilbar_language'
const SUPPORTED_LANGUAGES = ['ru', 'ro']
const DEFAULT_LANGUAGE = 'ru'

/**
 * Получить язык из URL параметра ?lang=ru или ?lang=ro
 */
export const getUrlLanguage = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const langParam = urlParams.get('lang')

  if (langParam && SUPPORTED_LANGUAGES.includes(langParam)) {
    return langParam
  }

  return null
}

/**
 * Получить язык из localStorage
 */
export const getStoredLanguage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
      return stored
    }
  } catch (error) {
    console.warn('Unable to access localStorage:', error)
  }

  return null
}

/**
 * Определить язык браузера
 */
export const getBrowserLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage

  // Проверяем если браузер на румынском
  if (browserLang.toLowerCase().startsWith('ro')) {
    return 'ro'
  }

  // Проверяем если браузер на русском
  if (browserLang.toLowerCase().startsWith('ru')) {
    return 'ru'
  }

  return null
}

/**
 * Определить начальный язык с учетом приоритета:
 * 1. URL параметр (для рекламных ссылок)
 * 2. localStorage (предыдущий выбор пользователя)
 * 3. Язык браузера
 * 4. Язык по умолчанию (ru)
 */
export const detectInitialLanguage = () => {
  // 1. Проверяем URL параметр (высший приоритет)
  const urlLang = getUrlLanguage()
  if (urlLang) {
    return urlLang
  }

  // 2. Проверяем localStorage
  const storedLang = getStoredLanguage()
  if (storedLang) {
    return storedLang
  }

  // 3. Проверяем язык браузера
  const browserLang = getBrowserLanguage()
  if (browserLang) {
    return browserLang
  }

  // 4. Возвращаем язык по умолчанию
  return DEFAULT_LANGUAGE
}

/**
 * Сохранить выбранный язык в localStorage
 */
export const saveLanguagePreference = (language) => {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    console.warn(`Unsupported language: ${language}`)
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, language)
  } catch (error) {
    console.warn('Unable to save language preference:', error)
  }
}

/**
 * Обновить URL с параметром языка без перезагрузки страницы
 */
export const updateUrlLanguage = (language) => {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return
  }

  const url = new URL(window.location)
  url.searchParams.set('lang', language)
  window.history.replaceState(null, '', url)
}
