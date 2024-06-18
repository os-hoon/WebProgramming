document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    fetch('https://port-0-diary-lxklaj2915d83db7.sel5.cloudtype.app/register', {
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

    fetch('https://port-0-diary-lxklaj2915d83db7.sel5.cloudtype.app/login', {
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
        document.querySelectorAll('.pin-image').forEach(element => {
            element.classList.add('fade-out');
        });
        setTimeout(() => {
            document.body.classList.add('page-transition'); 
            setTimeout(() => {
                window.location.href = '/schedules.html';
            }, 1000); 
        }, 1000); 
    })
    .catch(error => {
        alert(error.message);
    });
});
