/*exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  } else {
    return res.redirect('/login');
  }
};*/

module.exports = {
  isAdmin: (req, res, next) => {
      if (req.session.admin) {
          console.log('Admin déjà connecté, accès autorisé');
          return next();
      }
      console.log('Accès refusé : pas de session admin');
      res.redirect('/login');
  },
  
  redirectIfLogged: (req, res, next) => {
      if (req.session.admin) {
          console.log('Redirection vers /admin (déjà connecté)');
          return res.redirect('/admin');
      }
      next();
  }
};





