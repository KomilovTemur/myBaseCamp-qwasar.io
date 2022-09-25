const express = require("express");
const app = express();
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db/database.db");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const PORT = 8080;
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Route file
const authRouter = require("./routes/auth")
const projectRouter = require("./routes/project")


app.use((req, res, next) => {
  let logged = "";
  if (req.cookies.username) {
    logged = req.cookies.username;
  } else {
    logged = "not logged";
  }
  db.run(`
    insert into logs (path, user)
    values ("${req.hostname}:${PORT}${req.url}", "${logged}") 
  `);
  next();
});

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("home");
});

app.use('/auth/', authRouter)
app.use('/project/', projectRouter)

app.get("/user/:user", (req, res) => {
  const { username } = req.cookies;
  if (req.params.user == username) {
    db.all(
      `select * from users where username = '${username}'`,
      (err, rows) => {
        db.all(
          `select * from projects where user = '${username}'`,
          (err, projects) => {
            if (rows[0].admin == "true") {
              res.redirect(`/admins/${username}`);
            } else {
              res.render("user", { rows, projects });
            }
          }
        );
      }
    );
  } else {
    db.all(
      `select id, username, email from users where username = '${req.params.user}'`,
      (err, user) => {
        db.all(
          `select * from projects where user = '${req.params.user}'`,
          (err, projects) => {
            res.render("guest", { user, projects });
          }
        );
      }
    );
  }
});

app.get("/admins/:adminName", (req, res) => {
  db.all("select * from users limit 10", (err, users) => {
    db.all("select * from logs limit 10", (err, logs) => {
      db.all("select * from projects limit 10", (err, projects) => {
        db.all(
          `select * from users where username = '${req.params.adminName}'`,
          (err, admins) => {
            const { username } = req.cookies;
            if (admins.length == 0) {
              res.redirect("/auth/login");
            } else if (admins[0].admin == "false") {
              res.redirect("/auth/login");
            } else if (req.params.adminName != req.cookies.username) {
              res.redirect("/auth/login");
            } else {
              res.json({ users, logs, projects });
              console.log(!req.cookies);
            }
          }
        );
      });
    });
  });
});

app.get("/editProfile", (req, res) => {
  const { username } = req.cookies;
  if (!req.cookies.username) {
    res.redirect("/auth/login");
  } else {
    db.all(
      `select * from users where username = '${username}'`,
      (err, rows) => {
        res.render("editProfile", { rows });
      }
    );
  }
});

app.post("/editProfile", (req, res) => {
  const { username, email, password } = req.body;
  db.all(
    `select * from users where username = '${username}'`,
    (err, usernames) => {
      if (usernames.length == 0) {
        db.all(
          `select * from users where email = '${email}'`,
          (err, emails) => {
            if (emails.length == 0) {
              if (password.length < 4) {
                res.send("password length is minimal 4");
              } else {
                db.run(`
                  update users set username = "${username}",
                  email = "${email}",
                  password = "${password}" where username = "${req.cookies.username}"
                `);
                res.cookie("username", username);
                res.redirect(`/user/${req.cookies.username}`);
              }
            } else {
              res.send("this email already exist");
            }
          }
        );
      } else {
        res.send("this username already exist");
      }
    }
  );
});

app.get("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/auth/login");
});

app.get("/serarchUser", (req, res) => {
  db.all(
    `select id, username, email from users where username = '${req.query.uName}'`,
    (err, user) => {
      db.all(
        `select * from projects where user = '${req.query.uName}'`,
        (err, projects) => {
          res.render("guest", { user, projects });
        }
      );
    }
  );
});

app.get("/comments/:id", (req, res) => {
  db.all(
    `select * from comments where projectId = "${req.params.id}" ORDER BY ID DESC`,
    (err, comments) => {
      let id = req.params.id;
      res.render("comments", { comments, id });
    }
  );
});

app.post("/addComment/:id", (req, res) => {
  const { username } = req.cookies;
  if (!username) {
    res.send("<h2>you are not logged <br> pleace <a href='/auth/login'> Login </a></h2>");
  } else {
    db.run(
      `insert into comments (user, comment, projectId) values ('${username}', '${req.body.comment}', '${req.params.id}')`
    );
    res.redirect(`/comments/${req.params.id}`);
  }
});

app.listen(PORT, console.log(`http://localhost:${PORT}`));
