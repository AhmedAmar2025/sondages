

const express = require('express');
const app = express();

app.get('/', (req, res) => {
  console.log('Requête reçue sur /');
  res.send("Hello world");
});

app.listen(3001, () => {
  console.log("Serveur minimal démarré sur http://localhost:3001");
});