// Function for character checking for less than 2 characters
//Create a button that sends you to the sign up, if you don't have an account create an account and redirect to the log in.
//To get rid of sign up on the nav bar.

// Password check on signup page
let form = document.getElementById("signupForm");
form.addEventListener("submit", checkPassword);

async function checkPassword(e) {   //  might want to change function name to something that includes password, email, and username
  let passwordInput = document.getElementById("password");
  let usernameInput = document.getElementById("username");
  let emailInput = document.getElementById("email");
  let password = passwordInput.value;
  let username = usernameInput.value;
  let email = emailInput.value;

  let rawResponse = await fetch(`/api/isUsernameOrEmailDuplicate?username=${username}&email=${email}`);
  let cookedData = await rawResponse.json();
  //  these are the booleans that we will use to determine the error message to show
  let isUsernameDuplicate = cookedData.isUsernameDuplicate;
  let isEmailDuplicate = cookedData.isEmailDuplicate;

  if (password.length < 3) {
    e.preventDefault(); // Stop form from submitting
    //console.log(password);
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
