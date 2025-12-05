import express from "express";
import mysql from "mysql2/promise"; // This is a test
import bcrypt from "bcrypt";
import session from "express-session";
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));

//for Express to get values using POST method
app.use(express.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

//setting up database connection pool
const pool = mysql.createPool({
  host: "ui0tj7jn8pyv9lp6.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  user: "t21fpdn4xxyrg99i",
  password: "xf9ey02a1hyzbkyi",
  database: "bdptrv7p6sbh1fn7",
  connectionLimit: 10,
  waitForConnections: true,
});

//routes
app.get("/", (req, res) => {
  res.render("home.ejs");
});

//logout route
app.get("/logout", isAuthenticated, (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

//welcome route
app.get("/welcome", (req, res) => {
  res.render("welcome.ejs");
});

//Sign Up GET
app.get("/signUp", (req, res) => {
  res.render("signUp.ejs");
});

//Sign Up route POST
app.post("/signUp", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let email = req.body.email;
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;

  let hashedPassword = await bcrypt.hash(password, 10);
  const pfp_url =
    "https://i.pinimg.com/236x/68/31/12/68311248ba2f6e0ba94ff6da62eac9f6.jpg";

  let sql = `
            INSERT INTO user_account 
            (user_name, email, password, firstName, lastName, pfp_url)
            VALUES (?, ?, ?, ?, ?, ?)`;
  const [results] = await pool.query(sql, [
    username,
    email,
    hashedPassword,
    firstName,
    lastName,
    pfp_url,
  ]);

  res.redirect("/login");
});

//loging Get
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

//login Route
app.post("/login", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  let passwordHash = "";

  let sql = `SELECT * 
            FROM user_account 
            WHERE user_name = ?
                `;
  const [rows] = await pool.query(sql, [username, password]);
  if (rows.length > 0) {
    passwordHash = rows[0].password;
  }

  let match = await bcrypt.compare(password, passwordHash);

  if (match) {
    req.session.isAuthenticated = true;
    res.redirect("/welcome");
  } else {
    res.redirect("/");
  }
});

//my Profile route
app.get("/myProfile", isAuthenticated, (req, res) => {
  res.render("profile");
});

//function
function isAuthenticated(req, res, next) {
  if (!req.session.authenticated) {
    res.redirect("/");
  } else {
    next();
  }
}

//comic Home page
app.post("/signup", (req, res) => {
  let { password, confirmPassword } = req.body;
  if (password != confirmPassword) {
    return res.render("signup", { error: "Password does not match" });
  }
  res.redirect("comicHomePage");
});

app.get("/comicHomePage", (req, res) => {
  res.render("comicHomePage");
});

//Search By Keyword
// app.get("/searchByKeyword", async (req, res) => {
//   let keyword = req.query.keyword;
//   let sql = `

//                 `; //need sql
//   let sqlParams = [`${keyword}`];
//   const [rows] = await pool.query(sql, sqlParams);
//   res.render("results.ejs", { rows });
// });

app.get("/dbTest", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT CURDATE()");
    res.send(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).send("Database error!");
  }
}); //dbTest

app.get("/apiTest", async (req, res) => {
  const url = new URL("https://comicvine.gamespot.com/api/search/");
  url.search = new URLSearchParams({
    api_key: "76c424ab42c38f52084d995255a524f13416c44f",
    format: "json",
    query: "batman",
    resources: "volume",
    field_list: "name,id,image,site_detail_url",
    limit: "5",
  }).toString();

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  const data = await response.json();
  console.log(data.results);
  res.render("issues.ejs", { data: data.results });
});

app.listen(3000, () => {
  console.log("Express server running");
});
