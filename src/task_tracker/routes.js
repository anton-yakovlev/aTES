module.exports = (router, app) => {
  router.get("/create-task", authorise, createTask);
  router.get("/assign-task", authorise, assignTask);
  router.get("/close-task", authorise, closeTask);
  router.get("/shuffle-tasks", authorise, shuffleTasks);

  return router;
};

function authorise (req, res, next) {
  console.log('authorise');
  next();
}

function createTask(query, res) {
  res.send("createTask");
}

function closeTask(query, res) {
  res.send("closeTask");
}

function assignTask(query, res) {
  res.send("assignTask");
}

function shuffleTasks(query, res) {
  res.send("shuffleTasks");
}
