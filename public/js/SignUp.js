// Function for character checking for less than 2 characters
//Create a button that sends you to the sign up, if you don't have an account create an account and redirect to the log in.
//To get rid of sign up on the nav bar.

//username email and password checks
let duplicateForm = document.getElementById("signupForm");
duplicateForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  //Declaring variables and getting values
  let username = document.getElementById("username").value;
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;

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
      showError("Email is already registered use another");
      hasError = true;
    }
    //  checking if password is longer than 3 characters in length
    if (password.length < 3) {
      showError("Password must be at least 3 characters in length");
      hasError = true;
    }
  } catch (err) {
    showError("An error occured. Please try again");
    hasError = true;
  }

  //checking to submit the form only if there are no errors
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
