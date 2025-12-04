import express from "express";
import mysql from "mysql2/promise"; // This is a test

const app = express();
const api_key = "76c424ab42c38f52084d995255a524f13416c44f";

app.set("view engine", "ejs");
app.use(express.static("public"));

//for Express to get values using POST method
app.use(express.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

//setting up database connection pool
const pool = mysql.createPool({
  host: "ui0tj7jn8pyv9lp6.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  user: "t21fpdn4xxyrg99i",
  password: "xf9ey02a1hyzbkyi",
  database: "bdptrv7p6sbh1fn7",
  connectionLimit: 10,
  waitForConnections: true,
});

//  ------------------- Profile routs ----------------------------------
app.get("/profile", async (req, res) => {
  const userId = 1; //  for pre-auth development will change
  let sql = `SELECT * FROM user_account WHERE user_id = ?`;
  const [rows] = await pool.query(sql, [userId]);
  const userInfo = rows[0];
  res.render("profile.ejs", { userInfo });
});

app.post("/updateProfile", async (req, res) => {
  let newUsername = req.body.newUsername;
  let newEmail = req.body.newEmail;
  let newPassword = req.body.newPassword;
  let newFirstName = req.body.newFirstName;
  let newLastName = req.body.newLastName;
  let newPfpUrl = req.body.newPfpUrl;
  let sex = req.body.sex;
  //  TODO
});

// -------- Home & dbTest routes ----------------------------------------
app.get("/", (req, res) => {
  res.render("home.ejs");
});

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
  console.log(data.results);
  res.render("issues.ejs", { data: data.results });
});

app.get("/testIssue/:comicvine_id", async (req, res) => {
  const { comicvine_id } = req.params;

  try {
    const url = `https://comicvine.gamespot.com/api/issue/4000-${comicvine_id}/?api_key=${api_key}&format=json`;
    const response = await fetch(url);
    const data = await response.json();

    console.log(data.results);
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

  // TEMP user_id
  const user_id = 1;

  // Fetch collections for dropdown
  const [collections] = await pool.query(
    "SELECT * FROM collection WHERE user_id = ?",
    [user_id]
  );

  console.log(issueData);
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

app.get("/newCollection", (req, res) => {
  // For now user_id = 1 until login system is added
  const user_id = 1;

  res.render("newCollection.ejs", { user_id });
});

app.post("/newCollection", async (req, res) => {
  const { name, description, user_id } = req.body;

  const sql = `
    INSERT INTO collection (name, description, user_id)
    VALUES (?, ?, ?)
  `;

  await pool.query(sql, [name, description, user_id]);

  res.redirect("/collections");
});

app.post("/addComicToCollection", async (req, res) => {
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

app.get("/collections", async (req, res) => {
  const user_id = 1; // Change when login implemented

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
