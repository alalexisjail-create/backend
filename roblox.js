// api/roblox.js
export default async function handler(req, res) {
  // Configuración de CORS para permitir que tu sitio web consulte este servidor
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Obtener el nombre de usuario de la consulta URL (?username=...)
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Debes proporcionar un nombre de usuario.' });
  }

  try {
    // 1. Petición DIRECTA a Roblox para buscar el ID y nombres reales
    const searchRes = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}`);
    if (!searchRes.ok) throw new Error('Error en la API de búsqueda de Roblox');
    
    const searchData = await searchRes.json();

    if (!searchData.data || searchData.data.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado en Roblox.' });
    }

    // Coincidencia exacta o el primer resultado
    const userMatch = searchData.data.find(u => u.name.toLowerCase() === username.toLowerCase()) || searchData.data[0];

    // 2. Petición DIRECTA a Roblox para obtener el Headshot (Cabeza)
    const avatarRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userMatch.id}&size=420x420&format=Png&isCircular=false`);
    if (!avatarRes.ok) throw new Error('Error en la API de imágenes de Roblox');
    
    const avatarData = await avatarRes.json();

    if (!avatarData.data || avatarData.data.length === 0 || !avatarData.data[0].imageUrl) {
      return res.status(404).json({ error: 'No se pudo generar la imagen del avatar.' });
    }

    // Devolver respuesta limpia e instantánea a tu página web
    return res.status(200).json({
      id: userMatch.id,
      uniqueUsername: userMatch.name,
      displayName: userMatch.displayName,
      imageUrl: avatarData.data[0].imageUrl
    });

  } catch (error) {
    return res.status(500).json({ error: 'Error de servidor al conectar con Roblox.' });
  }
}