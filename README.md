# Коллекция плагинов

Telegram автора: [@Cheeze_l](https://t.me/Cheeze_l)

---

## 📦 Информация о плагинах

### 🎛️ Buttons.js - Управление кнопками

**Версия:** 1.1.2
**Ссылка:** [https://mylampa1.github.io/buttons.js](https://mylampa1.github.io/buttons.js)

Плагин для управления кнопками на странице фильма/сериала в Lampa. Позволяет изменять порядок кнопок, скрывать/показывать их, группировать в папки, а также управлять режимами отображения текста на кнопках.

---

### 🔒 SiSearch Pass - Родительский контроль для поиска по Клубничке

**Версия:** 1.0.2
**Ссылка:** [https://mylampa1.github.io/sisearch_pass.js](https://mylampa1.github.io/sisearch_pass.js)

Плагин добавляет родительский контроль для источника поиска "Клубничка". При включенном родительском контроле требует ввод PIN-кода перед показом результатов поиска.

---

### 🔄 Source Sort - Сортировка онлайн источников

**Версия:** 1.0.1
**Ссылка:** [https://mylampa1.github.io/source_sort.js](https://mylampa1.github.io/source_sort.js)

Плагин для сортировки и фильтрации источников (балансеров) в онлайн-плагинах Lampa. Добавляет кнопку управления источниками рядом с кнопкой выбора источника.

---

## 📥 Установка

### Для Lampa:

1. Откройте **Lampa**
2. Перейдите в **"Настройки"** → **"Расширения"** → **"Добавить плагин"**
3. Введите URL плагина:

```
https://mylampa1.github.io/buttons.js
https://mylampa1.github.io/sisearch_pass.js
https://mylampa1.github.io/source_sort.js
```

### Для Lampac:

Добавьте в файл `lampainit.js` следующие строки:

```
Lampa.Utils.putScriptAsync(["https://mylampa1.github.io/buttons.js"], function() {});
Lampa.Utils.putScriptAsync(["https://mylampa1.github.io/sisearch_pass.js"], function() {});
Lampa.Utils.putScriptAsync(["https://mylampa1.github.io/source_sort.js"], function() {});
```

---
