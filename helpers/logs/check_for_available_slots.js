const Log = require('../../db/mongo/Log');
const SitePrefs = require('../../db/mongo/SitePrefs');

module.exports = async (is_vip) => {
  let limits = { vip: 0, non_vip: 0 };
  const site_prefs = (
    await SitePrefs.find({
      key: { $regex: '.*limit.*' },
    })
  ).forEach((site_pref, index) => {
    if (site_pref.key == 'limit_vip') {
      limits.vip = parseInt(site_pref.value);
    } else if (site_pref.key == 'limit_non_vip') {
      limits.non_vip = parseInt(site_pref.value);
    }
  });
  let parking_slots_available = {
    vip: 0,
    non_vip: 0,
  };

  const vip_count = await Log.count({ is_vip: true, time_out: null });
  const non_vip_count = await Log.count({ is_vip: false, time_out: null });
  parking_slots_available.vip = limits.vip - vip_count;
  parking_slots_available.non_vip = limits.non_vip - non_vip_count;

  if (is_vip) {
    if (parking_slots_available.non_vip + parking_slots_available.vip <= 0) {
      return false;
    }
  } else {
    if (parking_slots_available.non_vip <= 0) {
      return false;
    }
  }
  return true;
};
