import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from './translations'
import { detectInitialLanguage, saveLanguagePreference, updateUrlLanguage } from './languageUtils'

const LanguageContext = createContext()

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => detectInitialLanguage())

  // Обновить URL при первом рендере, если язык определен из браузера или localStorage
  useEffect(() => {
    updateUrlLanguage(currentLanguage)
  }, [])

  const switchLanguage = (newLanguage) => {
    if (newLanguage === currentLanguage) return

    setCurrentLanguage(newLanguage)
    saveLanguagePreference(newLanguage)
    updateUrlLanguage(newLanguage)
  }

  const t = translations[currentLanguage]

  const value = {
    currentLanguage,
    switchLanguage,
    t
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)

  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }

  return context
}
