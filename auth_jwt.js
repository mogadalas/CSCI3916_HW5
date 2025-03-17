var passport = require('passport');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var User = require('./Users'); // Only import User once!
require('dotenv').config(); // Load environment variables from .env file

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
opts.secretOrKey = process.env.SECRET_KEY;

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
        console.log(jwt_payload);
        const username = jwt_payload.username; // use 'username' is in the payload
        const user = await User.findOne({ username: username }); // Now querying the correct model
        console.log("user", user);

        if (!user) {
            return done(null, false);
        } else {
            return done(null, user);
        }
    } catch (err) {
        return done(err, false);
    }
}));

exports.isAuthenticated = passport.authenticate('jwt', { session: false });
exports.secret = opts.secretOrKey;