import express from "express";
import mysql from "mysql2/promise"; // This is a test
import bcrypt from "bcrypt";
import session from "express-session";
const app = express();
const api_key = "76c424ab42c38f52084d995255a524f13416c44f";

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

//Sign Up GET
app.get("/signUp", (req, res) => {
  res.render("signUp.ejs");
});

//Sign Up route POST
app.post("/signUp", async (req, res) => {
  let username = req.body.username;
  let email = req.body.email;
  let password = req.body.password;
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let sex;
  if(req.body.sex) {
    sex = req.body.sex;
  } else {
    sex = 'm';  //  default when no sex is specified
  }
  let hashedPassword = await bcrypt.hash(password, 10);
  const pfp_url =
    "https://i.pinimg.com/236x/68/31/12/68311248ba2f6e0ba94ff6da62eac9f6.jpg";

  let sql = `
            INSERT INTO user_account 
            (user_name, email, password, firstName, lastName, pfp_url, sex)
            VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const [results] = await pool.query(sql, [
    username,
    email,
    hashedPassword,
    firstName,
    lastName,
    pfp_url,
    sex,
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
    req.session.user_id = rows[0].user_id;
    req.session.rawPassword = password;
    // console.log(`Rawpassword: ${password} cryptPassword: ${passwordHash}`);
    res.redirect("/");
  } else {
    // change when password authentication implemented
    res.redirect("/login");
  }
});

//function
function isAuthenticated(req, res, next) {
  if (!req.session.isAuthenticated) {
    res.redirect("/login");
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
  res.redirect("/");
});

//  ------------------- Profile routs ----------------------------------
app.get("/profile", isAuthenticated, async (req, res) => {
  const userId = req.session.user_id;
  let sql = `SELECT * FROM user_account WHERE user_id = ?`;
  const [rows] = await pool.query(sql, [userId]);
  const userInfo = rows[0];
  const rawPassword = req.session.rawPassword;
  res.render("profile.ejs", { userInfo, rawPassword });
});

app.post("/updateProfile", isAuthenticated, async (req, res) => {
  const userId = req.session.user_id;
  let newUsername = req.body.newUsername;
  let newEmail = req.body.newEmail;
  let newPassword = req.body.newPassword;
  let newPasswordHash = await bcrypt.hash(newPassword, 10);
  req.session.rawPassword = newPassword;
  let newFirstName = req.body.newFirstName;
  let newLastName = req.body.newLastName;
  let newPfpUrl = req.body.newPfpUrl;
  let sex = req.body.sex;
  let sql = "UPDATE user_account SET user_name = ?, email = ?, password = ?, firstName = ?, lastName = ?, pfp_url = ?, sex = ? WHERE user_id = ?";
  let sqlParams = [
    newUsername,
    newEmail,
    newPasswordHash,
    newFirstName,
    newLastName,
    newPfpUrl,
    sex,
    userId,
  ];
  const [rows] = await pool.query(sql, sqlParams);
  res.redirect("/profile");
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
});

// -------- Comicvine API Tests  ------------------------------------

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
  // console.log(data.results);
  res.render("issues.ejs", { data: data.results });
});

app.get("/testIssue/:comicvine_id", async (req, res) => {
  const { comicvine_id } = req.params;

  try {
    const url = `https://comicvine.gamespot.com/api/issue/4000-${comicvine_id}/?api_key=${api_key}&format=json`;
    const response = await fetch(url);
    const data = await response.json();

    // console.log(data.results);
    res.json(data.results);
  } catch (err) {
    console.error("ComicVine API error:", err);
    res.status(500).send("Error fetching issue");
  }
});

// -------- Comicvine API Tests END  ------------------------------------

const numIssues = 36;

app.get("/browse", async (req, res) => {
  let pageNum = 0;
  let offset = 0;
  if (req.query.page) {
    pageNum = req.query.page;
    offset = pageNum * numIssues;
  }
  const rawData = await fetch(
    `https://comicvine.gamespot.com/api/issues/?api_key=${api_key}&format=json&sort=store_date:desc&limit=${numIssues}&offset=${offset}`
  );
  const data = await rawData.json();
  const issueData = data.results;
  const user_id = req.session.user_id;
  // Fetch collections for dropdown
  const [collections] = await pool.query(
    "SELECT * FROM collection WHERE user_id = ?",
    [user_id]
  );

  // console.log(issueData);
  const hasPrevPage = pageNum != 0;
  res.render("browse.ejs", {
    issueData,
    pageNum,
    hasPrevPage,
    collections,
    user_id,
  });
});

// -------- New Collection Page ------------------------------------

app.get("/newCollection", isAuthenticated, (req, res) => {
  const user_id = req.session.user_id;
  res.render("newCollection.ejs", { user_id });
});

app.post("/newCollection", isAuthenticated, async (req, res) => {
  const { name, description, user_id } = req.body;

  const sql = `
    INSERT INTO collection (name, description, user_id)
    VALUES (?, ?, ?)
  `;

  await pool.query(sql, [name, description, user_id]);

  res.redirect("/collections");
});

