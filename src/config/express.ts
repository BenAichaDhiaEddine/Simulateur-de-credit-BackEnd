export {};
import * as express from "express";
const morgan = require("morgan");
const bodyParser = require("body-parser");
const compress = require("compression");
const cors = require("cors");
const helmet = require("helmet");
const passport = require("passport");
const routes = require("../api/routes/v1");
const { logs, UPLOAD_LIMIT } = require("./vars");
const strategies = require("./passport");
const error = require("../api/middlewares/error");
const useragent = require("express-useragent");
const path = require("path");
/**
 * Express instance
 * @public
 */
const app = express();

// request logging. dev: console | production: file
app.use(morgan(logs));

app.use("/v1", express.static(path.join(__dirname, "../../uploads")));

// parse body params and attache them to req.body
app.use(bodyParser.json({ limit: `${UPLOAD_LIMIT}mb` }));
app.use(bodyParser.urlencoded({ extended: true, limit: `${UPLOAD_LIMIT}mb` }));

// gzip compression
app.use(compress());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// To get information about userAgent
app.use(useragent.express());

// --- NOTE: for testing in DEV, allow Access-Control-Allow-Origin: (ref: https://goo.gl/pyjO1H)
// app.all('/*', function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "X-Requested-With");
//   next();
// });

// TODO je comprend pas encore l'utiliter de ce middleware
app.use((req: any, res: express.Response, next: express.NextFunction) => {
  req.uuid = `uuid_${Math.random()}`; // use "uuid" lib
  next();
});

// enable authentication
app.use(passport.initialize());
passport.use("jwt", strategies.jwt);
passport.use("facebook", strategies.facebook);
passport.use("google", strategies.google);

// mount api v1 routes
app.use("/v1", routes);

// if error is not an instanceOf APIError, convert it.
app.use(error.converter);

// catch 404 and forward to error handler
app.use(error.notFound);

// error handler, send stacktrace only during development
app.use(error.handler);

module.exports = app;
