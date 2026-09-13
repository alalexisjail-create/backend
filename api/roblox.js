module.exports = async function handler(req, res) {
  // Configurar encabezados CORS para permitir peticiones desde cualquier origen
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Falta el parámetro username' });
  }

  try {
    // 1. Obtener ID del usuario desde la API oficial de Roblox
    const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: true })
    });

    const userData = await userRes.json();

    if (!userData.data || userData.data.length === 0) {
      return res.status(404).json({ error: 'Usuario de Roblox no encontrado' });
    }

    const user = userData.data[0];
    const userId = user.id;
    const displayName = user.displayName;
    const uniqueUsername = user.name;

    // 2. Obtener la foto de perfil (Headshot 420x420)
    const avatarRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`
    );

    const avatarData = await avatarRes.json();

    if (!avatarData.data || avatarData.data.length === 0) {
      return res.status(500).json({ error: 'No se pudo obtener la imagen del avatar' });
    }

    const imageUrl = avatarData.data[0].imageUrl;

    // Responder al Widget con los datos en formato JSON
    return res.status(200).json({
      userId,
      displayName,
      uniqueUsername,
      imageUrl
    });

  } catch (error) {
    return res.status(500).json({ error: 'Error interno en el servidor al consultar Roblox' });
  }
};
