const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("db/database.db");
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
  db.all(
    `select * from projects where id = ${req.params.delId}`,
    (err, rows) => {
      rows[0].user == req.cookies.username
        ? (db.run(`DELETE FROM projects where id = ${req.params.delId}`),
          res.redirect("/auth/login"))
        : res.send("You can't delete this project!");
    }
  );
});

router.get("/projectSettings/:id", (req, res) => {
  // res.send(req.params.id);
  const { username } = req.cookies;
  username
    ? db.all(
        `select * from users where username = '${username}'`,
        (err, rows) => {
          if (rows[0].username === username) {
            let members = "";
            db.all(
              `select * from member where projectId = '${req.params.id}'`,
              (err, rows) => {
                members = rows;
              }
            );
            db.all(
              `select * from projects where id = ${req.params.id}`,
              (err, data) => {
                res.render("projectSettings", { data, members });
                // res.json({ data, members });
              }
            );
          } else {
            res.send("You can't access this project settings");
          }
        }
      )
    : res.redirect("/auth/login");
});

router.get("/allProjects", (req, res) => {
  const { username } = req.cookies;
  db.all(`select * from users`, (err, rows) => {
    db.all(`select * from projects order by id desc`, (err, projects) => {
      res.render("allProjects", { rows, projects, username });
    });
  });
});

router.get("/projectOverview/:id", (req, res) => {
  db.all(
    `select * from projects where id = ${req.params.id}`,
    (err, projects) => {
      if (err) {
        console.log(err);
      }
      res.render("projectOverview", { projects });
    }
  );
});

router.post("/addMember", (req, res) => {
  db.run(
    `insert into member (projectId, username) values ('${req.body.projectId}', '${req.body.username}')`,
    (err) => {
      if (err) {
        console.log(err);
      }
      res.redirect(`/project/projectSettings/${req.body.projectId}`);
    }
  );
});

router.post("/updateProject", (req, res) => {
  db.run(
    `UPDATE projects
  SET name = '${req.body.name}', description = '${req.body.description}'
  WHERE id = ${req.body.id}`,
    (err) => {
      if (err) {
        console.log(err);
      }
      res.redirect("/auth/login");
    }
  );
});

module.exports = router;
