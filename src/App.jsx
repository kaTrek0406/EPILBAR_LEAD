import { useState, useEffect } from 'react'
import './App.css'
import logoEpilbar from '/logo_epilbar.png'

function App() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: '',
    comment: ''
  })

  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [confetti, setConfetti] = useState([])
  const [particles, setParticles] = useState([])

  // Генерация частиц для фона
  useEffect(() => {
    const newParticles = []
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 10 + Math.random() * 10,
        size: 20 + Math.random() * 60
      })
    }
    setParticles(newParticles)
  }, [])

  // Генерация конфетти при успехе
  useEffect(() => {
    if (submitSuccess) {
      const newConfetti = []
      for (let i = 0; i < 50; i++) {
        newConfetti.push({
          id: i,
          left: 20 + Math.random() * 60,
          delay: Math.random() * 0.3,
          duration: 2 + Math.random() * 1,
          color: ['#EB6F7B', '#F09199', '#F5B3B7', '#FBD5D9', '#fbbf24'][Math.floor(Math.random() * 5)],
          rotation: Math.random() * 360
        })
      }
      setConfetti(newConfetti)

      setTimeout(() => {
        setConfetti([])
      }, 3000)
    }
  }, [submitSuccess])

  // Валидация молдавского номера: +373 (XX) XXX-XXX или 373XXXXXXXX
  const validateMoldovaPhone = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '')
    // Молдавские номера: начинаются с 373, затем 8 цифр
    const moldovaPattern = /^373\d{8}$/
    return moldovaPattern.test(cleanPhone)
  }

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Введите ваше имя'
        if (value.trim().length < 2) return 'Имя должно содержать минимум 2 символа'
        return ''

      case 'phone':
        if (!value.trim()) return 'Введите номер телефона'
        if (!validateMoldovaPhone(value)) {
          return 'Введите корректный молдавский номер (например, +373 XX XXX-XXX)'
        }
        return ''

      case 'service':
        if (!value) return 'Выберите тип процедуры'
        return ''

      default:
        return ''
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    // Форматирование телефона
    if (name === 'phone') {
      let formatted = value.replace(/\D/g, '')

      // Автоматически добавляем 373 если начинает вводить
      if (formatted.length > 0 && !formatted.startsWith('373')) {
        formatted = '373' + formatted
      }

      // Форматирование: +373 XX XXX-XXX
      if (formatted.length <= 3) {
        formatted = '+' + formatted
      } else if (formatted.length <= 5) {
        formatted = `+${formatted.slice(0, 3)} ${formatted.slice(3)}`
      } else if (formatted.length <= 8) {
        formatted = `+${formatted.slice(0, 3)} ${formatted.slice(3, 5)} ${formatted.slice(5)}`
      } else {
        formatted = `+${formatted.slice(0, 3)} ${formatted.slice(3, 5)} ${formatted.slice(5, 8)}-${formatted.slice(8, 11)}`
      }

      setFormData(prev => ({ ...prev, [name]: formatted }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Валидация при изменении если поле уже было тронуто
    if (touched[name]) {
      const error = validateField(name, name === 'phone' ? value : value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const sendToTelegram = async (data) => {
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
    const chatIds = import.meta.env.VITE_TELEGRAM_CHAT_ID?.split(',') || []

    console.log('=== ОТПРАВКА В TELEGRAM ===')
    console.log('Bot token присутствует:', !!botToken)
    console.log('Количество chat IDs:', chatIds.length)

    if (!botToken || chatIds.length === 0) {
      console.error('Отсутствуют переменные окружения!')
      return { success: false, error: 'Missing environment variables' }
    }

    const serviceNames = {
      electro: 'Электро эпиляция',
      laser: 'Лазерная эпиляция',
      sugar: 'Шугаринг',
      wax: 'Восковая эпиляция'
    }

    const message = `
🆕 Новая запись на процедуру!

👤 Имя: ${data.name}

📱 Телефон клиента: ${data.phone.replace(/[\s-]/g, '')}
   (нажмите на номер для звонка)

💆‍♀️ Процедура: ${serviceNames[data.service] || data.service}
${data.comment ? `💬 Комментарий: ${data.comment}` : ''}

📅 Дата заполнения формы: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Chisinau' })}
    `.trim()

    // Inline кнопка для быстрого контакта через WhatsApp
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '💬 Написать в WhatsApp',
            url: `https://wa.me/${data.phone.replace(/\D/g, '')}`
          }
        ]
      ]
    }

    try {
      // Отправляем сообщение всем пользователям (с обработкой ошибок для каждого)
      const promises = chatIds.map(async (chatId) => {
        try {
          const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: chatId.trim(),
              text: message,
              reply_markup: keyboard
            })
          })

          const result = await response.json()

          if (!response.ok) {
            console.error(`❌ Ошибка для chat_id ${chatId}:`, result.description)
            return { success: false, chatId, error: result.description }
          }

          console.log(`✅ Сообщение успешно отправлено для chat_id ${chatId}`)
          return { success: true, chatId }
        } catch (error) {
          console.error(`❌ Ошибка для chat_id ${chatId}:`, error.message)
          return { success: false, chatId, error: error.message }
        }
      })

      const results = await Promise.all(promises)

      // Считаем успешные отправки
      const successCount = results.filter(r => r.success).length
      const failedCount = results.filter(r => !r.success).length

      console.log(`📊 Результат: ${successCount} успешно, ${failedCount} ошибок`)

      // Если хотя бы одно сообщение отправлено - считаем успехом
      if (successCount > 0) {
        console.log('🎉 Форма успешно отправлена!')
        return { success: true, successCount, failedCount }
      } else {
        console.error('❌ Не удалось отправить ни одно сообщение')
        return { success: false, error: 'Все получатели недоступны' }
      }
    } catch (error) {
      console.error('❌ Критическая ошибка отправки:', error)
      return { success: false, error }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('=== ФОРМА ОТПРАВЛЕНА ===')
    console.log('Данные формы:', formData)

    // Проверяем все поля
    const newErrors = {}
    Object.keys(formData).forEach(key => {
      if (key !== 'comment') {
        const error = validateField(key, formData[key])
        if (error) newErrors[key] = error
      }
    })

    console.log('Ошибки валидации:', newErrors)

    // Отмечаем все поля как тронутые
    setTouched({
      name: true,
      phone: true,
      service: true
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    // Отправка в Telegram
    const result = await sendToTelegram(formData)

    if (result.success) {
      setIsSubmitting(false)
      setSubmitSuccess(true)

      // Сброс формы после успеха
      setTimeout(() => {
        setFormData({
          name: '',
          phone: '',
          service: '',
          comment: ''
        })
        setErrors({})
        setTouched({})
        setSubmitSuccess(false)
      }, 3000)
    } else {
      setIsSubmitting(false)
      console.error('Ошибка отправки:', result.error)

      // Показываем детальное сообщение об ошибке
      const errorMessage = typeof result.error === 'string'
        ? result.error
        : result.error?.message || 'Неизвестная ошибка'

      setErrors({ submit: `Ошибка отправки: ${errorMessage}` })
      alert(`Не удалось отправить форму. Пожалуйста, свяжитесь с нами напрямую.\n\nДетали: ${errorMessage}`)
    }
  }

  return (
    <div className="app">
      {/* Анимированные частицы на фоне */}
      <div className="particles">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              width: `${particle.size}px`,
              height: `${particle.size}px`
            }}
          />
        ))}
      </div>

      {/* Конфетти при успешной отправке */}
      {confetti.length > 0 && (
        <div className="confetti-container">
          {confetti.map(conf => (
            <div
              key={conf.id}
              className="confetti"
              style={{
                left: `${conf.left}%`,
                animationDelay: `${conf.delay}s`,
                animationDuration: `${conf.duration}s`,
                backgroundColor: conf.color,
                transform: `rotate(${conf.rotation}deg)`
              }}
            />
          ))}
        </div>
      )}

      <div className="container">
        <div className="card">
          {/* Логотип и приветствие */}
          <div className="form-header">
            <div className="form-logo-container">
              <img src={logoEpilbar} alt="Epilbar" className="form-logo" />
            </div>
            <h1 className="form-welcome">Добро пожаловать в Epil Bar</h1>
            <p className="form-intro">
              Epil Bar — это студия профессиональной эпиляции, где забота о клиенте стоит на первом месте.
              Мы работаем по современным стандартам, используем качественные профессиональные материалы и проверенные техники.
            </p>
          </div>

          <h2 className="title">Запись на процедуру</h2>
          <p className="subtitle">
            Заполните форму ниже, чтобы записаться на сеанс эпиляции
          </p>

            <form onSubmit={handleSubmit} className="form" noValidate>
            <div className="form-group">
              <label htmlFor="name" className="label">
                Ваше имя <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input ${errors.name && touched.name ? 'input-error' : ''} ${
                  !errors.name && touched.name && formData.name ? 'input-success' : ''
                }`}
                placeholder="Введите ваше имя"
              />
              {errors.name && touched.name && (
                <span className="error-message">{errors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="label">
                Номер телефона <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input ${errors.phone && touched.phone ? 'input-error' : ''} ${
                  !errors.phone && touched.phone && formData.phone ? 'input-success' : ''
                }`}
                placeholder="+373 XX XXX-XXX"
                maxLength="17"
              />
              {errors.phone && touched.phone && (
                <span className="error-message">{errors.phone}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="service" className="label">
                Тип процедуры <span className="required">*</span>
              </label>
              <select
                id="service"
                name="service"
                value={formData.service}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input select ${errors.service && touched.service ? 'input-error' : ''} ${
                  !errors.service && touched.service && formData.service ? 'input-success' : ''
                }`}
              >
                <option value="">Выберите процедуру</option>
                <option value="electro">Электро эпиляция</option>
                <option value="laser">Лазерная эпиляция</option>
                <option value="sugar">Шугаринг</option>
                <option value="wax">Восковая эпиляция</option>
              </select>
              {errors.service && touched.service && (
                <span className="error-message">{errors.service}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="comment" className="label">
                Комментарий
              </label>
              <textarea
                id="comment"
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                className="input textarea"
                placeholder="Дополнительная информация или пожелания (необязательно)"
                rows="4"
              />
            </div>

            <button
              type="submit"
              className={`submit-button ${isSubmitting ? 'submitting' : ''} ${
                submitSuccess ? 'success' : ''
              }`}
              disabled={isSubmitting || submitSuccess}
              onClick={(e) => console.log('Кнопка нажата!', e)}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Отправка...
                </>
              ) : submitSuccess ? (
                <>
                  <span className="checkmark">✓</span>
                  Отправлено!
                </>
              ) : (
                'Записаться'
              )}
            </button>
          </form>

          {errors.submit && (
            <div className="error-message" style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--error)' }}>
              {errors.submit}
            </div>
          )}

          {submitSuccess && (
            <div className="success-message">
              Спасибо за запись! Мы свяжемся с вами в ближайшее время.
            </div>
          )}
        </div>

        <footer className="footer">
          <p className="footer-text">© 2026 Claro Plus. Все права защищены.</p>
        </footer>
      </div>
    </div>
  )
}

export default App
