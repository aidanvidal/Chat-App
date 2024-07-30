const url = 'http://127.0.0.1:8080/';
const web_socket_url = 'ws://127.0.0.1:8000/';

function loginAccount(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const data = {
        username: username,
        password: password
    };

    fetch(url + 'api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.success) {
                console.log('Account Login successful');
                localStorage.setItem('clientId', data.id);
                // Redirect to chat page
                window.location.href = 'chat.html';
            }
            else {
                console.log('Account Login failed');
                document.getElementById('errorMessage').textContent = data.message;
                document.getElementById('errorMessage').style.display = 'block';
            }
        })
        .catch(error => console.error('Error:', error));
}

const form = document.getElementById('loginForm');
form.addEventListener('submit', loginAccount);