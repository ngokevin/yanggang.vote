const fetch = require('node-fetch');
const fs = require('fs');
const moment = require('moment');

const db = require('../events.json');

function getUrl (page) {
  return `https://api.mobilize.us/v1/organizations/1396/events?page=${page}&per_page=100&timeslot_start=gte_${moment().unix()}`;
}

function clean () {
  Object.keys(db).forEach(id => {
    const event = db[id];
    if (event.timeslots[0].start_date < moment().unix()) {
      delete db[id];
    }
  });
};

module.exports.scrape = function scrape () {
  fetch(getUrl(1))
    .then(res => res.json())
    .then(data => {
      data.data.forEach(event => {
        db[event.id] = event;
        fs.writeFileSync('events.json', JSON.stringify(db));
      });
    });
};

require('make-runnable');
