document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  const popup = document.getElementById('popup');
  const error = document.getElementById('error');

  // Function to handle form submission
  async function handleFormSubmit(event, url, body) {
    event.preventDefault();
    error.innerText = "";

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.text();

      if (response.ok) {
        // Show success popup
        popup.style.top = '0';
        setTimeout(() => {
          window.location.href = '/'; // Redirect to home
        }, 1000);
      } else {
        error.innerText = data;
      }
    } catch (err) {
      alert('An error occurred');
      console.error(err);
    }
  }

  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      const username = document.querySelector('input[name="username"]').value;
      const email = document.querySelector('input[name="email"]').value;
      const password = document.querySelector('input[name="password"]').value;
      handleFormSubmit(e, '/signup', { username, email, password });
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      const email = document.querySelector('input[name="email"]').value;
      const password = document.querySelector('input[name="password"]').value;
      handleFormSubmit(e, '/login', { email, password });
    });
  }

  window.togglePassword = function () {
    const passwordField = document.querySelector('input[name="password"]');
    const passwordIcon = document.querySelector('.show-password i');
    if (passwordField.type === "password") {
      passwordField.type = "text";
      passwordIcon.classList.remove('fa-eye');
      passwordIcon.classList.add('fa-eye-slash');
    } else {
      passwordField.type = "password";
      passwordIcon.classList.remove('fa-eye-slash');
      passwordIcon.classList.add('fa-eye');
    }
  };
});
