document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text) });
        }
        return response.text();
    })
    .then(message => {
        alert(message);
        document.getElementById('registerForm').reset();
    })
    .catch(error => {
        alert(error.message);
    });
});

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text) });
        }
        return response.json();
    })
    .then(data => {
        localStorage.setItem('token', data.token);
        alert('로그인 성공');
        // 핀 이미지와 전구 이미지 사라지게 하기
        document.querySelectorAll('.pin-image').forEach(element => {
            element.classList.add('fade-out');
        });
        // 사라지는 효과가 완료된 후 페이지 전환 효과 적용
        setTimeout(() => {
            document.body.classList.add('page-transition'); // 페이지 전환 효과 추가
            setTimeout(() => {
                window.location.href = '/schedules.html';
            }, 1000); // 1초 후 페이지 이동
        }, 1000); // 1초 후 사라지는 효과 완료
    })
    .catch(error => {
        alert(error.message);
    });
});
