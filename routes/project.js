const sqlite3 = require("sqlite3").verbose()
const db = new sqlite3.Database('db/database.db')
const Router = require("express");
const router = Router();


router.get("/addPoject/", (req, res) => {
  res.render("newProject");
});

router.post("/addPoject/", (req, res) => {
  const { name, description } = req.body;
  if (name == "" && description == "") {
    res.send("all inputs are required");
  } else {
    db.run(`
      insert into projects (name, description, user)
      values ('${name}', '${description}', '${req.cookies.username}')
    `);
    res.redirect("/auth/login");
  }
});

router.get("/getAllProjects", (req, res) => {
  db.all("select * from projects", (err, rows) => {
    res.json(rows);
  });
});

router.get("/deleteProject/:delId", (req, res) => {
  // if () {

  // }
  db.run(`DELETE FROM projects where id = ${req.params.delId}`);
  res.redirect("/auth/login");
});

router.get("/projectSettings/:id", (req, res) => {
  res.send(req.params.id);
});


module.exports = router;