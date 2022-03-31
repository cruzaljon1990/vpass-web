const is_in = require('../vehicle/is_in');

module.exports = async (user) => {
  user.has_vehicles_inside = false;
  if (user.vehicles) {
    if (user.vehicles.length > 0) {
      user.vehicles.forEach((vehicle) => {
        vehicle.is_in = is_in(vehicle);
        if (vehicle.is_in) {
          user.has_vehicles_inside = true;
        }
      });
    }
  } else {
    user.vehicles = [];
  }
};
