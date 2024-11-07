const APP_ID = "b4a970ea94144c968de841759f6d2f2e";
const TOKEN = "007eJxTYJgozvLMNm2b36GizNkt5xpTonjkhf5rT3Tgz1u9M33TLT0FhiSTREtzg9RESxNDE5NkSzOLlFQLE0NzU8s0sxSjNKPUVQG66Q2BjAzzl8oxMjJAIIjPwpCbmJnHwAAAwVIdZg==";
const CHANNEL = "main";

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

let localTracks = [];
let remoteUsers = {};
let joinTimeout;
let mediaRecorder;
let recordedChunks = [];

// Función para solicitar permisos de micrófono y cámara
async function requestPermissions() {
    try {
        localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        return true; // Permisos concedidos
    } catch (error) {
        showPermissionAlert(); // Mostrar alerta de permisos
        return false; // Permisos no concedidos
    }
}

// Mostrar alerta de permisos
function showPermissionAlert() {
    alert("Se requieren permisos de micrófono y cámara para continuar. ¡No te vayas! 😱 Arriba en el 🔒, puedes acceder para otorgar los permisos correspondientes.");
    location.reload(); // Refrescar la página después de mostrar la alerta
}

// Función para unirse y mostrar el stream local
let joinAndDisplayLocalStream = async () => {
    client.on('user-published', handleUserJoined);
    client.on('user-left', handleUserLeft);

    let UID = await client.join(APP_ID, CHANNEL, TOKEN, null);

    if (await requestPermissions()) {
        let player = `<div class="video-container" id="user-container-${UID}">
                            <div class="video-player" id="user-${UID}"></div>
                      </div>`;
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);
        
        localTracks[1].play(`user-${UID}`);
        await client.publish([localTracks[0], localTracks[1]]);
    }
};

// Función para unirse al stream
let joinStream = async () => {
    clearJoinTimeout(); // Limpiar el temporizador si se hace clic
    const permissionsGranted = await requestPermissions(); // Verificar permisos

    if (permissionsGranted) {
        document.body.style.backgroundImage = "url('./454529.jpg')";
        document.body.style.backgroundSize = "cover"; 

        await joinAndDisplayLocalStream();
        document.getElementById('join-btn').style.display = 'none';
        document.getElementById('stream-controls').style.display = 'flex';
        document.querySelector('.lightsaber').style.display = 'block'; // Mostrar el sable de luz
    }
};

// Manejar la unión de usuarios remotos
let handleUserJoined = async (user, mediaType) => {
    remoteUsers[user.uid] = user;
    await client.subscribe(user, mediaType);

    if (mediaType === 'video') {
        let player = document.getElementById(`user-container-${user.uid}`);
        if (player != null) {
            player.remove();
        }

        player = `<div class="video-container" id="user-container-${user.uid}">
                        <div class="video-player" id="user-${user.uid}"></div>
                 </div>`;
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);
        user.videoTrack.play(`user-${user.uid}`);
    }

    // Reproducir el audio pero mantenerlo silenciado para otros usuarios
    if (mediaType === 'audio') {
        await user.audioTrack.setMuted(true); // Silenciar el audio remoto
        user.audioTrack.play(); // Reproducir el audio, pero como está silenciado, no se oirá
    }
};

// Manejar la salida de usuarios remotos
let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid];
    document.getElementById(`user-container-${user.uid}`).remove();
};

// Dejar el stream y limpiar
let leaveAndRemoveLocalStream = async () => {
    for (let track of localTracks) {
        track.stop();
        track.close();
    }

    await client.leave();
    document.getElementById('join-btn').style.display = 'block';
    document.getElementById('stream-controls').style.display = 'none';
    document.querySelector('.lightsaber').style.display = 'none'; // Ocultar el sable de luz
    document.getElementById('video-streams').innerHTML = '';

    // Detener la grabación si está en curso
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
};

// Alternar micrófono
let toggleMic = async (e) => {
    if (localTracks[0].muted) {
        await localTracks[0].setMuted(false);
        e.target.innerText = 'Mic on';
        e.target.style.backgroundColor = 'cadetblue';
    } else {
        await localTracks[0].setMuted(true);
        e.target.innerText = 'Mic off';
        e.target.style.backgroundColor = '#EE4B2B';
    }
};

// Alternar cámara
let toggleCamera = async (e) => {
    if (localTracks[1].muted) {
        await localTracks[1].setMuted(false);
        e.target.innerText = 'Camera on';
        e.target.style.backgroundColor = 'cadetblue';
    } else {
        await localTracks[1].setMuted(true);
        e.target.innerText = 'Camera off';
        e.target.style.backgroundColor = '#EE4B2B';
    }
};

// Función para limpiar el temporizador
function clearJoinTimeout() {
    if (joinTimeout) {
        clearTimeout(joinTimeout);
    }
}

// Iniciar la conexión automáticamente al cargar la página
async function startConnection() {
    const permissionsGranted = await requestPermissions();
    if (permissionsGranted) {
        joinStream(); // Iniciar conexión si se conceden permisos
    } else {
        document.getElementById('join-btn').style.display = 'block'; // Mantener visible
    }
}

// Funciones para grabar video al hacer hover sobre el sable
const sableSound = document.getElementById('sable-sound');
sableSound.volume = 0.1; // Establecer el volumen al 10%

async function startRecording() {
    if (localTracks[0].muted) {
        await localTracks[0].setMuted(false);
    }

    sableSound.currentTime = 0;
    sableSound.play();

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(recordedBlob);
        const videoElement = document.getElementById('recorded-video');
        videoElement.src = url;
        videoElement.style.display = 'block';
        recordedChunks = []; // Limpiar los chunks grabados
    };

    mediaRecorder.start();
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
}

// Añadir event listeners
document.getElementById('join-btn').addEventListener('click', joinStream);
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream);
document.getElementById('mic-btn').addEventListener('click', toggleMic);
document.getElementById('camera-btn').addEventListener('click', toggleCamera);
document.querySelector('.lightsaber').addEventListener('mouseover', startRecording);
document.querySelector('.lightsaber').addEventListener('mouseout', stopRecording);

// Iniciar conexión al cargar la página
document.addEventListener('DOMContentLoaded', startConnection);


// new omni reparado
