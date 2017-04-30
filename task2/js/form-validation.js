/**
 * validateForm - проверяем формы добавления или редактирования лекции
 * @param form - элемент формы
 * @param lectureEdit(optional) - если данные лекции редактируются - передаем объект данных редактируемой лекции
 * **/
function validateForm(form, lectureEdit) {
    // очищаем все поля с информацией об ошибках ввода
    for (var i = 0; i < form.querySelectorAll('.error').length; i++) {
        var error = form.querySelectorAll('.error')[i];
        error.innerText = '';
        error.style.visibility = 'hidden';
    }
    var formValid = true,
        selectSchools = form.querySelectorAll('.lecture-add__schools option'),
        date = document.querySelector('.lecture-add__date').value,
        d = new Date(date),
        startTimeHours = document.querySelector('.lecture-add__time-start-hours').value,
        startTimeMinutes = document.querySelector('.lecture-add__time-start-minutes').value,
        location = form.querySelector('.lecture-add__rooms').value,
        speaker = form.querySelector('.lecture-add__lecturers').value,
        studentsCount = 0;
    d.setHours(startTimeHours);
    d.setMinutes(startTimeMinutes);

    // проверяем, что введенная дата не устарела
    if (d <= (new Date()).getTime()) {
        console.log('last date');
        form.querySelector('.lecture-add__date-wrapper').querySelector('.error').innerText = 'Невозможно создать лекцию с прошедшей датой';
        formValid = false;
    }

    for (var i = 0; i < selectSchools.length; i++) {
        var school = selectSchools[i];
        var date = new Date(document.querySelector('.lecture-add__date').value);
        if (school.selected) {
            studentsCount += window.schools.filter((item) => {
                return item.id == school.value;
            })[0].students;
            for (var lecture of lectures) {
                var dateExist = {
                        date: lecture.datetime,
                        start: lecture.start,
                        end: lecture.end
                    },
                    dateDesire = {
                        date: date,
                        start: {
                            hours: document.querySelector('.lecture-add__time-start-hours').value,
                            minutes: document.querySelector('.lecture-add__time-start-minutes').value
                        },
                        end: {
                            hours: document.querySelector('.lecture-add__time-end-hours').value,
                            minutes: document.querySelector('.lecture-add__time-end-minutes').value
                        }
                    };

                // проверяем, что лекция не редактируется, либо редактируемая лекция не является текущей в объекте
                if (!lectureEdit || (lectureEdit && lectureEdit.id != lecture.id)) {

                    // проверяем, что у введеной школы нет других лекций в данное время
                    if (lecture.schools.includes(Number(school.value)) && checkTime(dateExist, dateDesire)) {
                        var error = 'В это время у школы уже есть лекция, назначте другой время или день.';
                        var selectSchoolError = document.querySelector('.lecture-add__schools-wrapper').querySelector('.error');
                        selectSchoolError.innerText = error;
                        formValid = false;
                    }
                    // проверяем, что в указанной аудитории нет других лекций в данное время
                    if (lecture.room == location && checkTime(dateExist, dateDesire)) {
                        var error = 'В это время в данной аудитории проводится лекция, выберите другую аудиторию.';
                        var selectLocationError = document.querySelector('.lecture-add__location-wrapper').querySelector('.error');
                        selectLocationError.innerText = error;
                        formValid = false;
                    }
                    // проверяем, что у выбранного лектора нет других лекций в данное время
                    if (lecture.lecturers == speaker && checkTime(dateExist, dateDesire)) {
                        var error = 'В это время лектор читает другую лекцию.';
                        var selectSpeakerError = document.querySelector('.lecture-add__speaker-wrapper').querySelector('.error');
                        selectSpeakerError.innerText = error;
                        formValid = false;
                    }
                }
            }
        }
    }
    // проверяем, что вместимость выбранной аудитории больше, чем количество учеников в указанных школах
    var locationCapacity = window.rooms.filter(function(item) {
        return item.id == location;
    })[0].capacity;
    if (locationCapacity < studentsCount) {
        var error = 'Вместимость аудитории меньше количества студентов во всех школах. Выберите другую аудиторию.';
        var selectLocationError = document.querySelector('.lecture-add__rooms-wrapper').querySelector('.error');
        selectLocationError.innerText = error;
        formValid = false;
    }

    // показываем все поля с информацией об ошибках ввода
    for (var i = 0; i < form.querySelectorAll('.error').length; i++) {
        var error = form.querySelectorAll('.error')[i];
        error.style.visibility = 'visible';
    }

    // если форма валидна, то получаем данные с полей и добаляем в объект лекций, либо изменяем имеющуюся запись, строим заново HTML списка лекций
    if (formValid) {
        var newUpdatedLecture = getFormValues(form, lectureEdit);

        if (!lectureEdit) {
            lectures.push(newUpdatedLecture);
        }

        // сортировка по убыванию даты
        lectures = sortByDate(lectures).reverse();

        document.querySelector('.lecture-add').style.visibility = 'hidden';
        writeInStorage('lectures', lectures);
        renderLectures(schedule, lectures);
    }
}


/**
 * checkTime - проверяем промежуток времени, чтобы оба промежутка не пересекались и между ними было хотя бы 30 минут перерыва
 * @param dateExist - объект уже существующего временного промежутка
 * @param dateDesire - объект желаемого временного промежутка
 * **/
function checkTime(dateExist, dateDesire) {
    dateExist.date = new Date(dateExist.date);
    dateExist.start = new Date(dateExist.start);
    dateExist.end = new Date(dateExist.end);
    var dateStart = new Date(dateDesire.date),
        d = new Date(dateDesire.date),
        dateEnd = new Date(dateDesire.date);
    dateStart.setHours(dateDesire.start.hours);
    dateStart.setMinutes(dateDesire.start.minutes);
    dateStart.setMinutes(dateStart.getMinutes() - 30);
    dateEnd.setHours(dateDesire.end.hours);
    dateEnd.setMinutes(dateDesire.end.minutes);
    dateEnd.setMinutes(dateEnd.getMinutes() + 30);

    return d.getTime() == dateExist.date.getTime() && ( (dateStart.getTime() <= dateExist.start.getTime() && dateEnd.getTime() > dateExist.start.getTime()) || (dateStart.getTime() >= dateExist.start.getTime() && dateStart.getTime() < dateExist.end.getTime()));
}
