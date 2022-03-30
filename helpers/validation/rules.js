module.exports = {
  user_create: {
    username: 'required|unique:User.username',
    password: 'required',
    firstname: 'required',
    lastname: 'required',
    type: 'in:admin,guard,driver',
    birthday: 'date',
    status: 'integer|in:1,0',
  },
  user_login: {
    username: 'required',
    password: 'required',
  },
  user_update: {
    type: 'in:admin,guard,driver',
    birthday: 'date',
    status: 'integer|in:1,0',
    id: 'required',
  },
  // user_update_profile: {
  //   password: 'required',
  //   firstname: 'string',
  //   lastname: 'string',
  //   id: 'required|integer',
  // },
  user_id: {
    id: 'required',
  },
  vehicle_create: {
    model: 'required',
    plate_no: 'required',
  },
  vehicle_update: {
    model: 'required',
    plate_no: 'required',
    id: 'required',
  },
  vehicle_id: {
    id: 'required',
  },
  server_logs_add: {
    log: 'required',
  },
};
