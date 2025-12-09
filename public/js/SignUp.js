// Function for character checking for less than 2 characters
//Create a button that sends you to the sign up, if you don't have an account create an account and redirect to the log in.
//To get rid of sign up on the nav bar.

// Password check on signup page
let form = document.getElementById("signupForm");
form.addEventListener("submit", checkPassword);

function checkPassword(e) {
  let passwordInput = document.getElementById("password");
  let password = passwordInput.value;

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

//username and email checkings

let duplicateForm = document.getElementById("signupForm");
duplicateForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  //Declaring variables and getting values
  let username = document.getElementById("username").value;
  let email = document.getElementById("email").value;

  //set error to false
  let hasError = false;

  //try/catch
  try {
    //Using encodeURIComponent because certain characters will break the URL such as @ & or ?
    let response = await fetch(
      `/api/isUsernameOrEmailDuplicate?username=${encodeURIComponent(
        username
      )}&email=${encodeURIComponent(email)}`
    );
    let data = await response.json();

    //checking if data has duplicate usernames
    if (data.isUsernameDuplicate) {
      showError("Username is already taken, choose another.");
      hasError = true;
    }

    //checking if data has diplicate emails
    if (data.isEmailDuplicate) {
      showError("Email is already registered");
      hasError = true;
    }
  } catch (err) {
    showError("An error occured. Please try again");
    hasError = true;
  }

  //chekcing to submit the form only if there are no errors
  if (!hasError) {
    duplicateForm.submit();
  }
});

// Show Error function
function showError(message) {
  let errorDiv = document.createElement("div");
  errorDiv.className = "alert alert-danger";
  errorDiv.appendChild(document.createTextNode(message));

  //selecting classes
  let card = document.querySelector(".card");
  let heading = document.querySelector(".heading");

  card.insertBefore(errorDiv, heading);

  //clear after 3 seconds
  setTimeout(function () {
    errorDiv.remove();
  }, 3000);
}
