module.exports = (vehicle) => {
  let is_in = false;
  if (vehicle.logs) {
    vehicle.logs.forEach((log, index) => {
      if (!log.time_out) {
        is_in = true;
      }
    });
  }
  return is_in;
};
