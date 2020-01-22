const Reddit = require('snoowrap');
const clean = require('./scrape').clean;
const db = require('../events.json');
const fs = require('fs');
const moment = require('moment-timezone');
const nunjucks = require('nunjucks');
const stateAbbr = require('states-abbreviations');

let subreddits = require('./subreddits');
if (process.env.TEST) {
  subreddits = {
    CA: 'TestModForYang'
  };
}

const template = `
{%- for eventDay in eventDays -%}
{%- if eventDay[0] -%}
**{{ eventDay[0].day }}**

{% for event in eventDay %}
&nbsp;&nbsp;&nbsp;&nbsp; **{{ event.time }} ({{ event.location.locality }}):** [{{ event.title }}]({{ event.browser_url }})\n\n
{% endfor %}
{%- endif -%}
{% endfor %}
`;

const states = {};
const statesRaw = {};

module.exports.updateSidebar = function (isWeekly) {
  const client = new Reddit(require('./config.local'));

  isWeekly = isWeekly || process.env.IS_WEEKLY;

  Object.keys(subreddits).forEach(state => {
    // For each state.
    const subreddit = subreddits[state];
    const stateFull = stateAbbr[state];
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
        if (isWeekly) { return true; }
        // Filter by future.
        const event = db[id];
        return moment.unix(event.timeslots[0].start_date).tz(event.timezone).unix() > moment().tz(event.timezone).unix();
      })
      .filter(id => {
        const event = db[id];
        if (isWeekly) {
          // Filter by the week.
          const start = moment().tz(event.timezone).weekday(0);
          const end = moment().tz(event.timezone).weekday(7);
          return moment.unix(event.timeslots[0].start_date).tz(event.timezone).isBetween(start, end, null, '[]');
        } else {
          // Filter by within 8 days.
          return moment.unix(event.timeslots[0].start_date).tz(event.timezone).unix() <= moment().tz(event.timezone).add(6, 'days').unix();
        }
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
        event.title = event.title.replace(`, ${event.location.region}`, ' ');
        event.title = event.title.replace(` ${event.location.region}`, ' ');
        event.title = event.title.replace(event.location.region, ' ');
        event.title = event.title.replace(event.location.locality, ' ');
        event.title = event.title.replace(' - ', ' ');
        event.title = event.title.replace('-', ' ');
        event.title = event.title.replace('- ', ' ');
        event.title = event.title.replace(' -', ' ');
        event.title = event.title.replace(/  /g, ' ');
        event.title = event.title.replace(' , ', ' ');
        event.title = event.title.trim();

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

    for (let i = 0; i < 8; i++) {
      if (!eventDays[i] || !eventDays[i].length) {
        eventDays[i] = undefined;
      }
    }
    eventDays = eventDays.filter(day => !!day); 

    if (isWeekly) {
      states[subreddit] = eventDays;
    } else {
      states[subreddit] = nunjucks.renderString(template, {
        eventDays: eventDays
      });
    }

    statesRaw[subreddit] = eventDays;

    if (!states[subreddit] || states[subreddit] === '\n\n\n\n\n\n\n\n\n' || states[subreddit] === '\n') {
      states[subreddit] = "No upcoming events. Create an event on [Mobilize](https://mobilize.us/yang2020)!";
    }
  });

  if (isWeekly) {
    fs.writeFileSync('../src/subredditWeek.json', JSON.stringify(states));
  } else {
    fs.writeFileSync('../src/subredditWidgets.json', JSON.stringify(states));
    fs.writeFileSync('../src/subredditWidgetsRaw.json', JSON.stringify(statesRaw));
  }
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
