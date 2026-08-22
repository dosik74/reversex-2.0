export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Перенаправляем на прямую ссылку для скачки файла
  // Вы можете замените эту ссылку на URL вашего облачного хранилища
  const downloadUrl = process.env.FILE_BROWSER_DOWNLOAD_URL || 'https://example.com/Install_ReverseBrowser.exe';

  res.redirect(302, downloadUrl);
}
