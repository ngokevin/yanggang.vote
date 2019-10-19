const Reddit = require('snoowrap');
const clean = require('./scrape').clean;
const db = require('../events.json');
const fs = require('fs');
const moment = require('moment-timezone');
const nunjucks = require('nunjucks');

const subreddits = {
  AK: 'AlaskaForYang',
  AL: 'AlabamaForYang',
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

const template = `
**Title:** {{ title }}

**Time:** {{ time }}

**Location:** {{ city }} / {{ location }}

**Event URL:** RSVP at [{{ url }}]({{ url }})

{{ description }}

*this event was created from an automated bot by [@andgokevin](https://twitter.com/andgokevin)*
`;

let errors = 0;

module.exports.post = function post (debug) {
  const db = JSON.parse(fs.readFileSync('./events.json', 'utf8'));
  clean(db);

  const client = new Reddit(require('./config.local'));

  const posts = Object.keys(db).map((id, i) => {
    const event = db[id];

    if (event.posted === true) {
      console.log('Already posted.');
      return;
    }

    // Some online event.
    if (!event.location || !event.location.region || event.location.region === 'PR') {
      console.log('No location.');
      return;
    }

    // Only post if within a week.
    if (moment.unix(event.timeslots[0].start_date).unix() > moment().add(7, 'days').unix()) {
      console.log('Too early to post.');
      return;
    }

    // Double make sure not to post if event is passed or right about to start.
    if (moment.unix(event.timeslots[0].start_date).unix() < moment().add(4, 'hours').unix()) {
      console.log('Too late to post.');
      return;
    }

    // Clean data.
    const eventCity = event.location.locality;
    let eventLocation = event.location.venue || event.location.address_lines[0];
    if (event.location.venue && event.location.address_lines[0]) {
      eventLocation = `${event.location.venue} / ${event.location.address_lines[0]}`;
    }

    let eventTime = moment.unix(event.timeslots[0].start_date).tz(event.timezone).format('ddd M/D LT').replace(/:00/g, '');
    const endTime = moment.unix(event.timeslots[0].end_date).tz(event.timezone).format('LT').replace(/:00/g, '');
    eventTime = `${eventTime}-${endTime}`;
    eventTime = eventTime.replace(/ PM/g, 'PM').replace(/ AM/g, 'AM');

    // Post.
    const subreddit = subreddits[event.location.region];
    return client
      .getSubreddit(subreddit)
      .submitSelfpost({
        title: `[${eventCity}, ${eventTime}] ${event.title} @ ${eventLocation}`,
        text: nunjucks.renderString(template, {
          city: eventCity,
          description: event.description,
          location: eventLocation,
          time: eventTime,
          title: event.title,
          url: event.browser_url
        })
      })
      .then(() => {
        console.log(`Posted to ${subreddit}`);
        db[id].posted = true;
        fs.writeFileSync('events.json', JSON.stringify(db));
      }).catch(() => {
        console.log(`Rate limited for ${subreddit}.`);
      });
  });

  // Update our file-based DB.
  Promise.all(posts).then(() => {
    console.log(`Done (${posts.length}).`);
    clean(db);
    fs.writeFileSync('events.json', JSON.stringify(db));
  });
}

require('make-runnable');
