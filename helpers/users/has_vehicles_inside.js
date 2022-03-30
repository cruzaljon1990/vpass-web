const is_in = require('../vehicle/is_in');

module.exports = (user) => {
  user.has_vehicles_inside = false;
  user.vehicles.forEach((vehicle) => {
    vehicle.is_in = is_in(vehicle);
    if (vehicle.is_in) {
      user.has_vehicles_inside = true;
    }
  });
};
