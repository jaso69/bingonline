var socket = io.connect('http://ec2-18-221-32-176.us-east-2.compute.amazonaws.com/', {'forceNew': true});

var user = null;
var synth = window.speechSynthesis;
var playSound = null;
var jugador = false;
var indice = null;
var reg = false;

socket.on('usuarios', function (data) {
    let i;
    for(i=0; i < data.length; i++){
        if(data[i].nombre === user.nombre){
            jugador = true;
            indice = i;
        }
    }
    if(jugador) {
        if (!data[indice].partida) {
            document.getElementById('nuevo_usuario').style.display = 'none';
            document.getElementById('bingo').style.display = 'inline';
            if(!reg) {
                playSound = new SpeechSynthesisUtterance("bienvenido" + data[indice].nombre);
                synth.speak(playSound);
                reg = true;
            }
            render();
            render_usuarios(data);
        } else {
            document.getElementById('esperar').style.display = 'inline';
        }
    }
});

socket.on('partida-iniciada', function (data) {

    if(jugador) {
        playSound = new SpeechSynthesisUtterance("Empezamos");
        synth.speak(playSound);
        document.getElementById('btn_iniciar').style.display = 'none';
        document.getElementById('label_bola').style.display = 'none';
        document.getElementById('btn_pausa').style.display = 'inline';
        document.getElementById('btn_linea').style.display = 'inline';
        document.getElementById('btn_fin').style.display = 'inline';
        document.getElementById('linea_winner').style.display = 'none';
        document.getElementById('bingo_winner').style.display = 'none';
        render_usuarios(data);
        for (let i = 1; i < 81; i++) {
            let bola = "bola" + i;
            document.getElementById(bola).style.display = 'none';
        }
    } else {
        return null;
    }
});

socket.on('bola',function (data) {
    if(jugador) {
        document.getElementById('label_bola').style.display = 'inline';
        let bola = "bola" + data.numero;
        document.getElementById(bola).style.display = 'inline';
        render_bola(data.numero);
        playSound = new SpeechSynthesisUtterance(data.numero);
        synth.speak(playSound);
        let decena = parseInt(data.numero / 10, 10);
        if (decena > 0) {
            playSound = new SpeechSynthesisUtterance(decena);
            synth.speak(playSound);
            let unidad = data.numero % 10;
            playSound = new SpeechSynthesisUtterance(unidad);
            synth.speak(playSound);
        }
    }
});

socket.on('terminar', function (data) {
    playSound = new SpeechSynthesisUtterance("partida terminada " + data.nombre);
    synth.speak(playSound);
    socket.emit('nuevo-usuario', user);
    document.getElementById('nuevo_usuario').style.display = 'none';
    document.getElementById('bingo').style.display = 'inline';
    document.getElementById('esperar').style.display = 'none';
    document.getElementById('btn_iniciar').style.display = 'inline';
    document.getElementById('label_bola').style.display = 'none';
    document.getElementById('btn_pausa').style.display = 'none';
    document.getElementById('btn_linea').style.display = 'none';
    document.getElementById('btn_fin').style.display = 'none';
    document.getElementById('btn_bingo').style.display = 'none';
    render();
});

socket.on('pausar', function (data) {
    playSound = new SpeechSynthesisUtterance(data.nombre + "ha pedido una pausa");
    synth.speak(playSound);
    document.getElementById('btn_pausa').style.display = 'none';
    document.getElementById('btn_linea').style.display = 'none';
    document.getElementById('btn_fin').style.display = 'none';
    document.getElementById('btn_bingo').style.display = 'none';
    document.getElementById('btn_seguir').style.display = 'inline';
});

socket.on('seguimos', function () {
    document.getElementById('btn_pausa').style.display = 'inline';
    if(document.getElementById('linea_winner').value === undefined) {
        document.getElementById('btn_linea').style.display = 'inline';
    }
    if(document.getElementById('linea_winner').value !== undefined) {
        document.getElementById('btn_bingo').style.display = 'inline';
    }
    document.getElementById('btn_fin').style.display = 'inline';
    document.getElementById('btn_seguir').style.display = 'none';
    playSound = new SpeechSynthesisUtterance("continuamos");
    synth.speak(playSound);
});

socket.on('linea_song', function (data) {
    render_linea(data.nombre);
    document.getElementById('linea_winner').style.display = 'inline';
    playSound = new SpeechSynthesisUtterance(data.nombre + "ha cantado linea, hacemos una pausa para comprobar");
    synth.speak(playSound);
    document.getElementById('btn_pausa').style.display = 'none';
    document.getElementById('btn_seguir').style.display = 'inline';
    document.getElementById('btn_linea').style.display = 'none';
    document.getElementById('btn_bingo').style.display = 'inline';
});

socket.on('bingo_song', function (data) {
    render_bingo(data.nombre);
    document.getElementById('bingo_winner').style.display = 'inline';
    playSound = new SpeechSynthesisUtterance(data.nombre + "ha cantado bingo");
    synth.speak(playSound);
    fin();
});

function render_usuarios(data) {

    var html = data.map(function(elem, index){

        return(`<p>
                 <strong>${elem.nombre}</strong>
        </p>`)

    }).join(" ");



    document.getElementById('usuarios').innerHTML = html;

}

function render() {
    var html = `<strong>${user.nombre}</strong>`;

    document.getElementById('usuario').innerHTML = html;
}

function render_bola(data) {
    var html = `<span class="display-4 p-2 font-weight-bold text-white bg-danger">${data}</span>`;

    document.getElementById('numero').innerHTML = html;
}

function render_linea(nombre) {
    var html = `<strong class="text-info"> Linea: ${nombre}</strong>`;

    document.getElementById('linea_winner').innerHTML = html;
}

function render_bingo(nombre) {
    var html = `<strong class="text-danger"> Bingo: ${nombre}</strong>`;

    document.getElementById('bingo_winner').innerHTML = html;
}

function addUser(e) {
    if(document.getElementById('nombre').value !== "") {
        user = {
            nombre: document.getElementById('nombre').value
        };
        socket.emit('nuevo-usuario', user);
    } else {
        playSound = new SpeechSynthesisUtterance("por favor introduzca su nombre");
        synth.speak(playSound);
    }
    return false;
}

function iniciar(e) {
    socket.emit('nuevo-juego');
    return null;
}

function pausa() {
    socket.emit('pausa', user);
    return null;
}

function seguir() {
    socket.emit('seguir');
    return null;
}

function linea() {
    socket.emit('linea', user);
    return null;
}

function bingo() {
    socket.emit('bingo', user);
    return null;
}

function fin() {

    socket.emit('fin', user);
    return null;
}


