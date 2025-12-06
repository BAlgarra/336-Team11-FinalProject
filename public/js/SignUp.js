// Function for character checking for less than 2 characters
//Create a button that sends you to the sign up, if you don't have an account create an account and redirect to the log in.
//To get rid of sign up on the nav bar.

document
  .querySelector("#createAccButton")
  .addEventListener("click", directToSignUpPage);

function directToSignUpPage() {
  window.location.href = "/signUp";
}

// Password check on signup page
let form = document.getElementById("signupForm");
form.addEventListener("submit", checkPassword);

function checkPassword(e) {
  let passwordInput = document.getElementById("password");
  let password = passwordInput.value;

  if (password.length < 3) {
    e.preventDefault(); // Stop form from submitting
    console.log(password);
    // Remove previous errors if any
    let prevError = document.querySelector(".alert");
    if (prevError) prevError.remove();

    // Create error div
    let errorDiv = document.createElement("div");
    errorDiv.className = "alert alert-danger";
    errorDiv.appendChild(
      document.createTextNode("Password must be at least 3 characters.")
    );

    // Get elements to insert error
    let card = document.querySelector(".card");
    let heading = document.querySelector(".heading");

    card.insertBefore(errorDiv, heading);

    // Remove error after 3 seconds
    setTimeout(function () {
      errorDiv.remove();
    }, 3000);
  }
}
