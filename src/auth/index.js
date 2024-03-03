// Database imports
const pgPool = require("./db/pgWrapper.js");
const tokenDB = require("./db/tokenDB.js")(pgPool);
const userDB = require("./db/userDB.js")(pgPool);

// OAuth imports
const oAuthService = require("./tokenService.js")(userDB, tokenDB);
const oAuth2Server = require("node-oauth2-server");

// Express
const express = require("express");
const app = express();
app.oauth = oAuth2Server({
  model: oAuthService,
  grants: ["password"],
  debug: true,
});

// Auth and routes
const authenticator = require("./authenticator.js")(userDB);
const routes = require("./routes.js")(express.Router(), app, authenticator);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(app.oauth.errorHandler());
app.use("/auth", routes);

const port = 3000;
app.listen(port, () => {
  console.log(`Auth service. Listening on port ${port}`);
});