document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('로그인이 필요합니다');
        window.location.href = '/';
        return;
    }

    fetchUserInfo(token);
    initializeCalendar();
    loadSchedules();

    document.getElementById('scheduleForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const id = document.getElementById('scheduleId').value;
        const title = document.getElementById('scheduleTitle').value;
        const description = document.getElementById('scheduleDescription').value;
        const startDate = document.getElementById('scheduleStartDate').value;
        const endDate = document.getElementById('scheduleEndDate').value;

        if (new Date(startDate) > new Date(endDate)) {
            alert('끝나는 날짜가 시작 날짜보다 빠릅니다.');
            return;
        }
        const token = localStorage.getItem('token');
        if (!token) return;

        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace('-', '+').replace('_', '/');
        const decodedToken = JSON.parse(atob(base64));
        const memberId = decodedToken.id;

        const scheduleData = { member_id: memberId, title, description, start_date: startDate, end_date: endDate };

        if (id) {
            scheduleData.id = id;
            fetch('https://port-0-diary-lxklaj2915d83db7.sel5.cloudtype.app/schedules', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(scheduleData)
            })
            .then(response => response.text())
            .then(data => {
                alert(data);
                loadSchedules();
                document.getElementById('scheduleForm').reset();
                document.getElementById('scheduleId').value = '';
            });
        } else {
            fetch('https://port-0-diary-lxklaj2915d83db7.sel5.cloudtype.app/schedules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(scheduleData)
            })
            .then(response => response.text())
            .then(data => {
                alert(data);
                loadSchedules();
                document.getElementById('scheduleForm').reset();
            });
        }
    });

    document.getElementById('yearlyButton').addEventListener('click', () => loadSchedules('yearly'));
    document.getElementById('monthlyButton').addEventListener('click', () => loadSchedules('monthly'));
    document.getElementById('weeklyButton').addEventListener('click', () => loadSchedules('weekly'));

    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('token');
        document.body.classList.add('page-transition');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    });

    document.getElementById('deleteAccountButton').addEventListener('click', () => {
        const confirmDelete = confirm('정말로 탈퇴하시겠습니까?');
        if (!confirmDelete) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace('-', '+').replace('_', '/');
        const decodedToken = JSON.parse(atob(base64));
        const memberId = decodedToken.id;

        fetch('https://port-0-diary-lxklaj2915d83db7.sel5.cloudtype.app/member', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ id: memberId })
        })
        .then(response => response.text())
        .then(data => {
            alert(data);
            localStorage.removeItem('token');
            document.body.classList.add('page-transition');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        });
    });
});

function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: function(fetchInfo, successCallback, failureCallback) {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace('-', '+').replace('_', '/');
            const decodedToken = JSON.parse(atob(base64));
            const memberId = decodedToken.id;

            fetch(`https://port-0-diary-lxklaj2915d83db7.sel5.cloudtype.app/schedules?member_id=${memberId}`, {
                method: 'GET',
                headers: {
                    'Authorization': token
                }
            })
            .then(response => response.json())
            .then(data => {
                const events = data.map((schedule) => {
                    const startDate = new Date(schedule.start_date);
                    const endDate = new Date(schedule.end_date);

                    if (startDate.getTime() !== endDate.getTime()) {
                        endDate.setDate(endDate.getDate() + 1);
                    }

                    return {
                        id: schedule.id,
                        title: schedule.title,
                        start: startDate.toISOString().split('T')[0],
                        end: endDate.toISOString().split('T')[0],
                        backgroundColor: getColor(schedule.id),
                        borderColor: getColor(schedule.id)
                    };
                });
                successCallback(events);
            })
            .catch(error => {
                failureCallback(error);
            });
        },
        dateClick: function(info) {
            const title = prompt('일정 제목:');
            if (title) {
                const description = prompt('일정 설명:');
                const startDate = info.dateStr;
                const endDate = info.dateStr;
                
                const token = localStorage.getItem('token');
                if (!token) return;

                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace('-', '+').replace('_', '/');
                const decodedToken = JSON.parse(atob(base64));
                const memberId = decodedToken.id;

                const scheduleData = { member_id: memberId, title, description, start_date: startDate, end_date: endDate };

                fetch('https://port-0-diary-lxklaj2915d83db7.sel5.cloudtype.app/schedules', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify(scheduleData)
                })
                .then(response => response.text())
                .then(data => {
                    alert(data);
                    calendar.refetchEvents();
                });
            }
        },
        eventClick: function(info) {
            if (confirm(`'${info.event.title}' 일정을 삭제하시겠습니까?`)) {
                const token = localStorage.getItem('token');
                if (!token) return;

                fetch('https://port-0-diary-lxklaj2915d83db7.sel5.cloudtype.app/schedules', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify({ id: info.event.id })
                })
                .then(response => response.text())
                .then(data => {
                    alert(data);
                    info.event.remove();
                });
            }
        }
    });

    calendar.render();
}

