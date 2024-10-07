// URL del backend Express
const API_URL = "http://localhost:5000/usuarios";

//  obtener y mostrar usuarios por ID

document
  .getElementById("form-buscar-usuario")
  .addEventListener("submit", async function (event) {
    event.preventDefault();
    const idBuscar = document.getElementById("id-buscar").value;
    const response = await fetch(`${API_URL}/${idBuscar}`);
    const resultadoBusqueda = document.getElementById("resultado-busqueda");
    resultadoBusqueda.innerHTML = ""; // Limpiar resultado anterior

    if (response.ok) {
      const usuario = await response.json();
      resultadoBusqueda.innerHTML = `
            <p>ID: ${usuario.id}</p>
            <p>Nombre: ${usuario.nombre}</p>
            <p>Email: ${usuario.email}</p>
          `;
    } else {
      resultadoBusqueda.innerHTML = `<p>Usuario no encontrado</p>`;
    }
  });

// Función para obtener y mostrar usuarios
async function obtenerUsuarios() {
  const response = await fetch(API_URL);
  const usuarios = await response.json();

  const listaUsuarios = document.getElementById("lista-usuarios");
  listaUsuarios.innerHTML = ""; // Limpiar lista
  usuarios.forEach((usuario) => {
    const li = document.createElement("li");
    li.textContent = `ID: ${usuario.id}, Nombre: ${usuario.nombre}, Email: ${usuario.email}`;
    listaUsuarios.appendChild(li);
  });
}

// Evento para agregar un nuevo usuario
document
  .getElementById("form-agregar-usuario")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nombre, email }),
    });

    if (response.ok) {
      alert("Usuario agregado exitosamente");
      obtenerUsuarios(); // Actualizar lista de usuarios
    }
  });

// Evento para eliminar un usuario
document
  .getElementById("form-eliminar-usuario")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const idEliminar = document.getElementById("id-eliminar").value;

    const response = await fetch(`${API_URL}/${idEliminar}`, {
      method: "DELETE",
    });

    if (response.ok) {
      alert("Usuario eliminado exitosamente");
      obtenerUsuarios(); // Actualizar lista de usuarios
    }
  });

// Cargar usuarios cuando la página se carga
window.onload = obtenerUsuarios;
