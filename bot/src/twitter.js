const Twitter = require('twitter');
const emoji = require('node-emoji');
const fetch = require('node-fetch');
const fs = require('fs');
const moment = require('moment-timezone');
const stateAbbr = require('states-abbreviations');

const config = require('./config.local');
const db = require('../events.json');

const templates = {
  canvass: `${emoji.find('door').emoji}${emoji.find('woman-walking').emoji} Wanna claim some turf for @andrewyang? Join us #yanggang in knocking door-to-door.`,
  crowd: `${emoji.find('speaking_head_in_silhoutette')}${emoji.find('cityscape')} Let's shout to the streets for @andrewyang! Come show off #yanggang numbers.`,
  hang: `${emoji.find('man-woman-girl-boy')} Hang with the #YangGang where we mobilize on getting @andrewyang to the White House.`,
  misc: `${emoji.find('v').emoji} The better world is still possible. Come out and fight for @andrewyang and the #yanggang.`,
  phonebank: `${emoji.find('computer').emoji}${emoji.find('telephone').emoji} Phonebanking is the highest priority here for the #yanggang! Newcomers encouraged! We'll get you trained and set up easy.`,
  tabling: `${emoji.find('seat').emoji} Come show support and talk with the @andrewyang-curious with the #yanggang.`,
  textbank: `${emoji.find('computer').emoji}${emoji.find('iphone').emoji} Send out a wave of texts to spread the word about @andrewyang and mobilize #yanggang volunteers.`
};

const state = process.env.STATE.toUpperCase();
const region = process.env.REGION;

const client = new Twitter(config.twitter);

module.exports.tweet = function tweet() {
  let event = Object.keys(db)
    .filter(id => {
      const evt = db[id];
      const viable = !!(
        evt.location &&
        evt.location.region === state &&
        evt.location.locality === region &&
        moment.unix(evt.timeslots[0].start_date).tz(evt.timezone) > moment().tz(evt.timezone).unix() &&
        !evt.tweetInitial
      );
      return viable;
    })
    .map(id => db[id]);

  event = event[0];
  if (!event) { return; }

  const eventType = getEventType(event);

  let eventTime = moment.unix(event.timeslots[0].start_date).tz(event.timezone).format('ddd M/D LT').replace(/:00/g, '');
  const endTime = moment.unix(event.timeslots[0].end_date).tz(event.timezone).format('LT').replace(/:00/g, '');
  eventTime = `${eventTime}-${endTime}`;
  eventTime = eventTime.replace(/ PM/g, 'PM').replace(/ AM/g, 'AM');

  const eventLocation = event.location.venue || event.location.address_lines[0];

  const description = `${getTitle(event)} at ${eventLocation} on ${eventTime}`;

  const text = templates[eventType] + ` ${description} ${event.browser_url}`;

  validateEvent(event).then(() => {
    client.post('statuses/update', {
      status: text
    }, () => {
      console.log(text);
      db[event.id].tweetInitial = true;
      fs.writeFileSync('./events.json', JSON.stringify(db));
    });
  }, () => {
    console.log('Event deleted.');
    delete db[event.id];
    fs.writeFileSync('./events.json', JSON.stringify(db));
  });
};

function validateEvent (event) {
  return new Promise((resolve, reject) => {
    fetch(event.browser_url).then(res => {
      if (res.url.endsWith('error=404')) {
        reject();
      } else {
        resolve();
      }
    });
  });
}

function getTitle (event) {
  // Format title.
  let title = event.title;
  title = title.replace(`, ${event.location.region}`, ' ');
  title = title.replace(` ${event.location.region}`, ' ');
  title = title.replace(event.location.region, ' ');
  title = title.replace(event.location.locality, ' ');
  title = title.replace(' - ', ' ');
  title = title.replace('-', ' ');
  title = title.replace('- ', ' ');
  title = title.replace(' -', ' ');
  title = title.replace(/  /g, ' ');
  title = title.replace(' , ', ' ');
  title = title.replace('SF', ' ');
  title = title.replace('in SF', ' ');
  title = title.trim();
  return title;
}

function getEventType (evt) {
  const title = evt.title;
  if (evt.type === 'CANVASS' || title.match(/canvas/i) || (title.match(/door/i) && title.match(/knock/i))) { return 'canvass'; }
  if (title.match(/crowd/)) { return 'crowd'; }
  if (title.match(/gang hang/)) { return 'hang'; }
  if (evt.type === 'PHONEBANK' || title.match(/phonebank/i) || title.match(/phone bank/i)) { return 'phonebank'; }
  if (title.match(/textbank/i) || title.match(/text bank/i) || title.match(/texting/i)) { return 'textbank'; }
  return 'misc';
}

require('make-runnable');
