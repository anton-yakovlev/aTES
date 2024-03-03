const producer = require('./kafkaProducer');
let userDB;

module.exports = (injectedUserDB) => {
  userDB = injectedUserDB;

  return {
    registerUser,
    deleteUser,
    changeUser
  };
};

function registerUser(req, res) {
  userDB.isValidUser(req.body.email, (error, isValidUser) => {
    if (error || !isValidUser) {
      const message = error
        ? "Something went wrong!"
        : "This user already exists!";

      sendResponse(res, message, error);

      return;
    }

    userDB.register(req.body.email, req.body.password, (response) => {
      sendResponse(
        res,
        response.error === undefined ? "Success!!" : "Something went wrong!",
        response.error
      );

      // -------------------- Produce CUD event -------------------- //
      const event = {
        eventName: 'AccountCreated',
        data: {
          public_id: response.results.rows[0].public_id,
          email: response.results.rows[0].email,
          fullname: response.results.rows[0].fullname,
          position: response.results.rows[0].position,
        }
      }

      console.log({ event: JSON.stringify(event), topic: 'accounts-stream' });

      producer.call({ event, topic: 'accounts-stream'});

      // -------------------- End of CUD Produce event -------------------- //
    });
  });
}

function changeUser(req, res) {
  const {user_id, email, fullname, position, active} = req.body;

  userDB.getUserById(user_id, (userResponse) => {
    if (!userResponse || userResponse.error) {
      sendResponse(res, 'Something went wrong!', userResponse.error);
      return;
    }

    let isNewPosition = userResponse.results.rows[0].position !== position;

    if (userResponse) {
      userDB.changeUser(user_id, email, fullname, position, active, (response) => {
        sendResponse(
          res,
          response.error === undefined ? "Success!!" : "Something went wrong!",
          response.error
        );

        // -------------------- Produce CUD event -------------------- //

        const cud_event = {
          eventName: 'AccountUpdated',
          data: {
            public_id: response.results.rows[0].public_id,
            email: response.results.rows[0].email,
            fullname: response.results.rows[0].fullname,
            position: response.results.rows[0].position,
          }
        }

        console.log({ event: JSON.stringify(cud_event), topic: 'accounts-stream'});

        producer.call({ event: cud_event, topic: 'accounts-stream' });

        // -------------------- End of CUD Produce event -------------------- //

        if (isNewPosition) {
          // -------------------- Produce BE event -------------------- //

          const be_event = {
            eventName: 'AccountPotionChanged',
            data: {
                public_id: response.results.rows[0].public_id,
                position: response.results.rows[0].position,
            }
          };

          console.log({ event: JSON.stringify(be_event), topic: 'accounts'});

          producer.call({ event: be_event, topic: 'accounts'});

          // -------------------- End of BE Produce event -------------------- //
        };
      });
    }
  });
};

function deleteUser(req, res) {
  userDB.deleteUser(req.body.user_id, (response) => {
    sendResponse(
      res,
      response.error === undefined ? "Success!!" : "Something went wrong!",
      response.error
    );

    // -------------------- Produce CUD event -------------------- //

    const event = {
      eventName: 'AccountDeleted',
      data: {
        public_id: response.results.rows[0].public_id,
      }
    }

    console.log({ event: JSON.stringify(event), topic: 'accounts-stream'});

    producer.call({ event, topic: 'accounts-stream'});

    // -------------------- End of CUD Produce event -------------------- //
  });
};

function sendResponse(res, message, error) {
  res.status(error !== undefined ? 400 : 200).json({
    message: message,
    error: error,
  });
}