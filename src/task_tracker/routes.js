module.exports = (router,  taskService) => {
  router.post("/create-task", authorise, taskService.createTask);
  router.post("/close-task", authorise, taskService.closeTask);
  router.post("/shuffle-tasks", authorise, taskService.shuffleTasks);

  return router;
};

function authorise (req, res, next) {
  console.log('authorise');
  next();
}