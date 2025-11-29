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

//routes
app.get('/', (req, res) => {
    res.render("home.ejs")
});

app.get("/dbTest", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }

});//dbTest

app.get("/apiTest", async (req, res) => {
    const url = new URL("https://comicvine.gamespot.com/api/search/");
    url.search = new URLSearchParams({
        api_key: "76c424ab42c38f52084d995255a524f13416c44f",
        format: "json",
        query: "batman",
        resources: "volume",
        field_list: "name,id,image,site_detail_url",
        limit: "5"
    }).toString();

    const response = await fetch(url, { headers: { "Accept": "application/json" } });
    const data = await response.json();
    console.log(data.results);
    res.render("issues.ejs",{data: data.results});
});

const numIssues = 24;   //  24 issues per page
let offset = 0; //  needed to for paging
app.get("/browse", async (req, res) => {
    const rawData = await fetch(`https://comicvine.gamespot.com/api/issues/?api_key=${api_key}&format=json&sort=store_date:desc&limit=${numIssues}&offset=${offset}`);
    const cookedData = await rawData.json();
    const issueData = cookedData.results;
    offset += numIssues;    //  increment the offset by the page size
    res.render("browse.ejs", { issueData });
})

app.listen(3000, () => {
    console.log("Express server running")
})