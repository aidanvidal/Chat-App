// Function to handle form submission
const url = 'http://68.183.31.37:80/';
function createAccount(event) {
    event.preventDefault(); // Prevent the form from submitting

    // Get the form inputs
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Check if the passwords match
    if (password !== confirmPassword) {
        console.error('Error: Passwords do not match');
        return;
    }

    // Create the data object
    const data = {
        username: username,
        password: password
    };

    // Send a POST request to the server
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
                // Redirect to the main page
                window.api.setClientId(data.id);
                window.api.send('change-html', 'chat.html');
            }
            else {
                console.log('Account creation failed');
                // Display an error message
                document.getElementById('errorMessage').textContent = data.message;
                document.getElementById('errorMessage').style.display = 'block';
            }
        })
        .catch(error => console.error('Error:', error));
}

// Add event listener to the form
const form = document.getElementById('createAccountForm');
form.addEventListener('submit', createAccount);