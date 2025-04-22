var passport = require('passport');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var User = require('./Users');
const winston = require('winston');
require('dotenv').config();

// Create logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// If we're not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
opts.secretOrKey = process.env.SECRET_KEY;

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
        logger.info('Processing JWT payload', { payload: jwt_payload });
        const username = jwt_payload.username;
        const user = await User.findOne({ username: username });
        
        if (!user) {
            logger.warn('User not found', { username: username });
            return done(null, false);
        } else {
            logger.info('User authenticated successfully', { username: username });
            return done(null, user);
        }
    } catch (err) {
        logger.error('Authentication error', { error: err.message });
        return done(err, false);
    }
}));

exports.isAuthenticated = passport.authenticate('jwt', { session: false });
exports.secret = opts.secretOrKey;