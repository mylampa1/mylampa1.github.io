/**
 * Плагин сортировки онлайн источников
 * Версия: 1.0.1
 * Автор: @Cheeze_l
 * 
 * Описание:
 * Плагин для сортировки и фильтрации источников (балансеров) в онлайн-плагинах Lampa.
 * Добавляет кнопку управления источниками рядом с кнопкой выбора источника.
 * 
 * Возможности:
 * - Три типа сортировки источников:
 *   • Стандартная: порядок от сервера
 *   • По алфавиту: от А до Я
 *   • По качеству: от лучшего к худшему (4K → 1080p → 720p → 480p)
 * - Скрытие недоступных источников
 * - Настройка отображения кнопки через меню "Интерфейс"
 * - Автоматическое сохранение настроек в localStorage
 * 
 * Установка:
 * 
 * Для использования в Lampa:
 * В Лампа открыть "Настройки" → "Расширения" → "Добавить плагин"
 * И прописать: https://mylampa1.github.io/source_sort.js
 * 
 * Для использования в Lampac:
 * Добавить в lampainit.js строку:
 * Lampa.Utils.putScriptAsync(["https://mylampa1.github.io/source_sort.js"], function() {});
 * 
 * Поддержка автора:
 * Если есть желающие поддержать автора, пишите @Cheeze_l
 */

