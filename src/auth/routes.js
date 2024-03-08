module.exports = (router, app, authenticator) => {
  router.post("/register", authenticator.registerUser);
  router.post("/login", app.oauth.grant());
  router.post("/change-user", authenticator.changeUser);
  router.post("/delete-user", authenticator.deleteUser);
  return router;
};