app.post("/addComicToCollection", isAuthenticated, async (req, res) => {
  // until we can login the button will manually add collections to userId 1 and collection 1
  const { comicvine_id, collection_id } = req.body;

  // 1. Fetch full issue from ComicVine
  const url = `https://comicvine.gamespot.com/api/issue/4000-${comicvine_id}/?api_key=${api_key}&format=json`;
  const response = await fetch(url);
  const data = await response.json();
  const issue = data.results;

  // 2. Insert comic if not already in DB
  const insertComicSQL = `
      INSERT INTO comic (
        comicvine_id,
        title,
        issue_num,
        volume_id,
        volume_name,
        cover_date,
        store_date,
        cover_image_url,
        image_super_url,
        image_thumb_url,
        description,
        site_detail_url,
        api_detail_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE comic_id = comic_id
  `;

  await pool.query(insertComicSQL, [
    issue.id,
    issue.name || null,
    issue.issue_number || null,
    issue.volume?.id || null,
    issue.volume?.name || null,
    issue.cover_date || null,
    issue.store_date || null,
    issue.image?.original_url || null,
    issue.image?.super_url || issue.image?.medium_url || null,
    issue.image?.thumb_url || null,
    issue.description || null,
    issue.site_detail_url || null,
    issue.api_detail_url || null,
  ]);

  // 3. Get local comic_id
  const [rows] = await pool.query(
    `SELECT comic_id FROM comic WHERE comicvine_id = ?`,
    [issue.id]
  );
  const comic_id = rows[0].comic_id;

  // 4. Insert into join table
  const insertJoinSQL = `
      INSERT IGNORE INTO collection_comic (collection_id, comic_id)
      VALUES (?, ?)
  `;

  await pool.query(insertJoinSQL, [collection_id, comic_id]);

  // 5. Redirect back to collection page when created
  res.redirect("/browse");
});

app.get("/collections", isAuthenticated, async (req, res) => {
  const user_id = req.session.user_id;

  const [collections] = await pool.query(
    "SELECT * FROM collection WHERE user_id = ?",
    [user_id]
  );

  res.render("collections.ejs", { collections });
});

app.post("/collection/select", (req, res) => {
  const { collection_id } = req.body;

  // Redirect to the collection page with correct id
  res.redirect(`/collection/${collection_id}`);
});

app.get("/collection/:id", async (req, res) => {
  const collection_id = req.params.id;

  const sql = `
    SELECT *
    FROM comic
    JOIN collection_comic 
      ON comic.comic_id = collection_comic.comic_id
    WHERE collection_comic.collection_id = ?
  `;

  const [comics] = await pool.query(sql, [collection_id]);

  res.render("collectionView.ejs", { comics });
});

app.listen(3000, () => {
  console.log("Express server running");
});

app.get("/searchPage", async (req, res) => {
  
    res.render("search.ejs");
  
});

app.get("/search", async (req, res) => {
  // const { query = "", resources = "issue", limit = "10" } = req.query;
  const { query = "", limit = "10" } = req.query;

  const url = new URL("https://comicvine.gamespot.com/api/search/");
  url.search = new URLSearchParams({
    api_key: "76c424ab42c38f52084d995255a524f13416c44f",
    format: "json",
    query,              // <-- user search text
    resources: "issue",          // <-- from dropdown
    field_list: "id,name,issue_number,image,volume,cover_date,store_date,api_detail_url,site_detail_url,description",
    limit,              // <-- from dropdown
  }).toString();

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  const data = await response.json();

  const issueData = data.results || [];
const user_id = req.session.user_id;
const [collections] = await pool.query(
  "SELECT * FROM collection WHERE user_id = ?",
  [user_id]
);

res.render("issues.ejs", {
  issueData,
  pageNum: 0,
  hasPrevPage: false,
  collections,
  user_id,
  query,
  limit,
  isSearch: true,
});
});

app.post("/addComicToCollectionFromSearch", isAuthenticated, async (req, res) => {
  // until we can login the button will manually add collections to userId 1 and collection 1
  const { comicvine_id, collection_id } = req.body;

  // 1. Fetch full issue from ComicVine
  const url = `https://comicvine.gamespot.com/api/issue/4000-${comicvine_id}/?api_key=${api_key}&format=json`;
  const response = await fetch(url);
  const data = await response.json();
  const issue = data.results;

  // 2. Insert comic if not already in DB
  const insertComicSQL = `
      INSERT INTO comic (
        comicvine_id,
        title,
        issue_num,
        volume_id,
        volume_name,
        cover_date,
        store_date,
        cover_image_url,
        image_super_url,
        image_thumb_url,
        description,
        site_detail_url,
        api_detail_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE comic_id = comic_id
  `;

  await pool.query(insertComicSQL, [
    issue.id,
    issue.name || null,
    issue.issue_number || null,
    issue.volume?.id || null,
    issue.volume?.name || null,
    issue.cover_date || null,
    issue.store_date || null,
    issue.image?.original_url || null,
    issue.image?.super_url || issue.image?.medium_url || null,
    issue.image?.thumb_url || null,
    issue.description || null,
    issue.site_detail_url || null,
    issue.api_detail_url || null,
  ]);

  // 3. Get local comic_id
  const [rows] = await pool.query(
    `SELECT comic_id FROM comic WHERE comicvine_id = ?`,
    [issue.id]
  );
  const comic_id = rows[0].comic_id;

  // 4. Insert into join table
  const insertJoinSQL = `
      INSERT IGNORE INTO collection_comic (collection_id, comic_id)
      VALUES (?, ?)
  `;

  await pool.query(insertJoinSQL, [collection_id, comic_id]);

  // 5. Redirect back to collection page when created
  const redirectUrl = req.get("referer") || "/search";
res.redirect(redirectUrl);
});