const bcrypt = require('bcrypt');

const password = 'Admin123';

bcrypt.hash(password, 10).then(hash => {
  console.log('Nouveau hash :', hash);
});