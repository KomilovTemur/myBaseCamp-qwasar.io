const Router = require("express");
const router = Router();
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db/database.db");

router.get("/:user", (req, res) => {
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



// router.get("/admins/:adminName", (req, res) => {
//   db.all("select * from users limit 10", (err, users) => {
//     db.all("select * from logs limit 10", (err, logs) => {
//       db.all("select * from projects limit 10", (err, projects) => {
//         db.all(
//           `select * from users where username = '${req.params.adminName}'`,
//           (err, admins) => {
//             const { username } = req.cookies;
//             if (admins.length == 0) {
//               res.redirect("/auth/login");
//             } else if (admins[0].admin == "false") {
//               res.redirect("/auth/login");
//             } else if (req.params.adminName != req.cookies.username) {
//               res.redirect("/auth/login");
//             } else {
//               res.json({ users, logs, projects });
//               console.log(!req.cookies);
//             }
//           }
//         );
//       });
//     });
//   });
// });

module.exports = router;
