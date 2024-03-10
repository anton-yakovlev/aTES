const EVENT_SCHEMA_META = {
  eventName: 1,
  eventId: 1,
  eventVersion: 1,
  eventTime: 1,
  eventProducer: 1,
  data: 1,
};

const EVENTS_SCHEMA_DATA = {
  AUTH_SERVICE: {
    ACCOUNT_CREATED: {
      1: {
        publicId: 1,
        email: 1,
        position: 1,
      }
    },
    ACCOUNT_UPDATED: {
      1: {
        publicId: 1,
      }
    },
    ACCOUNT_POSITION_CHANGED: {
      1: {
        publicId: 1,
        position: 1,
      }
    },
    ACCOUNT_DELETED: {
      1: {
        publicId: 1,
      }
    }
  },
  TASK_SERVICE: {
    TASK_CREATED: {
      1: {
        publicId: 1,
        description: 1,
        assignedPublicAccountId: 1,
      },
      2: {
        publicId: 1,
        title: 1,
        jiraId: 1,
        assignedPublicAccountId: 1,
      }
    },
    TASK_CLOSED: {
      1: {
        publicId: 1,
        closedPublicAccountId: 1,
      }
    },
    TASK_ASSIGNED: {
      1: {
        publicId: 1,
        assignedPublicAccountId: 1,
      }
    }
  },
  ACCOUNTING_SERVICE: {
    CLOSE_TRANSACTION_CREATED: {
      1: {
        publicId: 1,
        amount: 1,
      }
    }
  }
};

const isValidEvent = (event = {}) => {
  const isMetaValid = Object.keys(EVENT_SCHEMA_META).every((key) => Boolean(event[key]));

  if (!isMetaValid) {
    return false;
  }
  
  let isDataValid = true;

  try {
    const DataSchema = EVENTS_SCHEMA_DATA[event.eventProducer][event.eventId][event.eventVersion];
    isDataValid = Object.keys(DataSchema).every((key) => Boolean(event.data[key]));
  } catch {
    return false;
  }

  return isDataValid;
}

module.exports = {
  EVENT_SCHEMA_META,
  EVENTS_SCHEMA_DATA,
  isValidEvent,
}