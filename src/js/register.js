// URL del backend Express
const API_URL = "http://localhost:5000/register";

// Evento para agregar un nuevo usuario
document
  .getElementById("registroUsuario")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const nombre = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const cpassword = document.getElementById("confirm-password").value;
    const apellido_paterno = document.getElementById("apellido-paterno").value;
    const apellido_materno = document.getElementById("apellido-materno").value;

    if (password !== cpassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre,
        email,
        password,
        cpassword,
        apellido_paterno,
        apellido_materno,
      }),
    });

    if (response.ok) {
      alert("Se mando al correo " + email + " tu usuario");
      window.location.href = "/login";
    } else {
      const errorData = await response.json();
      alert("Error: " + errorData.error); // Notificar al usuario del error
    }
  });
