// URL del backend Express
const API_URL = "http://localhost:5000/log";

// Evento para agregar un nuevo usuario
document
  .getElementById("ingresosesion")
  .addEventListener("submit", async function (event) {
    event.preventDefault();
    console.log("entro");
    const usuario = document.getElementById("usuario").value;
    console.log(usuario);
    const password = document.getElementById("password").value;
    console.log(password);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usuario,
        password,
      }),
    });

    if (response.ok) {
      window.location.href = "/principal";
    } else {
      const errorData = await response.json();
      alert("Error: " + errorData.error); // Notificar al usuario del error
    }
  });
