export async function fetchAgoraConfig() {
    try {
        const response = await fetch('https://wcwgss5p-3000.brs.devtunnels.ms/agoraConfig.json');

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json(); // Asegúrate de que el servidor devuelve JSON
        return {
            appId: data.APP_ID,
            token: data.TOKEN,
            channel: data.CHANNEL
        };
    } catch (error) {
        console.error('Error fetching Agora config:', error);
        return null; // Maneja el error adecuadamente
    }
}
