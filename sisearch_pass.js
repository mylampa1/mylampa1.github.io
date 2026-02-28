/**
 * Плагин родительского контроля для поиска Клубники в Lampa
 * Версия: 1.0.2
 * Автор: @Cheeze_l
 * 
 * Описание:
 * Плагин добавляет родительский контроль для источника поиска "Клубничка".
 * При включенном родительском контроле требует ввод PIN-кода перед показом результатов поиска.
 * 
 * Возможности:
 * - Защита результатов поиска с помощью PIN-кода
 * - Карточка-заглушка вместо результатов поиска
 * - Автоматический сброс авторизации при выходе из приложения
 * - Сброс авторизации при изменении настроек родительского контроля
 * 
 * Технические особенности:
 * - Полная совместимость с ES5 (работает на старых устройствах)
 * - Строгая проверка авторизации для предотвращения утечки результатов
 * 
 * Установка:
 * 
 * Для использования в Lampa:
 * В Лампа открыть "Настройки" → "Расширения" → "Добавить плагин"
 * И прописать: https://mylampa1.github.io/sisearch_pass.js
 * 
 * Для использования в Lampac:
 * Добавить в lampainit.js строку:
 * Lampa.Utils.putScriptAsync(["https://mylampa1.github.io/sisearch_pass.js"], function() {});
 * 
 * Поддержка автора:
 * Если есть желающие поддержать автора, пишите @Cheeze_l
 */
 
