const jwt = require('jsonwebtoken');
const Session = require('../db/mongo/Session');

module.exports = (permissions = null) => {
  return async (req, res, next) => {
    let permitted = false;
    try {
      const { authorization } = req.headers;
      if (authorization) {
        var bearer_token = authorization.split(' ');
        if (bearer_token.length == 2 && bearer_token[0] == 'Bearer') {
          const token = bearer_token[1];
          const decoded = jwt.decode(token, process.env.JWT_SECRET);
          const db_token = (await Session.findOne({ token })).token;

          if (db_token && token === db_token) {
            if (permissions) {
              if (
                permissions.includes('all') ||
                permissions.includes(decoded.type) ||
                (permissions.includes('api_key') &&
                  req.query.k == process.env.API_KEY)
              ) {
                permitted = true;
              }

              if (!permitted) {
                return res.status(401).send({ error: 'Unauthorized!' });
              }
            }
            req.user_data = { ...decoded, token };
            if (req.user_data) {
              return next();
            }
          }
        }
      }
    } catch (error) {
      return res.status(401).send({ error: 'Unauthorized!' });
    }
    return res.status(401).send({ error: 'Unauthorized!' });
  };
};
