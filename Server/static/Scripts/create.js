const url = 'http://127.0.0.1:8080/';

function createAccount(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        console.error('Error: Passwords do not match');
        return;
    }

    const data = {
        username: username,
        password: password
    };

    fetch(url+'api/createAccount', {
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
                console.log('Account created successfully');
                localStorage.setItem('clientId', data.id);
                window.location.href = 'chat.html';
            }
            else {
                console.log('Account creation failed');
                document.getElementById('errorMessage').textContent = data.message;
                document.getElementById('errorMessage').style.display = 'block';
            }
        })
        .catch(error => console.error('Error:', error));
}

const form = document.getElementById('createAccountForm');
form.addEventListener('submit', createAccount);
