const express = require('express');
const router = express.Router();

router.get('/login', (req, res) => {
  res.send(`
    <form action="/login" method="POST">
      <input type="text" name="username" placeholder="Username" required>
      <input type="password" name="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
  `);
});

router.post('/login', (req, res) => {
  console.log('=== REQUEST BODY ===', req.body);
  res.json({
    received: true,
    body: req.body,
    session: req.session
  });
});

module.exports = router;