const Reddit = require('snoowrap');
const clean = require('./scrape').clean;
const db = require('../events.json');
const fs = require('fs');
const moment = require('moment-timezone');
const nunjucks = require('nunjucks');
const stateAbbr = require('states-abbreviations');

let subreddits = {
  AK: 'AlaskaForYang',
  AL: 'AlabamaForYang',
  AR: 'ArkansasForYang',
  AZ: 'ArizonaForYang',
  CA: 'CaliforniaForYang',
  CO: 'ColoradoForYang',
  CT: 'ConnecticutForYang',
  DC: 'DCForYang',
  DE: 'DelawareForYang',
  FL: 'FloridaForYang',
  GA: 'GeorgiaForYang',
  HI: 'HawaiiForYang',
  IA: 'IowaForYang',
  ID: 'IdahoForYang',
  IL: 'IllinoisForYang',
  IN: 'IndianaForYang',
  KS: 'KansasForYang',
  KY: 'KentuckyForYang',
  LA: 'LouisianaForYang',
  MA: 'MassachusettsForYang',
  MD: 'MarylandForYang',
  ME: 'MaineForYang',
  MI: 'MichiganForYang',
  MN: 'MinnesotaForYang',
  MO: 'MissouriForYang',
  MS: 'MississippiForYang',
  MT: 'MontanaForYang',
  NC: 'NCForYang',
  ND: 'NorthDakotaForYang',
  NE: 'NebraskaForYang',
  NH: 'NewHampshireForYang',
  NJ: 'NewJerseyForYang',
  NM: 'NewMexicoForYang',
  NY: 'NewYorkForYang',
  NV: 'NevadaForYang',
  OH: 'OhioForYang',
  OK: 'OklahomaForYang',
  OR: 'OregonForYang',
  PA: 'PennsylvaniaForYang',
  RI: 'RIForYang',
  SC: 'SouthCarolinaForYang',
  SD: 'SouthDakotaForYang',
  TN: 'TennesseeForYang',
  TX: 'TexasForYang',
  UT: 'UtahForYang',
  VA: 'VirginiaForYang',
  VT: 'VermontForYang',
  WA: 'WashingtonForYang',
  WI: 'WisconsinForYang',
  WV: 'WestVirginiaForYang',
  WY: 'WyomingForYang'
};

if (process.env.TEST) {
  subreddits = {
    CA: 'TestModForYang';
  };
}

const template = `
{% for eventDay in eventDays %}
  {{ eventDay.date }}

  {% for event in eventDay.events %}
    - {{ event }}
  {% endfor %}
{% endfor %}
`;

module.exports.updateSidebar = function post (debug) {
  const client = new Reddit(require('./config.local'));

  Object.keys(subreddits).forEach(state => {
    const subreddit = subreddits[state];

    const eventDays = [];

    // Filter by state and sort by time.
    let stateEvents = Object.keys(db)
      .filter(id => {
        const event = db[id];
        return event.location.region === state;
      })
      .map(id => {
        const event = db[id];
        event.city = event.location.locality;
        event.venue = event.location.venue;

        // Format time.
        let eventTime = moment.unix(event.timeslots[0].start_date).tz(event.timezone).format('ddd M/D LT').replace(/:00/g, '');
        const endTime = moment.unix(event.timeslots[0].end_date).tz(event.timezone).format('LT').replace(/:00/g, '');
        eventTime = `${eventTime}-${endTime}`;
        eventTime = eventTime.replace(/ PM/g, 'PM').replace(/ AM/g, 'AM');
        event.time = eventTime;

        return event;
      })
      .sort(event => event.start_date);

    // Bucket into days.
  });
};
