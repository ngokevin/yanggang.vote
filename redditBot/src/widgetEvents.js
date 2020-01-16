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
    CA: 'TestModForYang'
  };
}

const template = `
{% for eventDay in eventDays %}
  {{ eventDay[0].day }}


  {%- for event in eventDay %}
    - {{ event.time }}: {{ event.title }}
  {%- endfor %}
{% endfor %}
`;

module.exports.updateSidebar = function post (debug) {
  const client = new Reddit(require('./config.local'));

  Object.keys(subreddits).forEach(state => {
    // For each state.
    const subreddit = subreddits[state];
    const eventDays = [];

    // Filter by state and sort by time.
    let stateEvents = Object.keys(db)
      .filter(id => {
        const event = db[id];
        if (!event.location) { return; }
        return event.location.region === state;
      })
      .map(id => {
        const event = db[id];
        event.city = event.location.locality;
        event.venue = event.location.venue;

        // Format time.
        let eventTime = moment.unix(event.timeslots[0].start_date).tz(event.timezone).format('LT').replace(/:00/g, '');
        eventTime = eventTime.replace(/ PM/g, 'PM').replace(/ AM/g, 'AM');
        event.time = eventTime;

        event.day = moment.unix(event.timeslots[0].start_date).tz(event.timezone).format('ddd M/D');

        return event;
      });

    // (stateEvents is now an array of events).
    // Bucket into days.
    stateEvents.forEach(event => {
      const dayOfWeek = moment.unix(event.timeslots[0].start_date).tz(event.timezone).format('ddd');
      const index = getIndex(dayOfWeek, event.timezone);
      eventDays[index] = eventDays[index] || [];
      eventDays[index].push(event);
    });

    eventDays.forEach((eventDay, i) => {
      eventDays[i] = eventDay.sort(event => event.timeslots[0].start_date);
    });

    const sidebar = nunjucks.renderString(template, {
      eventDays: eventDays
    });
    console.log(sidebar);
  });
};

/**
 * Get index of day of week in an array that starts with today.
 */
function getIndex (dayOfWeek, timezone) {
  let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const today = moment().tz(timezone).format('ddd');
  const todayIndex = days.indexOf(today);

  days = days.slice(todayIndex);
  return days.indexOf(dayOfWeek);
}

require('make-runnable');