(function () {
  'use strict';

  if (window.sisiParentalControlLoaded) return;
  window.sisiParentalControlLoaded = true;
  window.sisiParentalAuthorized = false;

  var ICON = '<svg viewBox="-100 -121.5 400 486" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M187.714 130.727C206.862 90.1515 158.991 64.2019 100.983 64.2019C42.9759 64.2019 -4.33044 91.5669 10.875 130.727C26.0805 169.888 63.2501 235.469 100.983 234.997C138.716 234.526 168.566 171.303 187.714 130.727Z" stroke="white" stroke-width="15"/><path d="M102.11 62.3146C109.995 39.6677 127.46 28.816 169.692 24.0979C172.514 56.1811 135.338 64.2018 102.11 62.3146Z" stroke="white" stroke-width="15"/><path d="M90.8467 62.7863C90.2285 34.5178 66.0667 25.0419 31.7127 33.063C28.8904 65.1461 68.8826 62.7863 90.8467 62.7863Z" stroke="white" stroke-width="15"/><path d="M100.421 58.5402C115.627 39.6677 127.447 13.7181 85.2149 9C82.3926 41.0832 83.5258 35.4214 100.421 58.5402Z" stroke="white" stroke-width="15"/><rect x="39.0341" y="98.644" width="19.1481" height="30.1959" rx="9.57407" fill="white"/><rect x="90.8467" y="92.0388" width="19.1481" height="30.1959" rx="9.57407" fill="white"/><rect x="140.407" y="98.644" width="19.1481" height="30.1959" rx="9.57407" fill="white"/><rect x="116.753" y="139.22" width="19.1481" height="30.1959" rx="9.57407" fill="white"/><rect x="64.9404" y="139.22" width="19.1481" height="30.1959" rx="9.57407" fill="white"/><rect x="93.0994" y="176.021" width="19.1481" height="30.1959" rx="9.57407" fill="white"/></svg>';

  function isSisiSource(title) {
    return title === 'Клубничка' || title === 'Strawberry' || title === 'Полуничка' || title === '草莓';
  }

  function createAuthCard() {
    return {
      title: Lampa.Lang.translate('sisi_parental_control'),
      results: [{
        id: 'sisi_auth_card',
        title: Lampa.Lang.translate('sisi_parental_auth_required'),
        original_title: Lampa.Lang.translate('sisi_parental_click_pin'),
        overview: Lampa.Lang.translate('sisi_parental_pin_description'),
        custom_type: 'sisi_auth_required',
        img: 'data:image/svg+xml;base64,' + btoa(ICON),
        background_image: 'data:image/svg+xml;base64,' + btoa(ICON)
      }]
    };
  }

  function clearResults() {
    if (Lampa.Activity && Lampa.Activity.active() && Lampa.Activity.active().component === 'search') {
      var activity = Lampa.Activity.active().activity;
      if (activity && activity.render) {
        var render = activity.render();
        var results = render.find('.search-results');
        if (results.length) {
          results.empty();
        }
      }
    }
  }

  function wrapSisiSource(source) {
    var originalSearch = source.search;
    var lastParams = null;

    source.search = function (params, oncomplite) {
      lastParams = { params: params, oncomplite: oncomplite };

      if (!Lampa.Storage.field('parental_control') || window.sisiParentalAuthorized) {
        originalSearch.call(source, params, oncomplite);
        return;
      }

      clearResults();
      oncomplite([createAuthCard()]);
    };

    if (source.clear) {
      var originalClear = source.clear;
      source.clear = function () {
        if (Lampa.Storage.field('parental_control') && !window.sisiParentalAuthorized) {
          clearResults();
        }
        if (originalClear) originalClear.call(source);
      };
    }

    var originalOnSelect = source.onSelect;
    source.onSelect = function (params, close) {
      if (params.element && params.element.custom_type === 'sisi_auth_required') {
        if (close) close();
        setTimeout(function () {
          if (Lampa.ParentalControl && Lampa.ParentalControl.query) {
            Lampa.ParentalControl.query(function () {
              window.sisiParentalAuthorized = true;
              Lampa.Noty.show(Lampa.Lang.translate('sisi_parental_pin_accepted'));
              if (lastParams) {
                setTimeout(function () {
                  originalSearch.call(source, lastParams.params, lastParams.oncomplite);
                }, 300);
              }
            }, function () {
              Lampa.Noty.show(Lampa.Lang.translate('sisi_parental_pin_wrong'));
              if (lastParams) lastParams.oncomplite([createAuthCard()]);
            });
          }
        }, 100);
      } else if (originalOnSelect) {
        if (!Lampa.Storage.field('parental_control') || window.sisiParentalAuthorized) {
          originalOnSelect.call(source, params, close);
        } else {
          // Prevent any selection if not authorized
          if (close) close();
          Lampa.Noty.show(Lampa.Lang.translate('sisi_parental_auth_required'));

          if (Lampa.ParentalControl && Lampa.ParentalControl.query) {
            Lampa.ParentalControl.query(function () {
              window.sisiParentalAuthorized = true;
              Lampa.Noty.show(Lampa.Lang.translate('sisi_parental_pin_accepted'));
              originalOnSelect.call(source, params, close);
            }, function () {
              Lampa.Noty.show(Lampa.Lang.translate('sisi_parental_pin_wrong'));
            });
          }
        }
      }
    };
  }


  function interceptSearch() {
    var attempts = 0;
    var wait = setInterval(function () {
      if (Lampa.Search) {
        clearInterval(wait);

        if (Lampa.Search.addSource) {
          var originalAddSource = Lampa.Search.addSource;
          Lampa.Search.addSource = function (source) {
            if (source && isSisiSource(source.title)) {
              wrapSisiSource(source);
            }
            return originalAddSource.call(Lampa.Search, source);
          };
        } else {
          var _addSource = null;
          Object.defineProperty(Lampa.Search, 'addSource', {
            get: function () {
              return _addSource;
            },
            set: function (fn) {
              _addSource = function (source) {
                if (source && isSisiSource(source.title)) {
                  wrapSisiSource(source);
                }
                return fn.call(Lampa.Search, source);
              };
            },
            configurable: true
          });
        }
      } else if (++attempts >= 100) {
        clearInterval(wait);
      }
    }, 50);
  }

  function resetAuth() {
    if (Lampa.Listener) {
      Lampa.Listener.follow('app', function (e) {
        if (e.type === 'exit' || e.type === 'destroy') {
          window.sisiParentalAuthorized = false;
        }
      });
      Lampa.Listener.follow('activity', function (e) {
        if (e.type === 'start' && e.component !== 'search' && window.sisiParentalAuthorized) {
          window.sisiParentalAuthorized = false;
        }
      });
    }

    if (Lampa.Storage) {
      var originalSet = Lampa.Storage.set;
      Lampa.Storage.set = function (name, value) {
        if (name === 'parental_control') {
          window.sisiParentalAuthorized = false;
        }
        return originalSet.apply(this, arguments);
      };
    }
  }

  function addTranslations() {
    if (!Lampa.Lang) return;
    Lampa.Lang.add({
      sisi_parental_control: { ru: '🔒 Родительский контроль', uk: '🔒 Батьківський контроль', en: '🔒 Parental Control', be: '🔒 Бацькоўскі кантроль', zh: '🔒 家长控制' },
      sisi_parental_auth_required: { ru: 'Требуется авторизация', uk: 'Потрібна авторизація', en: 'Authorization required', be: 'Патрабуецца аўтарызацыя', zh: '需要授权' },
      sisi_parental_click_pin: { ru: 'Нажмите для ввода PIN-кода', uk: 'Натисніть для введення PIN-коду', en: 'Click to enter PIN code', be: 'Націсніце для ўводу PIN-кода', zh: '点击输入PIN码' },
      sisi_parental_pin_description: { ru: 'Для доступа к контенту необходимо ввести PIN-код', uk: 'Для доступу до контенту необхідно ввести PIN-код', en: 'Enter PIN code to access content', be: 'Для доступу да кантэнту неабходна ўвесці PIN-код', zh: '输入PIN码访问内容' },
      sisi_parental_pin_accepted: { ru: 'PIN-код принят. Повторите поиск', uk: 'PIN-код прийнято. Повторіть пошук', en: 'PIN accepted. Repeat search', be: 'PIN-код прыняты. Паўтарыце пошук', zh: 'PIN已接受。重复搜索' },
      sisi_parental_pin_wrong: { ru: 'Неверный PIN-код', uk: 'Невірний PIN-код', en: 'Wrong PIN', be: 'Няправільны PIN-код', zh: 'PIN错误' }
    });
  }

  function init() {
    if (!window.Lampa || !Lampa.Storage) {
      setTimeout(init, 100);
      return;
    }

    addTranslations();
    resetAuth();
    interceptSearch();
  }

  if (window.Lampa) {
    interceptSearch();
    init();
  } else {
    var waitLampa = setInterval(function () {
      if (window.Lampa) {
        clearInterval(waitLampa);
        interceptSearch();
        init();
      }
    }, 10);
  }

})();
