const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticationToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1]; // Extract the token from "Bearer <token>"

    // No token, unauthorized
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden if the token is invalid
        req.user = user; // Attach the decoded user info to the request
        next();
    });
}





module.exports = {
    authenticationToken,
};
