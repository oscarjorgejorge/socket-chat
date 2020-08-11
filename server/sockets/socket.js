const { io } = require("../server");
const { Usuarios } = require("../classes/usuarios");
const { crearMensaje } = require("../utils/utils");

const usuarios = new Usuarios();
console.log(Usuarios);

io.on("connection", (client) => {
    client.on("entrarChat", (data, callback) => {
        console.log(data);

        if (!data.nombre || !data.sala) {
            return callback({
                error: true,
                mensaje: "El nombre/sala es necesario",
            });
        }

        client.join(data.sala);

        let personas = usuarios.agregarPersona(client.id, data.nombre, data.sala);

        client.broadcast
            .to(data.sala)
            .emit("listaPersona", usuarios.getPersonasPorSala(data.sala));

        client.broadcast
            .to(data.sala)
            .emit(
                "crearMensaje",
                crearMensaje("Administrador", `${data.nombre} se unió`)
            );

        callback(usuarios.getPersonasPorSala(data.sala));
        console.log(personas);
    });

    client.on("crearMensaje", (data, callback) => {
        let persona = usuarios.getPersona(client.id);
        console.log("hello");

        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit("crearMensaje", mensaje);

        callback(mensaje);
    });

    client.on("disconnect", () => {
        let personaBorrada = usuarios.borrarPersonas(client.id);
        console.log(personaBorrada);

        client.broadcast
            .to(personaBorrada.sala)
            .emit(
                "crearMensaje",
                crearMensaje("Administrador", `${personaBorrada.nombre} salió`)
            );

        client.broadcast
            .to(personaBorrada.sala)
            .emit("listaPersona", usuarios.getPersonasPorSala(personaBorrada.sala));
    });

    client.on("mensajePrivado", (data) => {
        let persona = usuarios.getPersona(client.id);
        client.broadcast
            .to(data.para)
            .emit("mensajePrivado", crearMensaje(persona.nombre, data.mensaje));
    });
});