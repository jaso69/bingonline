var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var messages = [{
    id: 1,
    text: 'Bienvenido al bingo',
    author: 'jaso'
}];

var users = [];
var partida = false;
var jugador = null;
var pausa = false;
var bombo = [];
var tiradas = 0;

var sleep = () =>{
    return new Promise(resolve => setTimeout(resolve, 4000));
};

app.use(express.static('public'));

app.get('/hello', function (req, res) {
    res.status(200).send("hola desde el servidor");
});

io.on('connect', function (socket) {
    console.log('Nueva conexion');
    socket.emit('messages', messages);
    socket.on('new-message', function (data) {
        messages.push(data);
        io.sockets.emit('messages', messages);
    });
    socket.on('nuevo-usuario', function (data) {
        let dato = {nombre: data.nombre, partida: partida};
        users.push(dato);
        io.sockets.emit('usuarios', users);
    });
    socket.on('nuevo-juego', function () {
        if (!partida) {
            for(let i = 0; i < 90; i++){
                bombo[i] = false;
            }
            io.sockets.emit('partida-iniciada', users);
            partida = true;
            tirada();
        } else {
            let dato = {nombre: null, jugador: false};
            io.sockets.emit('partida-iniciada', dato);
        }
    });
    socket.on('fin', function (data) {
        jugador = data;
        partida = false;
        tiradas = 0;
        users = [];
    });
    socket.on('pausa', function (data) {
       pausa = true;
       io.sockets.emit('pausar', data);
    });

    socket.on('seguir', function () {
        pausa =false;
        io.sockets.emit('seguimos');
        tirada();
    });

    socket.on('linea', function (data) {
        pausa = true;
        io.sockets.emit('linea_song', data);
    });

    socket.on('bingo', function (data) {
        partida = false;
        io.sockets.emit('bingo_song', data);
    });

});
function tirada(){
    if (partida) {
        if (!pausa) {
            sleep().then(() => {
                bola();
            });
        }
    } else {
        io.sockets.emit('terminar', jugador);
    }
}

function otra_bola() {
    if(partida) {
        bola();
    } else {
        io.sockets.emit('terminar', jugador);
    }
}

function bola(){
    let numero = Math.round(Math.random() * (80 - 1)) + 1;
    if (tiradas >= 80){
        io.sockets.emit('terminar', jugador);
        partida = false;
    }
    if(!bombo[numero]) {
        bombo[numero] = true;
        let dato = {numero: numero};
        io.sockets.emit('bola', dato);
        tiradas++;
        tirada();
    } else {
        otra_bola();
    }
}

server.listen(80, function () {
    console.log('servidor corriendo');
});