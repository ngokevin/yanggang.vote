const fs = require('fs');
const moment = require('moment-timezone');
const nunjucks = require('nunjucks');
const Reddit = require('snoowrap');
const db = require('../events.json');

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
  OH: 'OhioForYang',
  OK: 'OKForYang',
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

**Location:** {{ location }}

**City:** {{ city }}

**Event URL:** [mobilize.us]({{ url }})

{{ description }}

*this event was created by an automated bot*
`;

let errors = 0;

module.exports.post = function post () {
  const client = new Reddit(require('./config.local'));

  const posts = Object.keys(db).map((id, i) => {
    const event = db[id];

    if (event.posted === true) { return; }

    // Some online event.
    if (!event.location) { return; }

    // Clean data.
    const eventCity = event.location.locality;
    let eventLocation = event.location.venue || event.location.address_lines[0];
    if (event.location.venue && event.location.address_lines[0]) {
      eventLocation = `${event.location.venue} / ${event.location.address_lines[0]}`;
    }
    const eventTime = moment.unix(event.timeslots[0].start_date).tz(event.timezone).format('M/D LT');

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
        db[id].posted = true;
      }).catch(() => {
        console.log(`Rate limited for ${subreddit}.`);

        if (errors++ > 10) {
          console.log('Too rate limited now. Exiting.');
          fs.writeFileSync('events.json', JSON.stringify(db));
          process.exit(0);
        }
      });
  });

  // Update our file-based DB.
  Promise.all(posts).then(() => {
    fs.writeFileSync('events.json', JSON.stringify(db));
  });
}

require('make-runnable');
