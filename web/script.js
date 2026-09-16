// ============ Хранилище ============
const STORAGE_KEY = 'safunu_bookings';
const ADMIN_LOGIN = 'admin';
const ADMIN_PASS = 'admin123';

function getBookings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveBookings(bookings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

// ============ Навигация ============
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelector('.nav')?.classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (id === 'cabinet') refreshCabinet();
    if (id === 'admin') refreshAdmin();
}

function toggleMenu() {
    document.querySelector('.nav').classList.toggle('open');
}

// ============ Запись ============
function submitBooking(e) {
    e.preventDefault();
    const name = document.getElementById('bookName').value.trim();
    const phone = document.getElementById('bookPhone').value.trim();
    const email = document.getElementById('bookEmail').value.trim();
    const service = document.getElementById('bookService').value;
    const date = document.getElementById('bookDate').value;
    const time = document.getElementById('bookTime').value;

    const msg = document.getElementById('bookingMessage');

    if (!name || !phone || !email || !service || !date || !time) {
        msg.textContent = 'Заполните все поля!';
        msg.className = 'booking-message error';
        return;
    }

    // Проверка занятости слота
    const bookings = getBookings();
    const busy = bookings.find(b => b.date === date && b.time === time && b.status !== 'Отменена');
    if (busy) {
        msg.textContent = 'Это время уже занято, выберите другое.';
        msg.className = 'booking-message error';
        return;
    }

    const booking = {
        id: Date.now(),
        name, phone, email, service, date, time,
        status: 'Новая',
        createdAt: new Date().toISOString()
    };

    bookings.push(booking);
    saveBookings(bookings);

    msg.textContent = `✓ Вы успешно записаны на ${date} в ${time}!`;
    msg.className = 'booking-message success';

    document.getElementById('bookingForm').reset();
    setTimeout(() => { msg.textContent = ''; }, 5000);
}

// ============ Личный кабинет ============
let currentUser = null;

function loginUser() {
    const phone = document.getElementById('loginPhone').value.trim();
    const bookings = getBookings();
    const userBookings = bookings.filter(b => b.phone === phone);

    if (userBookings.length === 0) {
        alert('Записи с таким номером не найдены. Проверьте номер.');
        return;
    }

    currentUser = { phone, name: userBookings[0].name };
    renderCabinet();
}

function logoutUser() {
    currentUser = null;
    document.getElementById('loginBlock').style.display = 'block';
    document.getElementById('cabinetBlock').style.display = 'none';
    document.getElementById('loginPhone').value = '';
}

function refreshCabinet() {
    if (currentUser) renderCabinet();
}

function renderCabinet() {
    document.getElementById('loginBlock').style.display = 'none';
    document.getElementById('cabinetBlock').style.display = 'block';
    document.getElementById('cabinetName').textContent = currentUser.name;

    const bookings = getBookings()
        .filter(b => b.phone === currentUser.phone)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    const list = document.getElementById('userBookings');
    if (bookings.length === 0) {
        list.innerHTML = '<p class="hint">У вас пока нет записей.</p>';
    } else {
        list.innerHTML = bookings.map(b => bookingCardHTML(b, false)).join('');
    }

    renderCalendar(bookings);
}

// ============ Календарь ============
let calMonth = new Date().getMonth();
let calYear = new Date().getFullYear();

function renderCalendar(bookings) {
    const cal = document.getElementById('calendar');
    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const dayNames = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

    const firstDay = new Date(calYear, calMonth, 1);
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    let startWeekday = firstDay.getDay();
    startWeekday = startWeekday === 0 ? 6 : startWeekday - 1;

    const today = new Date();
    const todayStr = formatDate(today);

    const bookedDays = new Set(bookings.map(b => b.date));

    let html = `
        <div class="calendar-header">
            <button onclick="prevMonth()">‹</button>
            <h3>${monthNames[calMonth]} ${calYear}</h3>
            <button onclick="nextMonth()">›</button>
        </div>
        <div class="calendar-grid">
            ${dayNames.map(d => `<div class="calendar-day-name">${d}</div>`).join('')}
    `;

    for (let i = 0; i < startWeekday; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const hasBooking = bookedDays.has(dateStr);
        const cls = `calendar-day${isToday ? ' today' : ''}${hasBooking ? ' has-booking' : ''}`;
        html += `<div class="${cls}">${d}${hasBooking ? '<span class="dot"></span>' : ''}</div>`;
    }

    html += '</div>';
    cal.innerHTML = html;
}

function prevMonth() {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    if (currentUser) {
        const bookings = getBookings().filter(b => b.phone === currentUser.phone);
        renderCalendar(bookings);
    } else {
        renderCalendar([]);
    }
}

function nextMonth() {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    if (currentUser) {
        const bookings = getBookings().filter(b => b.phone === currentUser.phone);
        renderCalendar(bookings);
    } else {
        renderCalendar([]);
    }
}

function formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ============ Админ ============
function adminLogin() {
    const login = document.getElementById('adminLoginInput').value;
    const pass = document.getElementById('adminPassInput').value;

    if (login === ADMIN_LOGIN && pass === ADMIN_PASS) {
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        refreshAdmin();
    } else {
        alert('Неверный логин или пароль!');
    }
}

function adminLogout() {
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('adminLoginInput').value = '';
    document.getElementById('adminPassInput').value = '';
}

function refreshAdmin() {
    if (document.getElementById('adminPanel').style.display === 'none') return;

    const bookings = getBookings().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    document.getElementById('totalBookings').textContent = bookings.length;

    const list = document.getElementById('adminBookings');
    if (bookings.length === 0) {
        list.innerHTML = '<p class="hint">Записей пока нет.</p>';
    } else {
        list.innerHTML = bookings.map(b => bookingCardHTML(b, true)).join('');
    }
}

// ============ Карточка записи ============
function bookingCardHTML(b, isAdmin) {
    const statusClass = {
        'Новая': 'status-new',
        'Подтверждена': 'status-confirmed',
        'Выполнена': 'status-done',
        'Отменена': 'status-cancelled'
    }[b.status] || 'status-new';

    const actions = isAdmin
        ? `<div class="booking-actions">
             <button class="btn-secondary" onclick="openEdit(${b.id})">Редактировать</button>
             <button class="btn-danger" onclick="deleteBooking(${b.id})">Удалить</button>
           </div>`
        : `<div class="booking-actions">
             <button class="btn-secondary" onclick="cancelBooking(${b.id})">Отменить</button>
           </div>`;

    return `
        <div class="booking-item">
            <div class="booking-info">
                <div><span class="label">Имя:</span> ${b.name}</div>
                <div><span class="label">Телефон:</span> ${b.phone}</div>
                <div><span class="label">Услуга:</span> ${b.service}</div>
                <div><span class="label">Дата:</span> ${b.date} в ${b.time}</div>
                <div><span class="label">Статус:</span> <span class="status ${statusClass}">${b.status}</span></div>
            </div>
            ${actions}
        </div>
    `;
}

// ============ Редактирование ============
function openEdit(id) {
    const b = getBookings().find(x => x.id === id);
    if (!b) return;

    document.getElementById('editId').value = b.id;
    document.getElementById('editName').value = b.name;
    document.getElementById('editPhone').value = b.phone;
    document.getElementById('editService').value = b.service;
    document.getElementById('editDate').value = b.date;
    document.getElementById('editTime').value = b.time;
    document.getElementById('editStatus').value = b.status;

    document.getElementById('editModal').classList.add('active');
}

function closeModal() {
    document.getElementById('editModal').classList.remove('active');
}

function saveEdit() {
    const id = Number(document.getElementById('editId').value);
    const bookings = getBookings();
    const idx = bookings.findIndex(b => b.id === id);
    if (idx === -1) return;

    bookings[idx].name = document.getElementById('editName').value;
    bookings[idx].phone = document.getElementById('editPhone').value;
    bookings[idx].service = document.getElementById('editService').value;
    bookings[idx].date = document.getElementById('editDate').value;
    bookings[idx].time = document.getElementById('editTime').value;
    bookings[idx].status = document.getElementById('editStatus').value;

    saveBookings(bookings);
    closeModal();
    refreshAdmin();
}

function deleteBooking(id) {
    if (!confirm('Удалить эту запись?')) return;
    const bookings = getBookings().filter(b => b.id !== id);
    saveBookings(bookings);
    refreshAdmin();
}

function cancelBooking(id) {
    if (!confirm('Отменить запись?')) return;
    const bookings = getBookings();
    const idx = bookings.findIndex(b => b.id === id);
    if (idx === -1) return;
    bookings[idx].status = 'Отменена';
    saveBookings(bookings);
    renderCabinet();
}

// ============ Инициализация ============
document.addEventListener('DOMContentLoaded', () => {
    // Минимальная дата — сегодня
    const today = formatDate(new Date());
    document.getElementById('bookDate').setAttribute('min', today);
    document.getElementById('bookDate').value = today;

    // Демо-записи (если первый запуск)
    if (!localStorage.getItem(STORAGE_KEY)) {
        const demo = [
            {
                id: 1, name: 'Иван Петров', phone: '+79991234567',
                email: 'ivan@mail.ru', service: 'Полный комплекс',
                date: formatDate(new Date()), time: '10:00',
                status: 'Подтверждена', createdAt: new Date().toISOString()
            },
            {
                id: 2, name: 'Мария Сидорова', phone: '+79997654321',
                email: 'maria@mail.ru', service: 'Балансировка',
                date: formatDate(new Date()), time: '14:00',
                status: 'Новая', createdAt: new Date().toISOString()
            }
        ];
        saveBookings(demo);
    }
});