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
{%- for eventDay in eventDays -%}
**{{ eventDay[0].day }}**

{% for event in eventDay %}
&nbsp;&nbsp;&nbsp;&nbsp; **{{ event.time }} ({{ event.location.locality }}):** [{{ event.title }}]({{ event.browser_url }})\n\n
{% endfor %}
{% endfor %}
`;

module.exports.updateSidebar = function post (debug) {
  const client = new Reddit(require('./config.local'));
  Object.keys(subreddits).forEach(state => {
    // For each state.
    const subreddit = subreddits[state];
    let eventDays = [];

    // Filter by state and sort by time.
    let stateEvents = Object.keys(db)
      .filter(id => {
        // Filter by state.
        const event = db[id];
        if (!event.location) { return; }
        return event.location.region === state;
      })
      .filter(id => {
        // Filter by future.
        const event = db[id];
        return moment.unix(event.timeslots[0].start_date).tz(event.timezone).unix() > moment().tz(event.timezone).unix();
      })
      .filter(id => {
        // Filter by within 8 days.
        const event = db[id];
        return moment.unix(event.timeslots[0].start_date).tz(event.timezone).unix() <= moment().tz(event.timezone).add(6, 'days').unix();
      })
      .map(id => {
        const event = db[id];
        event.city = event.location.locality;
        event.venue = event.location.venue;

        // Format time.
        let eventTime = moment.unix(event.timeslots[0].start_date).tz(event.timezone).format('LT').replace(/:00/g, '');
        eventTime = eventTime.replace(/ PM/g, 'PM').replace(/ AM/g, 'AM');
        event.time = eventTime;

        // Day title.
        event.day = moment.unix(event.timeslots[0].start_date).tz(event.timezone).format('dddd M/D');

        // Format title.
        event.title = event.title.replace(', CA', '');
        event.title = event.title.replace(' CA', '');
        event.title = event.title.replace('CA', '');
        event.title = event.title.replace(event.location.locality, '');
        event.title = event.title.replace(' - ', '');
        event.title = event.title.replace('-', '');
        event.title = event.title.replace('- ', '');
        event.title = event.title.replace(' -', '');
        event.title = event.title.replace(/  /g, ' ');
        event.title = event.title.replace(' , ', '');

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

    // Sort.
    eventDays = eventDays
      .map(eventDay => {
        return eventDay.sort((eventA, eventB) => {
          if (eventA.timeslots[0].start_date > eventB.timeslots[0].start_date) {
            return 1;
          } else {
            return -1;
          }
        });
      })
      .sort((eventDayA, eventDayB) => {
          if (eventDayA[0].timeslots[0].start_date > eventDayB[0].timeslots[0].start_date) {
            return 1;
          } else {
            return -1;
          }
      });

    const sidebar = nunjucks.renderString(template, {
      eventDays: eventDays
    });

    client.oauthRequest({
      method: 'get',
      uri: `/r/${subreddit}/api/widgets`,
    }).then(results => {
      Object.keys(results.items).forEach(widgetId => {
        const widget = results.items[widgetId];
        if (!widget.shortName || widget.shortName.indexOf('Events') === -1) { return; }

        client.oauthRequest({
          method: 'put',
          uri: `/r/${subreddit}/api/widget/${widgetId}`,
          body: {
            kind: "textarea",
            shortName: "Upcoming Events",
            text: sidebar
          }
        });
      });
    });
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
