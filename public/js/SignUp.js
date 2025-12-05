// Function for character checking for less than 2 characters
//Create a button that sends you to the sign up, if you dont have an account create an account and redirect to the log in.
//To get rid of sign up on the nav bar.

document
  .querySelector("#createAccButton")
  .addEventListener("click", directToSignUpPage);

//functions
function directToSignUpPage() {
  window.location.href = "/signUp";
}