(function() {
    'use strict';

    if (!Array.prototype.filter) {
        Array.prototype.filter = function(callback, thisArg) {
            if (this == null) throw new TypeError();
            var O = Object(this);
            var len = O.length >>> 0;
            if (typeof callback !== 'function') throw new TypeError();
            var res = [];
            var k = 0;
            while (k < len) {
                if (k in O) {
                    var kValue = O[k];
                    if (callback.call(thisArg, kValue, k, O)) res.push(kValue);
                }
                k++;
            }
            return res;
        };
    }

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(searchElement, fromIndex) {
            if (this == null) throw new TypeError();
            var O = Object(this);
            var len = O.length >>> 0;
            if (len === 0) return -1;
            var n = fromIndex | 0;
            if (n >= len) return -1;
            var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
            while (k < len) {
                if (k in O && O[k] === searchElement) return k;
                k++;
            }
            return -1;
        };
    }

    if (typeof Lampa === 'undefined') return;

    var SORT_KEY = 'online_source_sort_type';
    var HIDE_KEY = 'online_source_hide_unavailable';
    var BTN_KEY = 'online_source_sort_button_enabled';
    
    var TYPES = {
        DEFAULT: 'default',
        ALPHABET: 'alphabet',
        QUALITY: 'quality'
    };

    var ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" fill="currentColor"/></svg>';

    Lampa.Lang.add({
        source_sort_title: {ru: 'Управление источниками', uk: 'Керування джерелами', en: 'Source management', be: 'Кіраванне крыніцамі', zh: '源管理'},
        source_sort_sorting: {ru: 'Сортировка', uk: 'Сортування', en: 'Sorting', be: 'Сартаванне', zh: '排序'},
        source_sort_hide_unavailable: {ru: 'Скрывать недоступные', uk: 'Приховувати недоступні', en: 'Hide unavailable', be: 'Хаваць недаступныя', zh: '隐藏不可用'},
        source_sort_default: {ru: 'Стандартная', uk: 'Стандартна', en: 'Default', be: 'Стандартная', zh: '默认'},
        source_sort_default_desc: {ru: 'Порядок от сервера', uk: 'Порядок від сервера', en: 'Server order', be: 'Парадак ад сервера', zh: '服务器顺序'},
        source_sort_alphabet: {ru: 'По алфавиту', uk: 'За алфавітом', en: 'Alphabetical', be: 'Па алфавіце', zh: '按字母顺序'},
        source_sort_alphabet_desc: {ru: 'От А до Я', uk: 'Від А до Я', en: 'A to Z', be: 'Ад А да Я', zh: '从A到Z'},
        source_sort_quality: {ru: 'По качеству', uk: 'За якістю', en: 'By quality', be: 'Па якасці', zh: '按质量'},
        source_sort_quality_desc: {ru: 'От лучшего к худшему', uk: 'Від кращого до гіршого', en: 'Best to worst', be: 'Ад лепшага да горшага', zh: '从最好到最差'},
        source_sort_yes: {ru: 'Да', uk: 'Так', en: 'Yes', be: 'Так', zh: '是'},
        source_sort_no: {ru: 'Нет', uk: 'Ні', en: 'No', be: 'Не', zh: '否'},
        source_sort_button_show: {ru: 'Кнопка сортировки источников', uk: 'Кнопка сортування джерел', en: 'Source sort button', be: 'Кнопка сартавання крыніц', zh: '源排序按钮'},
        source_sort_button_enabled: {ru: 'Кнопка показана', uk: 'Кнопка показана', en: 'Button shown', be: 'Кнопка паказана', zh: '按钮已显示'},
        source_sort_button_disabled: {ru: 'Кнопка скрыта', uk: 'Кнопка прихована', en: 'Button hidden', be: 'Кнопка схавана', zh: '按钮已隐藏'}
    });

    function extractQuality(name) {
        if (!name) return 0;
        var upper = name.toUpperCase();
        if (upper.indexOf('4K') !== -1 || upper.indexOf('UHD') !== -1 || upper.indexOf('2160') !== -1) return 2160;
        var match = name.match(/(\d{3,4})[pP]?/);
        if (match) return parseInt(match[1], 10);
        if (upper.indexOf('FULLHD') !== -1 || upper.indexOf('FHD') !== -1) return 1080;
        if (upper.indexOf('HD') !== -1) return 720;
        return 0;
    }

    function sortByAlphabet(sources) {
        var available = [];
        var unavailable = [];
        
        for (var i = 0; i < sources.length; i++) {
            if (sources[i].ghost) unavailable.push(sources[i]);
            else available.push(sources[i]);
        }
        
        available.sort(function(a, b) {
            var nameA = (a.title || '').toLowerCase();
            var nameB = (b.title || '').toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
        
        return available.concat(unavailable);
    }

    function sortByQuality(sources) {
        var available = [];
        var unavailable = [];
        
        for (var i = 0; i < sources.length; i++) {
            if (sources[i].ghost) unavailable.push(sources[i]);
            else available.push(sources[i]);
        }
        
        for (var j = 0; j < available.length; j++) {
            available[j]._idx = j;
        }
        
        available.sort(function(a, b) {
            var qA = extractQuality(a.title || '');
            var qB = extractQuality(b.title || '');
            if (qB !== qA) return qB - qA;
            return a._idx - b._idx;
        });
        
        for (var k = 0; k < available.length; k++) {
            delete available[k]._idx;
        }
        
        return available.concat(unavailable);
    }

    function applySorting(sources, sortType) {
        if (!sources || !sources.length) return sources;
        var sorted = sources.slice();
        
        if (sortType === TYPES.ALPHABET) return sortByAlphabet(sorted);
        if (sortType === TYPES.QUALITY) return sortByQuality(sorted);
        
        var available = [];
        var unavailable = [];
        for (var i = 0; i < sorted.length; i++) {
            if (sorted[i].ghost) unavailable.push(sorted[i]);
            else available.push(sorted[i]);
        }
        return available.concat(unavailable);
    }

    function filterUnavailable(sources) {
        if (!Lampa.Storage.get(HIDE_KEY, false)) return sources;
        return sources.filter(function(s) { return !s.ghost; });
    }

    function showSourceMenu(onUpdate) {
        var sortType = Lampa.Storage.get(SORT_KEY, TYPES.DEFAULT);
        var hideEnabled = Lampa.Storage.get(HIDE_KEY, false);
        
        var sortTitle = sortType === TYPES.ALPHABET ? Lampa.Lang.translate('source_sort_alphabet') :
                       sortType === TYPES.QUALITY ? Lampa.Lang.translate('source_sort_quality') :
                       Lampa.Lang.translate('source_sort_default');
        
        var hideTitle = hideEnabled ? Lampa.Lang.translate('source_sort_yes') : Lampa.Lang.translate('source_sort_no');
        
        Lampa.Select.show({
            title: Lampa.Lang.translate('source_sort_title'),
            items: [
                {title: Lampa.Lang.translate('source_sort_sorting'), subtitle: sortTitle, value: 'sorting'},
                {title: Lampa.Lang.translate('source_sort_hide_unavailable'), subtitle: hideTitle, value: 'hide'}
            ],
            onSelect: function(item) {
                if (item.value === 'sorting') {
                    Lampa.Select.close();
                    setTimeout(function() { showSortingMenu(onUpdate); }, 50);
                } else {
                    Lampa.Storage.set(HIDE_KEY, !Lampa.Storage.get(HIDE_KEY, false));
                    if (onUpdate) onUpdate();
                    Lampa.Select.close();
                }
            },
            onBack: function() {
                Lampa.Controller.toggle('content');
            }
        });
    }

    function showSortingMenu(onUpdate) {
        var current = Lampa.Storage.get(SORT_KEY, TYPES.DEFAULT);
        
        Lampa.Select.show({
            title: Lampa.Lang.translate('source_sort_sorting'),
            items: [
                {title: Lampa.Lang.translate('source_sort_default'), subtitle: Lampa.Lang.translate('source_sort_default_desc'), value: TYPES.DEFAULT, selected: current === TYPES.DEFAULT},
                {title: Lampa.Lang.translate('source_sort_alphabet'), subtitle: Lampa.Lang.translate('source_sort_alphabet_desc'), value: TYPES.ALPHABET, selected: current === TYPES.ALPHABET},
                {title: Lampa.Lang.translate('source_sort_quality'), subtitle: Lampa.Lang.translate('source_sort_quality_desc'), value: TYPES.QUALITY, selected: current === TYPES.QUALITY}
            ],
            onSelect: function(item) {
                Lampa.Storage.set(SORT_KEY, item.value);
                if (onUpdate) onUpdate(item.value);
                Lampa.Select.close();
            },
            onBack: function() {
                Lampa.Controller.toggle('content');
            }
        });
    }

    function addButton(filterElement, onUpdate) {
        if (!filterElement || !filterElement.length) return;
        var sortBtn = filterElement.find('.filter--sort');
        if (!sortBtn.length || !Lampa.Storage.get(BTN_KEY, true) || filterElement.find('.source-sort-button').length) return;

        var btn = $('<div class="simple-button selector source-sort-button" style="padding:0;width:3em;display:flex;align-items:center;justify-content:center">' + ICON + '</div>');
        
        btn.on('hover:enter', function() { showSourceMenu(onUpdate); });
        btn.on('hover:focus', function() { btn.addClass('focus'); });
        btn.on('hover:blur', function() { btn.removeClass('focus'); });

        sortBtn.after(btn);
        
        setTimeout(function() {
            try { Lampa.Controller.toggle('content'); } catch(e) {}
        }, 100);
    }

    function patchFilter() {
        var Original = Lampa.Filter;
        if (!Original) return;

        Lampa.Filter = function(object) {
            var filter = new Original(object);
            var originalSet = filter.set;
            var originalRender = filter.render;
            var filterEl = null;
            var originalSrc = null;
            var lastLen = 0;

            filter.render = function() {
                filterEl = originalRender.apply(this, arguments);
                return filterEl;
            };

            filter.set = function(type, items) {
                if (type === 'sort' && items && items.length) {
                    if (!originalSrc || items.length !== lastLen) {
                        originalSrc = items.slice();
                        lastLen = items.length;
                    }
                    
                    var sortType = Lampa.Storage.get(SORT_KEY, TYPES.DEFAULT);
                    var processed = applySorting(items.slice(), sortType);
                    processed = filterUnavailable(processed);
                    
                    originalSet.call(this, type, processed);
                    
                    var self = this;
                    setTimeout(function() {
                        if (filterEl) {
                            addButton(filterEl, function(newType) {
                                var current = originalSrc.slice();
                                var sorted = applySorting(current, newType || Lampa.Storage.get(SORT_KEY, TYPES.DEFAULT));
                                sorted = filterUnavailable(sorted);
                                originalSet.call(self, type, sorted);
                                
                                setTimeout(function() {
                                    try { Lampa.Controller.toggle('content'); } catch(e) {}
                                }, 100);
                            });
                        }
                    }, 100);
                } else {
                    originalSet.apply(this, arguments);
                }
            };

            return filter;
        };

        for (var key in Original) {
            if (Original.hasOwnProperty(key)) {
                Lampa.Filter[key] = Original[key];
            }
        }

        Lampa.Filter.prototype = Original.prototype;
    }

    function init() {
        patchFilter();
        
        if (Lampa.SettingsApi) {
            Lampa.SettingsApi.addParam({
                component: 'interface',
                param: {
                    name: 'online_source_sort_button_enabled',
                    type: 'trigger',
                    default: true
                },
                field: {
                    name: Lampa.Lang.translate('source_sort_button_show')
                },
                onChange: function() {
                    setTimeout(function() {
                        var enabled = Lampa.Storage.get(BTN_KEY, true);
                        if (enabled) {
                            $('.source-sort-button').show();
                            Lampa.Noty.show(Lampa.Lang.translate('source_sort_button_enabled'));
                        } else {
                            $('.source-sort-button').hide();
                            Lampa.Noty.show(Lampa.Lang.translate('source_sort_button_disabled'));
                        }
                    }, 100);
                },
                onRender: function(element) {
                    setTimeout(function() {
                        var reactions = $('div[data-name="card_interfice_reactions"]');
                        if (reactions.length) {
                            reactions.after(element);
                        } else {
                            var interfaceSize = $('div[data-name="interface_size"]');
                            if (interfaceSize.length) interfaceSize.after(element);
                        }
                    }, 0);
                }
            });
        }
    }

    if (window.Lampa) init();
    else document.addEventListener('DOMContentLoaded', function() { if (window.Lampa) init(); });

})();
