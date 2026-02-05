import { useLanguage } from '../i18n/LanguageContext'

const LanguageToggle = () => {
  const { currentLanguage, switchLanguage } = useLanguage()

  return (
    <div className="language-toggle">
      <button
        className={`language-toggle-button ${currentLanguage === 'ru' ? 'active' : ''}`}
        onClick={() => switchLanguage('ru')}
        aria-label="Переключить на русский"
      >
        <span className="flag">🇷🇺</span>
        <span className="language-text">RU</span>
      </button>
      <button
        className={`language-toggle-button ${currentLanguage === 'ro' ? 'active' : ''}`}
        onClick={() => switchLanguage('ro')}
        aria-label="Comutați la română"
      >
        <span className="flag">🇷🇴</span>
        <span className="language-text">RO</span>
      </button>
    </div>
  )
}

export default LanguageToggle
