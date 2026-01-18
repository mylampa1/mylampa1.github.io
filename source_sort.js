/**
 * Плагин сортировки онлайн источников
 * Версия: 1.0.0
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

    // Polyfills для ES5
    if (!Array.prototype.filter) {
        Array.prototype.filter = function(callback, thisArg) {
            if (this == null) throw new TypeError('this is null or not defined');
            var O = Object(this);
            var len = O.length >>> 0;
            if (typeof callback !== 'function') throw new TypeError(callback + ' is not a function');
            var res = [];
            var T = thisArg;
            var k = 0;
            while (k < len) {
                if (k in O) {
                    var kValue = O[k];
                    if (callback.call(T, kValue, k, O)) res.push(kValue);
                }
                k++;
            }
            return res;
        };
    }

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(searchElement, fromIndex) {
            if (this == null) throw new TypeError('this is null or not defined');
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

    if (typeof Lampa === 'undefined') {
        console.error('Source Sort Plugin: Lampa не найдена');
        return;
    }

    var STORAGE_KEY_SORT = 'online_source_sort_type';
    var STORAGE_KEY_HIDE = 'online_source_hide_unavailable';
    var STORAGE_KEY_BUTTON = 'online_source_sort_button_enabled';
    
    var SORT_TYPES = {
        DEFAULT: 'default',
        ALPHABET: 'alphabet',
        QUALITY: 'quality'
    };

    var SORT_ICON_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" fill="currentColor"/></svg>';

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
        source_sort_button_enabled: {ru: 'Кнопка сортировки показана', uk: 'Кнопка сортування показана', en: 'Sort button shown', be: 'Кнопка сартавання паказана', zh: '排序按钮已显示'},
        source_sort_button_disabled: {ru: 'Кнопка сортировки скрыта', uk: 'Кнопка сортування прихована', en: 'Sort button hidden', be: 'Кнопка сартавання схавана', zh: '排序按钮已隐藏'}
    });

    function getTranslation(key) {
        return Lampa.Lang.translate(key);
    }

    function getSortType() {
        return Lampa.Storage.get(STORAGE_KEY_SORT, SORT_TYPES.DEFAULT);
    }

    function setSortType(type) {
        Lampa.Storage.set(STORAGE_KEY_SORT, type);
    }

    function getHideUnavailable() {
        return Lampa.Storage.get(STORAGE_KEY_HIDE, false);
    }

    function setHideUnavailable(value) {
        Lampa.Storage.set(STORAGE_KEY_HIDE, value);
    }

    function getButtonEnabled() {
        return Lampa.Storage.get(STORAGE_KEY_BUTTON, true);
    }

    function setButtonEnabled(value) {
        Lampa.Storage.set(STORAGE_KEY_BUTTON, value);
    }

    function extractQuality(name) {
        if (!name) return 0;
        var nameUpper = name.toUpperCase();
        if (nameUpper.indexOf('4K') !== -1 || nameUpper.indexOf('UHD') !== -1 || nameUpper.indexOf('2160') !== -1) return 2160;
        var qualityMatch = name.match(/(\d{3,4})[pP]?/);
        if (qualityMatch) return parseInt(qualityMatch[1], 10);
        if (nameUpper.indexOf('FULLHD') !== -1 || nameUpper.indexOf('FHD') !== -1) return 1080;
        if (nameUpper.indexOf('HD') !== -1) return 720;
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
            available[j]._originalIndex = j;
        }
        
        available.sort(function(a, b) {
            var qualityA = extractQuality(a.title || '');
            var qualityB = extractQuality(b.title || '');
            if (qualityB !== qualityA) return qualityB - qualityA;
            return a._originalIndex - b._originalIndex;
        });
        
        for (var k = 0; k < available.length; k++) {
            delete available[k]._originalIndex;
        }
        
        return available.concat(unavailable);
    }

    function applySorting(sources, sortType) {
        if (!sources || !sources.length) return sources;
        var sortedSources = sources.slice();
        
        if (sortType === SORT_TYPES.ALPHABET) return sortByAlphabet(sortedSources);
        if (sortType === SORT_TYPES.QUALITY) return sortByQuality(sortedSources);
        
        var available = [];
        var unavailable = [];
        for (var i = 0; i < sortedSources.length; i++) {
            if (sortedSources[i].ghost) unavailable.push(sortedSources[i]);
            else available.push(sortedSources[i]);
        }
        return available.concat(unavailable);
    }

    function filterUnavailable(sources) {
        if (!getHideUnavailable()) return sources;
        return sources.filter(function(source) {
            return !source.ghost;
        });
    }

    function showSourceMenu(onUpdate) {
        var currentSort = getSortType();
        var currentHide = getHideUnavailable();
        
        var sortTitle = currentSort === SORT_TYPES.ALPHABET ? getTranslation('source_sort_alphabet') :
                       currentSort === SORT_TYPES.QUALITY ? getTranslation('source_sort_quality') :
                       getTranslation('source_sort_default');
        
        var hideTitle = currentHide ? getTranslation('source_sort_yes') : getTranslation('source_sort_no');
        
        Lampa.Select.show({
            title: getTranslation('source_sort_title'),
            items: [
                {title: getTranslation('source_sort_sorting'), subtitle: sortTitle, value: 'sorting'},
                {title: getTranslation('source_sort_hide_unavailable'), subtitle: hideTitle, value: 'hide'}
            ],
            onSelect: function(item) {
                if (item.value === 'sorting') {
                    Lampa.Select.close();
                    setTimeout(function() { showSortingMenu(onUpdate); }, 50);
                } else {
                    setHideUnavailable(!getHideUnavailable());
                    if (onUpdate) onUpdate();
                    Lampa.Select.close();
                }
            }
        });
    }

    function showSortingMenu(onUpdate) {
        var currentSort = getSortType();
        
        Lampa.Select.show({
            title: getTranslation('source_sort_sorting'),
            items: [
                {title: getTranslation('source_sort_default'), subtitle: getTranslation('source_sort_default_desc'), value: SORT_TYPES.DEFAULT, selected: currentSort === SORT_TYPES.DEFAULT},
                {title: getTranslation('source_sort_alphabet'), subtitle: getTranslation('source_sort_alphabet_desc'), value: SORT_TYPES.ALPHABET, selected: currentSort === SORT_TYPES.ALPHABET},
                {title: getTranslation('source_sort_quality'), subtitle: getTranslation('source_sort_quality_desc'), value: SORT_TYPES.QUALITY, selected: currentSort === SORT_TYPES.QUALITY}
            ],
            onSelect: function(item) {
                setSortType(item.value);
                if (onUpdate) onUpdate(item.value);
                Lampa.Select.close();
            }
        });
    }

    function addSourceButton(filterElement, onUpdate) {
        if (!filterElement || !filterElement.length) return;
        var sortButtonElement = filterElement.find('.filter--sort');
        if (!sortButtonElement.length || !getButtonEnabled() || filterElement.find('.source-sort-button').length > 0) return;

        var button = $('<div class="simple-button selector source-sort-button" style="padding: 0; width: 3em; display: flex; align-items: center; justify-content: center;">' + SORT_ICON_SVG + '</div>');
        
        button.on('hover:enter', function() { showSourceMenu(onUpdate); });
        button.on('hover:focus', function() { button.addClass('focus'); });
        button.on('hover:blur', function() { button.removeClass('focus'); });

        sortButtonElement.after(button);
        
        setTimeout(function() {
            if (Lampa.Controller && typeof Lampa.Controller.toggle === 'function') {
                try { Lampa.Controller.toggle('content'); } catch(e) {}
            }
        }, 100);
    }

    function patchFilterSet() {
        var OriginalFilter = Lampa.Filter;
        if (!OriginalFilter) return;

        Lampa.Filter = function(object) {
            var filter = new OriginalFilter(object);
            var originalSet = filter.set;
            var originalRender = filter.render;
            var filterElement = null;
            var originalSources = null;
            var lastProcessedLength = 0;

            filter.render = function() {
                filterElement = originalRender.apply(this, arguments);
                return filterElement;
            };

            filter.set = function(type, items) {
                if (type === 'sort' && items && items.length) {
                    if (!originalSources || items.length !== lastProcessedLength) {
                        originalSources = items.slice();
                        lastProcessedLength = items.length;
                    }
                    
                    var sortType = getSortType();
                    var processedItems = applySorting(items.slice(), sortType);
                    processedItems = filterUnavailable(processedItems);
                    
                    originalSet.call(this, type, processedItems);
                    
                    var self = this;
                    setTimeout(function() {
                        if (filterElement) {
                            addSourceButton(filterElement, function(newSortType) {
                                var currentOriginal = originalSources.slice();
                                var newSortedItems = applySorting(currentOriginal, newSortType || getSortType());
                                newSortedItems = filterUnavailable(newSortedItems);
                                originalSet.call(self, type, newSortedItems);
                                
                                setTimeout(function() {
                                    if (Lampa.Controller && typeof Lampa.Controller.toggle === 'function') {
                                        try { Lampa.Controller.toggle('content'); } catch(e) {}
                                    }
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

        for (var key in OriginalFilter) {
            if (OriginalFilter.hasOwnProperty(key)) {
                Lampa.Filter[key] = OriginalFilter[key];
            }
        }

        Lampa.Filter.prototype = OriginalFilter.prototype;
    }

    function init() {
        console.log('Source Sort Plugin: v2.1.0');
        
        patchFilterSet();
        
        if (Lampa.SettingsApi) {
            Lampa.SettingsApi.addParam({
                component: 'interface',
                param: {
                    name: 'online_source_sort_button_enabled',
                    type: 'trigger',
                    default: true
                },
                field: {
                    name: getTranslation('source_sort_button_show')
                },
                onChange: function(value) {
                    setTimeout(function() {
                        var currentValue = getButtonEnabled();
                        if (currentValue) {
                            $('.source-sort-button').show();
                            Lampa.Noty.show(getTranslation('source_sort_button_enabled'));
                        } else {
                            $('.source-sort-button').hide();
                            Lampa.Noty.show(getTranslation('source_sort_button_disabled'));
                        }
                    }, 100);
                },
                onRender: function(element) {
                    setTimeout(function() {
                        var reactionsParam = $('div[data-name="card_interfice_reactions"]');
                        if (reactionsParam.length) {
                            reactionsParam.after(element);
                        } else {
                            var interfaceSizeParam = $('div[data-name="interface_size"]');
                            if (interfaceSizeParam.length) interfaceSizeParam.after(element);
                        }
                    }, 0);
                }
            });
        }
    }

    if (window.Lampa) {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            if (window.Lampa) init();
        });
    }

})();
