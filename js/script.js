(function() {

    var now = new Date(2016, 10, 1);

    var contentElem = document.querySelector(".container");
    var scheduleElem = document.querySelector(".schedule");
    var schoolSelectElem = document.querySelector("#school");
    var lecturerSelectElem = document.querySelector("#lecturer");
    var dateSelectElem = document.querySelector("#date");


    // рендерим список преподавателей и лекции
    renderLecturers(lecturerSelectElem);
    var filteredLectures = filterLectures();
    renderLectures(scheduleElem, filteredLectures);


    // вешаем обработчики на все селекты
    [schoolSelectElem, lecturerSelectElem, dateSelectElem].forEach(function(selectElem) {
        selectElem.addEventListener("change", function(event) {
            event.preventDefault();
            var filteredLectures = filterLectures(schoolSelectElem, lecturerSelectElem, dateSelectElem);
            renderLectures(scheduleElem, filteredLectures);
        });

        // разворачиваем select icon на 180*
        selectElem.onmouseup = function() {
            this.parentElement.classList.toggle('focused');
        };

        // возвращаем select icon в исходное положение
        selectElem.onblur = function() {
            this.parentElement.classList.remove('focused');
        };

    });


    /**
     * @calendar
     * @description Инициализируем custom-ый datepicker
     */
    function DatePicker(el) {
        this.el = el;
        this.dateControl = el.querySelector('[name=date]');
        this.pickerIcon = el.querySelector(".field__icon_calendar");
        this.clearIcon = el.querySelector(".field__icon_clear");

        this.init = function() {
            this.dateControl.setAttribute("readonly", "readonly");
            this.initCustomDatePicker();
        },
        this.setValue = function(datePicker) {
            this.dateControl.value = formatDate(datePicker.getDate());
            this.pickerIcon.classList.add("field__icon_hidden");
            this.clearIcon.classList.remove("field__icon_hidden");
        },
        this.clearValue = function(datePicker) {
            datePicker.setDate(null);
            this.clearIcon.classList.add("field__icon_hidden");
            this.pickerIcon.classList.remove("field__icon_hidden");
        },
        this.initCustomDatePicker = function(datePicker) {
            var datePicker = new Pikaday({
                field: this.dateControl,
                firstDay: 1,
                i18n: {
                    previousMonth: 'Предыдущий',
                    nextMonth: 'Следующий',
                    months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
                    weekdays: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
                    weekdaysShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
                },
                onSelect: () => this.setValue(datePicker)
            });

            this.pickerIcon.addEventListener("click", () => datePicker.show());
            this.clearIcon.addEventListener("click", () => this.clearValue(datePicker));
        }
    }

    function leadZero(num) {
        return num < 10 ? '0' + num : num;
    }

    function formatDate(date) {
        var year = date.getFullYear(),
            month = date.getMonth() + 1,
            day = date.getDate();
            hours = date.getUTCHours();
            minutes = date.getUTCMinutes();

        return [leadZero(day), leadZero(month),year].join('.');
    }


    var calendar = new DatePicker(document.querySelector(".date-field"));
    calendar.init();

    /**
     * Функция фильтрует данные на основе активных фильтров.
     * @param schoolSelectElem {Element} Выпадающий список со школами.
     * @param lecturerSelectElem {Element} Выпадающий список с преподавателями.
     * @param dateSelectElem {Element} Datepicker.
     * @returns {Array} Массив отфильтрованных лекций.
     */
    function filterLectures() {
        var lectures = window.lectures;


        // фильтрация по школе
        var schoolValue = schoolSelectElem.value;

        if (schoolValue !== "all") {

            lectures = lectures.filter(function(lecture) {
                var flag = false;
                lecture.schools.forEach(function(school) {
                    if (school === schoolValue) {
                        flag = true;
                    }
                });
                return flag;
            });
        }

        // фильтрация по дате
        if (dateSelectElem.value) {
            var dateValue = formatDate(new Date(Date.parse(dateSelectElem.value)));

            lectures = lectures.filter(function(lecture) {
                var flag = false;

                if (dateValue && formatDate(new Date(Date.parse(lecture.datetime))) === dateValue) {
                    flag = true;
                }

                return flag;
            });
        }

        // сортировка по убыванию даты
        lectures = sortByDate(lectures).reverse();


        // сортировка по преподавателю
        var lecturerValue = lecturerSelectElem.value;

        if (lecturerValue !== "all") {

            lectures = lectures.filter(function(lecture) {
                var flag = false;
                lecture.lecturers.forEach(function(lecturer) {
                    if (lecturer === lecturerValue) {
                        flag = true;
                    }
                });
                return flag;
            });
        }

        return lectures;
    }



    /**
     * Функция рендерит расписание на основе переданного массива лекций.
     * @param scheduleElem {Element} Элемент расписания на странице.
     * @param lectures {Array} Массив лекций.
     */
    function renderLectures(scheduleElem, lectures) {
        var lecturesElem = scheduleElem.querySelector(".schedule__lectures");
        var noResultsElem = scheduleElem.querySelector(".schedule__not-found");

        lecturesElem.innerHTML = "";

        if (lectures.length !== 0) {

            noResultsElem.classList.add("schedule__not-found--hidden");

            var fragment = document.createDocumentFragment();

            lectures.forEach(function (rawLectureData) {
                var lectureData = {};
                date = new Date(Date.parse(rawLectureData.datetime));
                lectureData.datetime = formatDate(date)+ ", "+[leadZero(date.getUTCHours()),leadZero(date.getUTCMinutes())].join(':');
                lectureData.name = rawLectureData.name;
                lectureData.room = rawLectureData.room;

                lectureData.schools = [];
                rawLectureData.schools.forEach(function(schoolName) {
                    lectureData.schools.push({
                        name: window.schools[schoolName]
                    });
                });

                lectureData.lecturers = [];
                rawLectureData.lecturers.forEach(function(lecturerName) {
                    var lecturer = window.lecturers[lecturerName];
                    lecturer.imgFileName = lecturerName;
                    lecturer.id = lecturerName;
                    lectureData.lecturers.push(lecturer);
                });

                // если лекция прошла
                if (new Date(Date.parse(rawLectureData.datetime)) < now) {
                    lectureData.materials = true;
                } else {
                    lectureData.date = true;
                }

                var lectureElement = getElementFromTemplate(lectureData);
                fragment.appendChild(lectureElement);
            });

            lecturesElem.appendChild(fragment);

            createPopupEvents();

        } else {
            noResultsElem.classList.remove("schedule__not-found--hidden");
        }
    }


    function showLecturerPopup(lecturerId, clickPos) {
        var popup = contentElem.querySelector(".popup");
        popup.innerHTML = "";

        var fragment = document.createDocumentFragment();

        var popupData = {};

        popupData.name = window.lecturers[lecturerId].name;
        popupData.imgFileName = window.lecturers[lecturerId].imgFileName;
        popupData.about = window.lecturers[lecturerId].about;


        var popupBlock = getPopupFromTemplate(popupData);
        fragment.appendChild(popupBlock);

        popup.appendChild(fragment);

        popup.style.left = window.pageXOffset + clickPos['x']+'px';
        popup.style.top = window.pageYOffset + clickPos['y']+'px';

        var closePopup = document.querySelector(".lecturer-popup__close");
        closePopup.addEventListener("click", function(event) {
            var lecturerPopupElem = this.parentElement.parentElement;
            lecturerPopupElem.classList.toggle("lecturer-popup--hidden");
        });
    }


    /**
     * Добавляет в выпадающий список всех преподавателей.
     * @param lecturerSelectElem {Element} Элемент выпадающего списка с преподавателями.
     */
    function renderLecturers(lecturerSelectElem) {
        var fragment = document.createDocumentFragment();

        var allOption = document.createElement("option");
        allOption.value = "all";
        allOption.innerHTML = "Все лекторы";
        fragment.appendChild(allOption);

        Object.keys(window.lecturers).forEach(function(lecturerName) {
            var currentOption = document.createElement("option");
            currentOption.value = lecturerName;
            currentOption.innerHTML = window.lecturers[lecturerName].name;
            fragment.appendChild(currentOption);
        });

        lecturerSelectElem.appendChild(fragment);
    }



    /**
     * Функция возвращает массив лекций, отсортированных по возрастанию даты.
     * @param lectures {Array} Массив лекций.
     * @returns {Array} Отсортированный массив лекций.
     */
    function sortByDate(lectures) {
        return lectures.sort(function(firstLecture, secondLecture) {
            var firstLectureDate = Date.parse(firstLecture.datetime);
            var secondLectureDate = Date.parse(secondLecture.datetime);

            return firstLectureDate - secondLectureDate;
        });
    }


    /**
     * Функция создаёт элемент на основе шаблона лекции и переданных данных.
     * @param data {Object} Объект, который описывает лекцию.
     * @returns {Element} Элемент, созданный по шаблону лекции.
     */
    function getElementFromTemplate(data) {
        var element = document.createElement('div');

        element.classList.add("lecture");
        if (data.materials) {
            element.classList.add("lecture--is-over");
        }

        element.innerHTML = Mustache.render(document.querySelector("#lecture-layout").innerHTML, data);

        return element;
    }

    /**
     * Функция создаёт элемент на основе шаблона popup и переданных данных.
     * @param data {Object} Объект, который описывает popup.
     * @returns {Element} Элемент, созданный по шаблону popup.
     */
    function getPopupFromTemplate(data) {
        var element = document.createElement('div');
            element.classList.add("lecturer-popup");

        element.innerHTML = Mustache.render(document.querySelector("#popup-layout").innerHTML, data);

        return element;
    }



    /**
     * Функция создаёт события для всплывающих окон с информацией о преподавателях
     * и привязывает их к необходимым объектам на странице. Вызывается после того,
     * как выполнится очередной рендер расписания.
     */
    function createPopupEvents() {

        var lecturerNameElems = document.querySelectorAll(".lecture__lecturer-name");

        for (var i = 0; i < lecturerNameElems.length; i++) {
            lecturerNameElems[i].addEventListener("click", function(event) {
                var clickPos = {x: event.clientX-60, y: event.clientY};
                showLecturerPopup(this.id, clickPos);
            });
        }

    }

})();