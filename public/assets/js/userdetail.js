document.addEventListener('DOMContentLoaded', () => {
  // Fetch user data
  fetch('/user', {
    method: 'GET',
    credentials: 'include' // Send cookies with the request
  })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else if (response.status === 401) {
        document.getElementById('username').textContent = 'Sign up';
        throw new Error('Unauthorized');
      } else {
        throw new Error('Failed to fetch user data');
      }
    })
    .then(user => {
      // Update the HTML with the user's name
      document.getElementById('username').textContent = `${user.username}`;
    })
    .catch(error => {
      console.error('Error:', error);
    });
});


document.addEventListener("DOMContentLoaded", function () {
  const userDetails = document.querySelector("#user-details");  // User details section (click area)
  const dropdownMenu = document.querySelector("#dropdown-menu"); // Dropdown menu
  const logoutButton = document.querySelector("#logout-btn");    // Logout button

  // Function to toggle dropdown menu visibility
  userDetails.addEventListener("click", function () {
      // Check if the user is logged in before showing the dropdown
      fetch('/user')  // This endpoint should return user data if logged in, or 401 if not
          .then(response => {
              if (!response.ok) {
                  // User is not logged in, redirect to signup page
                  window.location.href = "signup.html";
              } else {
                  // User is logged in, toggle the dropdown menu
                  dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
              }
          })
          .catch(error => {
              console.error("Error checking login status:", error);
              window.location.href = "signup.html"; // Redirect to signup if any error occurs
          });
  });

  // Function to handle logout
  logoutButton.addEventListener("click", function () {
      fetch("/logout", {
          method: "GET",
      })
      .then(response => {
          if (response.ok) {
              window.location.href = "/";  // Redirect to home page after logout
          } else {
              alert("Logout failed, please try again.");
          }
      })
      .catch(error => {
          console.error("Error during logout:", error);
          alert("An error occurred during logout.");
      });
  });
});
