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
  misc: `${emoji.find('v').emoji} The better world is still possible. Come out for @andrewyang and the #yanggang!`,
  phonebank: `${emoji.find('computer').emoji}${emoji.find('telephone').emoji} Phonebanking is the highest priority here for the #yanggang! Newcomers encouraged! We'll get you trained and set up easy.`,
  tabling: `${emoji.find('seat').emoji} Come show support and talk with the @andrewyang-curious with the #yanggang.`,
  textbank: `${emoji.find('computer').emoji}${emoji.find('iphone').emoji} Send out a wave of texts to spread the word about @andrewyang and mobilize #yanggang volunteers.`
};

const client = new Twitter(config.twitter);

module.exports.tweet = function tweet(state, region) {
  state = state || process.env.STATE;
  region = region || process.env.REGION; 

  let event = Object.keys(db)
    .filter(id => {
      const evt = db[id];
      const viable = !!(
        evt.location &&
        evt.location.region.toUpperCase() === state.toUpperCase() &&
        evt.location.locality.toUpperCase() === region.toUpperCase() &&
        moment.unix(evt.timeslots[0].start_date).tz(evt.timezone).unix() > moment().tz(evt.timezone).unix() &&
        moment.unix(evt.timeslots[0].start_date).tz(evt.timezone).unix() < moment().add(3, 'days').tz(evt.timezone).unix() &&
        !evt.tweetInitial
      );
      return viable;
    })
    .map(id => db[id])
    .sort((evtA, evtB) => {
      if (evtA.timeslots[0].start_date < evtB.timeslots[0].start_date) { return -1; }
      if (evtA.timeslots[0].start_date > evtB.timeslots[0].start_date) { return 1; }
      return 0;
    });

  if (!event.length) {
    console.log('No events.');
    return;
  }

  event = event[0];

  const eventType = getEventType(event);

  let eventTime = moment.unix(event.timeslots[0].start_date).tz(event.timezone).format('ddd M/D LT').replace(/:00/g, '');
  const endTime = moment.unix(event.timeslots[0].end_date).tz(event.timezone).format('LT').replace(/:00/g, '');
  eventTime = `${eventTime}-${endTime}`;
  eventTime = eventTime.replace(/ PM/g, 'PM').replace(/ AM/g, 'AM');

  let eventLocation = event.location.venue || event.location.address_lines[0];
  let description;
  if (!eventLocation || eventLocation.indexOf('is private') !== -1) {
    description = `${getTitle(event)} at ${eventTime}`;
  } else {
    description = `${getTitle(event)} at ${eventLocation} on ${eventTime}`;
  }

  const text = templates[eventType] + ` ${description} ${event.browser_url}`;

  validateEvent(event).then(() => {
    client.post('statuses/update', {
      status: text
    }, () => {
      console.log(text);
      db[event.id].tweetInitial = true;
      fs.writeFileSync('events.json', JSON.stringify(db));
    });
  }, () => {
    console.log('Event deleted.');
    delete db[event.id];
    fs.writeFileSync('events.json', JSON.stringify(db));
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
  if (title.match(/tabling/i) || title.match(/table/i)) { return 'tabling'; }
  if (evt.type === 'CANVASS' || title.match(/canvas/i) || (title.match(/door/i) && title.match(/knock/i))) { return 'canvass'; }
  if (title.match(/crowd/i)) { return 'crowd'; }
  if (title.match(/gang hang/)) { return 'hang'; }
  if (evt.type === 'PHONE_BANK' || title.match(/phonebank/i) || title.match(/phone bank/i)) { return 'phonebank'; }
  if (title.match(/textbank/i) || title.match(/text bank/i) || title.match(/texting/i)) { return 'textbank'; }
  return 'misc';
}

require('make-runnable');
