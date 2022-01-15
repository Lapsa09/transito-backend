const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../pool");
const validInfo = require("../middleware/validInfo");
const jwtGenerator = require("../utils/jwtGenerator");
const authorize = require("../middleware/authorize");

router.post("/register", validInfo, async (req, res) => {
  const { legajo, nombre, apellido, password, telefono } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE legajo = $1", [
      legajo,
    ]);

    if (user.rows.length > 0) {
      return res.status(401).json("Este usuario ya existe!");
    }

    const legajos = await pool.query("SELECT * FROM legajos WHERE legajo=$1", [
      legajo,
    ]);

    if (legajos.rows.length == 0) {
      return res
        .status(404)
        .json("El legajo ingresado no corresponde al de ningun empleado");
    }

    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(password, salt);

    let newUser = await pool.query(
      `
        with new_user as(
          INSERT INTO users (legajo, nombre, apellido, user_password, telefono) VALUES ($1, $2, $3, $4, $5) RETURNING *
        )select * from new_user left join legajos l on new_user.legajo=l.legajo
      `,
      [legajo, nombre, apellido, bcryptPassword, telefono]
    );

    const jwtToken = jwtGenerator(newUser.rows[0].legajo);

    return res.json({
      jwtToken,
      user: {
        legajo: newUser.rows[0].legajo,
        nombre: newUser.rows[0].nombre,
        apellido: newUser.rows[0].apellido,
        turno: newUser.rows[0].turno,
        telefono: newUser.rows[0].telefono,
        rol: newUser.rows[0].rol,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json("Server error");
  }
});

router.post("/login", validInfo, async (req, res) => {
  const { legajo, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE legajo = $1", [
      legajo,
    ]);

    if (user.rows.length === 0) {
      return res.status(401).json("Usuario no encontrado");
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].user_password
    );

    if (!validPassword) {
      return res.status(401).json("Contraseña incorrecta");
    }
    const jwtToken = jwtGenerator(user.rows[0].legajo);
    return res.json({
      jwtToken,
      user: {
        legajo: user.rows[0].legajo,
        nombre: user.rows[0].nombre,
        apellido: user.rows[0].apellido,
        turno: user.rows[0].turno,
        telefono: user.rows[0].telefono,
        rol: user.rows[0].rol,
      },
    });
  } catch (err) {
    res.status(500).json("Server error");
  }
});

router.post("/verify", authorize, (req, res) => {
  try {
    res.json(true);
  } catch (err) {
    res.status(500).json("Server error");
  }
});

module.exports = router;
