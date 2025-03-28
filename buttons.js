// Версия плагина: 0.1 Alpha

// Плагин изменяет порядок отображения кнопок на странице. Кнопки будут отображаться в следующем порядке:
// - Онлайн-кнопки
// - Торрент-кнопки
// - Кнопки трейлеров
// - Все остальные кнопки

// В процессе работы плагин очищает параметр 'full_btn_priority'.
// После удаления плагина этот параметр должен восстановиться.



Lampa.Platform.tv();

(function () {
    'use strict';

    function startPlugin() {

        // Проверяем, есть ли full_btn_priority в Storage
        if (Lampa.Storage.get('full_btn_priority') !== undefined) {
            // Устанавливаем full_btn_priority в пустой объект только если он уже был
            Lampa.Storage.set('full_btn_priority', '{}');
        }

        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') {
                setTimeout(function () {
                    var fullContainer = e.object.activity.render();
                    var targetContainer = fullContainer.find('.full-start-new__buttons');

                    fullContainer.find('.button--play').remove();

                    var allButtons = fullContainer.find('.buttons--container .full-start__button')
                        .add(targetContainer.find('.full-start__button'));

                    // Определяем категории кнопок по наличию слов в классах
                    var onlineButtons = allButtons.filter(function () {
                        return $(this).attr('class').includes('online');
                    });
                    var torrentButtons = allButtons.filter(function () {
                        return $(this).attr('class').includes('torrent');
                    });
                    var trailerButtons = allButtons.filter(function () {
                        return $(this).attr('class').includes('trailer');
                    });

                    // Создаем массив порядка кнопок
                    var buttonOrder = [];

                    // Добавляем все online-кнопки
                    onlineButtons.each(function () {
                        buttonOrder.push($(this));
                    });

                    // Добавляем все torrent-кнопки
                    torrentButtons.each(function () {
                        buttonOrder.push($(this));
                    });

                    // Добавляем все trailer-кнопки
                    trailerButtons.each(function () {
                        buttonOrder.push($(this));
                    });

                    // Обрабатываем все остальные кнопки с клонированием
                    allButtons.filter(function () {
                        return !$(this).attr('class').includes('online') &&
                               !$(this).attr('class').includes('torrent') &&
                               !$(this).attr('class').includes('trailer');
                    }).each(function () {
                        var $clone = $(this).clone(true); // Клонируем с событиями
                        buttonOrder.push($clone);
                    });

                    // Очищаем и заполняем контейнер
                    targetContainer.empty();
                    buttonOrder.forEach(function ($button) {
                        targetContainer.append($button);
                    });

                    // Включаем "full_start" после выполнения
                    Lampa.Controller.toggle("full_start");

                }, 100); // Таймаут 100 мс для стабильности
            }
        });

        if (typeof module !== 'undefined' && module.exports) {
            module.exports = {};
        }
    }

    startPlugin();
})();