function fetchUserInfo(token) {
    fetch('https://port-0-diary-lxklaj2915d83db7.sel5.cloudtype.app/userinfo', {
        method: 'GET',
        headers: {
            'Authorization': token
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('username').textContent = `${data.username}'s Diary`;
    })
    .catch(error => {
        console.error('사용자 정보를 가져오는 중 오류 발생:', error);
    });
}

function loadSchedules(filter) {
    const token = localStorage.getItem('token');
    if (!token) return;

    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace('-', '+').replace('_', '/');
    const decodedToken = JSON.parse(atob(base64));
    const memberId = decodedToken.id;

    let url = `https://port-0-diary-lxklaj2915d83db7.sel5.cloudtype.app/schedules?member_id=${memberId}`;
    if (filter) {
        url += `&filter=${filter}`;
    }

    fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': token
        }
    })
    .then(response => response.json())
    .then(data => {
        const scheduleList = document.getElementById('scheduleList');
        scheduleList.innerHTML = '';
        data.forEach((schedule) => {
            const scheduleItem = document.createElement('li');
            scheduleItem.style.backgroundColor = getColor(schedule.id);
            scheduleItem.textContent = `${schedule.title}: ${schedule.description} (시작: ${schedule.start_date}, 끝: ${schedule.end_date})`;
            scheduleItem.appendChild(createEditButton(schedule));
            scheduleItem.appendChild(createDeleteButton(schedule.id));
            scheduleList.appendChild(scheduleItem);
        });

        const events = data.map((schedule) => {
            const startDate = new Date(schedule.start_date);
            const endDate = new Date(schedule.end_date);

            if (startDate.getTime() !== endDate.getTime()) {
                endDate.setDate(endDate.getDate() + 1);
            }

            return {
                id: schedule.id,
                title: schedule.title,
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0],
                backgroundColor: getColor(schedule.id),
                borderColor: getColor(schedule.id)
            };
        });
        const calendar = FullCalendar.Calendar.getCalendarById('calendar'); 
        if (calendar) {
            calendar.getEvents().forEach(event => event.remove());
            events.forEach(event => calendar.addEvent(event));
        }
    });
}

function createEditButton(schedule) {
    const editButton = document.createElement('button');
    editButton.textContent = '수정';
    editButton.addEventListener('click', () => {
        document.getElementById('scheduleId').value = schedule.id;
        document.getElementById('scheduleTitle').value = schedule.title;
        document.getElementById('scheduleDescription').value = schedule.description;
        document.getElementById('scheduleStartDate').value = schedule.start_date;
        document.getElementById('scheduleEndDate').value = schedule.end_date;
    });
    return editButton;
}

function createDeleteButton(scheduleId) {
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '삭제';
    deleteButton.addEventListener('click', () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        fetch('https://port-0-diary-lxklaj2915d83db7.sel5.cloudtype.app/schedules', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ id: scheduleId })
        })
        .then(response => response.text())
        .then(data => {
            alert(data);
            loadSchedules();
        });
    });
    return deleteButton;
}

function getColor(id) {
    const colors = ['#FF6347', '#4682B4', '#32CD32', '#FFD700', '#6A5ACD', '#FF69B4', '#40E0D0', '#FFA500'];
    const numericId = parseInt(id, 10); 
    const colorIndex = numericId % colors.length;  
    return colors[colorIndex];
}
