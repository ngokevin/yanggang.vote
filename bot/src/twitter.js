const Twitter = require('twitter');
const db = require('../events.json');
const fs = require('fs');
const moment = require('moment-timezone');
const stateAbbr = require('states-abbreviations');

const templates = {
  canvass: 'Wanna knock on some doors?',
  crowd: 'Let\'s shout to the streets!',
  hang: 'Come and hang with the #YangGang!',
  misc: 'Volunteer at a Yang event!',
  phonebank: 'Time is ticking, call for Yang.',
  tabling: 'Come show your support for Yang.',
  textbank: 'Send out some texts and spread the word.'
};

const state = process.env.STATE.toUpperCase();
const region = process.env.REGION;

let client;
if (process.env.DEBUG) {
  client = new Twitter({
    access_token_key: '1156694132737241088-dkNPdQhAaA45rB4niPYWx36hrVwH5j',
    access_token_secret: 'VoetziT7hpXWIOUQABB675Iq73PNWE76gJbj8lJmYnHQI',
    consumer_key: 'ptPQWgoQodez5mKbsjz5LPdod',
    consumer_secret: '6ueMWw9y4EX9Vj5fOEt9azcvjgT2tGu44jl1yRarqHkC1j85Dr'
  });
} else {
  client = new Twitter({
    access_token_key: '',
    access_token_secret: '',
    consumer_key: '',
    consumer_secret: ''
  });
}

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
  const text = templates[eventType] + ` ${event.browser_url}`;

  client.post('statuses/update', {
    status: text
  }, () => {
    console.log(text);
    // db[evt.id].tweetInitial = true;
    // fs.writeFileSync('./events.json', JSON.stringify(db));
  });
};

function getEventType (evt) {
  const title = evt.title;
  if (evt.type === 'CANVASS' || title.match(/canvas/) || (title.match(/door/) && title.match(/knock/))) { return 'canvass'; }
  if (title.match(/crowd/)) { return 'crowd'; }
  if (title.match(/gang hang/)) { return 'hang'; }
  if (evt.type === 'PHONEBANK' || title.match(/phonebank/) || title.match(/phone bank/)) { return 'phonebank'; }
  if (title.match(/textbank/) || title.match(/text bank/)) { return 'textbank'; }
  return 'misc';
}

require('make-runnable');
