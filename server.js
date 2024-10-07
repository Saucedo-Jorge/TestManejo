import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mysql from "mysql2";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const AUTH_SECRET = "d98ebf8e14ec04b6b0857d62edb7cb38";
const app = express();

// Configurar CORS para permitir solicitudes desde Astro
app.use(
  cors({
    origin: "http://localhost:4321", // Cambia el puerto si Astro corre en otro
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Middleware para manejar JSON en las solicitudes
app.use(bodyParser.json());

// Middleware para registrar cada solicitud que llega al servidor
app.use((req, res, next) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`);
  next();
});

// Middleware para verificar la autenticación
const verifyAuth = (req, res, next) => {
  const token = req.cookies.authToken;

  // Verificar si existe el token
  if (!token) {
    return res
      .status(401)
      .json({ error: "Acceso denegado: no se proporcionó token" });
  }

  // Verificar y decodificar el token
  jwt.verify(token, AUTH_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }

    // Almacenar el ID del usuario decodificado para usarlo en la ruta
    req.userId = decoded.id;
    next();
  });
};

// Configuración de la base de datos MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Cambia esto según tu configuración
  password: "1234", // Cambia esto según tu configuración
  database: "testmanejo", // Cambia esto según tu configuración
});

// Conectamos a la base de datos
db.connect((err) => {
  if (err) {
    console.error("Error conectando a la base de datos:", err);
    return;
  }
  console.log("Conectado a la base de datos MySQL");
});

// Rutas

// Ruta POST: agregar un nuevo usuario
app.post("/register", (req, res) => {
  const { nombre, email, password, apellido_paterno, apellido_materno } =
    req.body;

  // Encriptar la contraseña
  const enpassword = bcrypt.hashSync(password, 10);

  // Generar el nombre de usuario a partir de las iniciales
  const iniciales = nombre
    .split(" ")
    .map((palabra) => palabra[0]) // Tomar la primera letra de cada nombre
    .join(""); // Unir todas las iniciales
  let usuario = `${iniciales}${apellido_paterno}`.toLowerCase();

  // Función para verificar si el usuario existe
  const checkUserExists = (usuario) => {
    return new Promise((resolve, reject) => {
      const checkUserQuery =
        "SELECT COUNT(*) as count FROM usuario WHERE USUARIO = ?";
      db.query(checkUserQuery, [usuario], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result[0].count > 0);
      });
    });
  };

  // Función para generar un nombre de usuario único
  const generateUniqueUsername = async (baseUsername) => {
    let uniqueUsername = baseUsername;
    let exists = await checkUserExists(uniqueUsername);

    // Continuar generando hasta encontrar un nombre único
    while (exists) {
      const randomNum = Math.floor(Math.random() * 1000); // Número aleatorio entre 0 y 999
      uniqueUsername = `${baseUsername}${randomNum}`;
      exists = await checkUserExists(uniqueUsername);
    }

    return uniqueUsername;
  };

  // Uso de la función para obtener un usuario único
  generateUniqueUsername(usuario)
    .then((uniqueUsername) => {
      console.log("Usuario único generado:", uniqueUsername);
      // Configurar el transporte de nodemailer
      const transporter = nodemailer.createTransport({
        service: "outlook",
        auth: {
          user: "saucedojorge@uadec.edu.mx",
          pass: "ALVpUAC209@",
        },
      });

      // Configurar el contenido del correo
      const mailOptions = {
        from: "saucedojorge@uadec.edu.mx",
        to: email,
        subject: "Registro exitoso",
        text: `¡Hola ${nombre}! Tu registro ha sido exitoso. Tu nombre de usuario es: ${uniqueUsername}`,
      };

      // Enviar el correo
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error al enviar el correo:", error);
          return res.status(500).json({ error: "Error al enviar el correo" });
        }
      });

      // Insertar el nuevo usuario en la base de datos
      const insertUserQuery =
        "INSERT INTO usuario (NOMBRE, APELLIDOP, APELLIDOM, CORREO, CONTRASENA, USUARIO) VALUES (?, ?, ?, ?, ?, ?)";
      console.log("ya va a insertar el usuario");
      console.log(
        nombre,
        apellido_paterno,
        apellido_materno,
        email,
        enpassword,
        uniqueUsername
      );
      db.query(
        insertUserQuery,
        [
          nombre,
          apellido_paterno,
          apellido_materno,
          email,
          enpassword,
          uniqueUsername,
        ],
        (err, result) => {
          if (err) {
            return res
              .status(500)
              .json({ error: "Error al agregar el usuario" });
          }
          res.json({
            mensaje: "Usuario agregado exitosamente",
            id: result.insertId,
          });
          console.log("ya inserto el usuario");
        }
      );
    })
    .catch((err) => {
      console.error("Error al verificar el usuario:", err);
    });
});

// Ruta para iniciar sesión
app.post("/log", (req, res) => {
  const { usuario, password } = req.body;
  console.log("usuario", usuario);

  // Verificar usuario en la base de datos
  const query = "SELECT * FROM usuario WHERE usuario = ?";
  db.query(query, [usuario], (err, results) => {
    if (err) {
      console.log("Error al buscar el usuario:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }

    // Si no se encuentra el usuario
    if (results.length === 0) {
      console.log("Usuario no encontrado");
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const user = results[0];
    const hashedPassword = user.CONTRASENA;

    // Comparar la contraseña proporcionada con la almacenada usando bcrypt
    bcrypt.compare(password, hashedPassword, (err, isMatch) => {
      if (err) {
        console.log("Error al comparar contraseñas:", err);
        return res.status(500).json({ error: "Error en el servidor" });
      }

      // Si las contraseñas no coinciden
      if (!isMatch) {
        console.log("Contraseña incorrecta");
        return res.status(401).json({ error: "Credenciales incorrectas" });
      }

      // Generar el token JWT con un tiempo de expiración de 2 horas
      const token = jwt.sign({ id: user.IDUSUARIO }, AUTH_SECRET, {
        expiresIn: "2h",
      });

      console.log("Token generado:", token);

      // Enviar la cookie con el token (la cookie expirará junto con el token)
      res.cookie("authToken", token, {
        httpOnly: true, // Evita que la cookie sea accesible desde el cliente JavaScript
        secure: true, // Asegura que la cookie solo se envíe a través de HTTPS
        maxAge: 7200000, // 2 horas en milisegundos
      });

      console.log("Cookie de autenticación enviada");

      // Respuesta exitosa
      res.json({ message: "Inicio de sesión exitoso" });
      console.log("Fin del proceso de inicio de sesión");
    });
  });
});

const PORT = 5000; // Puerto donde corre Express
app.listen(PORT, () => {
  console.log(`Servidor de Express corriendo en el puerto ${PORT}`);
});
