const producer = require('./kafkaProducer');
let userDB;

module.exports = (injectedTaskDB, injectedUserDB) => {
  taskDB = injectedTaskDB;
  userDB = injectedUserDB;

  return {
    createTask,
    closeTask,
    shuffleTasks
  };
};

function createTask(req, res) {
  userDB.getAllEmployees((responseData) => {
    const employees = responseData.results.rows;
    const randomEmployeeIndex = Math.floor(Math.random() * (employees.length - 1));

    const taskData = {
      title: req.body.title,
      jiraId: req.body.jira_id,
      assigned_public_account_id: employees[randomEmployeeIndex].public_id
    }

    taskDB.createTask(taskData.title, taskData.jiraId, taskData.assigned_public_account_id, (result) => {
      // -------------------- Produce BE event -------------------- //
      const be_event = {
        eventName: 'TaskCreated',
        eventId: 'TASK_CREATED',
        eventVersion: 1,
        eventTime: Date.now().toString(),
        eventProducer: 'TASK_SERVICE',
        data: {
          publicId: result.results.rows[0].public_id,
          assignedPublicAccountId: result.results.rows[0].assigned_public_account_id,
        }
      }

      console.log({ event: JSON.stringify(be_event), topic: 'tasks' });

      producer.call({ event: be_event, topic: 'tasks'});
      // -------------------- End of BE Produce event -------------------- //

      // -------------------- Produce CUD event -------------------- //
      const cud_event = {
        eventName: 'TaskCreated',
        eventId: 'TASK_CREATED',
        eventVersion: 2,
        eventTime: Date.now().toString(),
        eventProducer: 'TASK_SERVICE',
        data: {
          publicId: result.results.rows[0].public_id,
          title: result.results.rows[0].title,
          jiraId: result.results.rows[0].jira_id,
          assignedPublicAccountId: result.results.rows[0].assigned_public_account_id,
        }
      }

      console.log({ event: JSON.stringify(cud_event), topic: 'tasks-stream' });

      producer.call({ event: cud_event, topic: 'tasks-stream'});
      // -------------------- End of CUD Produce event -------------------- //

      res.send("TaskCreated");
    });

  });
}

function closeTask(req, res) {
  const closed_public_account_id = req.body.closed_public_account_id;
  const task_id = req.body.id;

  taskDB.closeTask(task_id, closed_public_account_id, (result) => {
    // -------------------- Produce BE event -------------------- //
    const be_event = {
      eventName: 'TaskClosed',
      eventId: 'TASK_CLOSED',
      eventVersion: 1,
      eventTime: Date.now().toString(),
      eventProducer: 'TASK_SERVICE',
      data: {
        publicId: result.results.rows[0].public_id,
        closedPublicAccountId: result.results.rows[0].closed_public_account_id,
      }
    }

    console.log({ event: JSON.stringify(be_event), topic: 'tasks' });

    producer.call({ event: be_event, topic: 'tasks'});
    // -------------------- End of BE Produce event -------------------- //

    res.send("TaskClosed");
  });
}

function shuffleTasks(req, res) {
  userDB.getAllEmployees((responseData) => {
    const employees = responseData.results.rows;

    taskDB.getAllOpenedTasks((allOpenedTasksResponse) => {
      const allTasks = allOpenedTasksResponse.results.rows;

      allTasks.forEach((task) => {
        const randomEmployeeIndex = Math.floor(Math.random() * (employees.length - 1));

        taskDB.assignTask(task.id, employees[randomEmployeeIndex].public_id, (result) => {
          // -------------------- Produce BE event -------------------- //
          const be_event = {
            eventName: 'TaskAssigned',
            eventId: 'TASK_ASSIGNED',
            eventVersion: 1,
            eventTime: Date.now().toString(),
            eventProducer: 'TASK_SERVICE',
            data: {
              publicId: result.results.rows[0].public_id,
              assignedPublicAccountId: result.results.rows[0].assigned_public_account_id,
            }
          }

          console.log({ event: JSON.stringify(be_event), topic: 'tasks' });

          producer.call({ event: be_event, topic: 'tasks'});
          // -------------------- End of BE Produce event -------------------- //
        })
      })
    });
  });

  res.send("TasksShuffleStarted");
}
