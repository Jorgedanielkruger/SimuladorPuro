const express = require('express');
const path = require('path');
const app = express();

// Sirve archivos estáticos desde la raíz del proyecto
app.use(express.static(__dirname)); 

// Redirige todas las rutas a index.html (para SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
