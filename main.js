const APP_ID = "b4a970ea94144c968de841759f6d2f2e";
const CHANNEL = "main";

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

let localTracks = [];
let remoteUsers = {};

// Función para solicitar permisos de micrófono y cámara
async function requestPermissions() {
    try {
        localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        return true; // Permisos concedidos
    } catch (error) {
        alert("Se requieren permisos de micrófono y cámara para continuar.");
        return false; // Permisos no concedidos
    }
}

// Función para unirse y mostrar el stream local
let joinAndDisplayLocalStream = async () => {
    client.on('user-published', handleUserJoined);
    client.on('user-left', handleUserLeft);

    const token = await fetchToken(CHANNEL);
    const UID = await client.join(APP_ID, CHANNEL, token, null);

    if (await requestPermissions()) {
        let player = `<div class="video-container" id="user-container-${UID}">
                            <div class="video-player" id="user-${UID}"></div>
                      </div>`;
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);
        
        localTracks[1].play(`user-${UID}`);
        await client.publish([localTracks[0], localTracks[1]]);
    }
};

// Función para obtener el token del servidor
async function fetchToken(channelName) {
    const response = await fetch(`https://wcwgss5p-3000.brs.devtunnels.ms/getToken?channelName=${channelName}`);
    const data = await response.json();
    return data.token;
}

// Manejar la unión de usuarios remotos
let handleUserJoined = async (user, mediaType) => {
    remoteUsers[user.uid] = user;
    await client.subscribe(user, mediaType);

    if (mediaType === 'video') {
        let player = `<div class="video-container" id="user-container-${user.uid}">
                        <div class="video-player" id="user-${user.uid}"></div>
                     </div>`;
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);
        user.videoTrack.play(`user-${user.uid}`);
    }

    if (mediaType === 'audio') {
        user.audioTrack.play();
    }
};

// Manejar la salida de usuarios remotos
let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid];
    document.getElementById(`user-container-${user.uid}`).remove();
};

// Dejar el stream y limpiar
let leaveAndRemoveLocalStream = async () => {
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].stop();
        localTracks[i].close();
    }

    await client.leave();
    document.getElementById('video-streams').innerHTML = '';
};

// Añadir event listeners
document.getElementById('join-btn').addEventListener('click', joinAndDisplayLocalStream);
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream);

// Iniciar conexión al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('join-btn').style.display = 'block';
});
