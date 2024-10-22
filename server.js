
const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;

let clientMap = {}; 
let clientCounter = 0; 

app.set('trust proxy', true);

app.use(async (req, res, next) => {
    const userIp = req.ip; 
    
    if (!clientMap[userIp]) {
        clientCounter++; 
        clientMap[userIp] = `Cliente ${clientCounter}`; 
    }

    const clientId = clientMap[userIp]; 

    try {
        
        const response = await axios.get('https://api.ipify.org?format=json');
        const publicIp = response.data.ip;

        console.log(`Método: ${req.method}, URL: ${req.url} ////  IP pública: ${publicIp} //// -> ${clientId}`);
    } catch (error) {
        console.error('Error al obtener la IP pública:', error.message);
    }

    next();
});


app.use(express.static(path.join(__dirname)));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
