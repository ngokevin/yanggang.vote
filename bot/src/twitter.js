const Twitter = require('twitter');
const emoji = require('node-emoji');
const fetch = require('node-fetch');
const fs = require('fs');
const moment = require('moment-timezone');
const Sequelize = require('sequelize');
const stateAbbr = require('states-abbreviations');

const config = require('./config.local');
const db = require('../events.json');
const User = require('./twitterSignIn').User;

const templates = {
  canvass: `${emoji.find('door').emoji}${emoji.find('woman-walking').emoji} Wanna claim some turf for @andrewyang? Join us #yanggang in knocking door-to-door.`,
  crowd: `${emoji.find('speaking_head_in_silhoutette')}${emoji.find('cityscape')} Let's shout to the streets for @andrewyang! Come show off #yanggang numbers.`,
  hang: `${emoji.find('man-woman-girl-boy')} Hang with the #YangGang where we mobilize on getting @andrewyang to the White House.`,
  misc: `${emoji.find('v').emoji} The better world is still possible. Come out for @andrewyang and the #yanggang!`,
  phonebank: `${emoji.find('computer').emoji}${emoji.find('telephone').emoji} Make calls to the early states! Phonebanking is the highest priority #yanggang! Newcomers encouraged, we'll get you trained and set up quick.`,
  tabling: `${emoji.find('seat').emoji} Come show support and talk with the @andrewyang-curious with the #yanggang.`,
  textbank: `${emoji.find('computer').emoji}${emoji.find('iphone').emoji} Send out a wave of texts to spread the word about @andrewyang and mobilize #yanggang volunteers.`
};

// Curate which regions for each account.
const accounts = [
  {
    user: 'bubblepoptarts',
    state: 'CA',
    regions: ['SAN FRANCISCO']
  },
  {
    user: 'SFYangGang',
    state: 'CA',
    regions: ['SAN FRANCISCO']
  }
];

const client = new Twitter(config.twitter);

module.exports.tweet = function tweet () {
  // For each authorized Twitter account.
  accounts.forEach(account => {
    if (!account.client) {
      // Initialize client.
      User.findOne({where: {username: account.user}}).then(user => {
        if (!user) { return; }
        console.log(`Initializing ${account.user} Twitter client.`);
        account.client = new Twitter({
          access_token_key: user.token,
          access_token_secret: user.secret,
          consumer_key: config.twitter.consumer_key,
          consumer_secret: config.twitter.consumer_secret
        });
        doTweet(account);
      });
    } else {
      doTweet(account);
    }
  });
};

function doTweet (account) {
  const username = account.user;

  // Sort events.
  const events = Object.keys(db)
    .map(id => db[id])
    .sort((evtA, evtB) => {
      if (evtA.timeslots[0].start_date < evtB.timeslots[0].start_date) { return -1; }
      if (evtA.timeslots[0].start_date > evtB.timeslots[0].start_date) { return 1; }
      return 0;
    });

  let event;
  let tweetDayOf = false;
  let tweetDayBefore = false;
  let tweetWeekOf = false;
  for (let i = 0; i < events.length; i++) {
    const evt = events[i];
    const startTime = moment.unix(evt.timeslots[0].start_date).tz(evt.timezone).unix();

    evt.tweeted = evt.tweeted || {};
    evt.tweeted[username] = evt.tweeted[username] || {};
    migrate(evt);

    const viable = !!(
      evt.location &&
      evt.location.region.toUpperCase() === account.state.toUpperCase() &&
      account.regions.indexOf(evt.location.locality.toUpperCase()) !== -1 &&
      startTime > moment().tz(evt.timezone).unix()
    );

    if (!viable) { continue; }
    if (evt.description.indexOf('Zoom') !== -1) { continue; }

    // Tweet eight hours out.
    if (!evt.tweeted[username].dayOf &&
        startTime < moment().add(8, 'hours').tz(evt.timezone).unix()) {
      event = evt;
      tweetDayOf = true;
      break;
    }

    // Tweet 24 hours out.
    if (!evt.tweeted[username].dayOf && !evt.tweeted[username].dayBefore &&
        startTime < moment().add(24, 'hours').tz(evt.timezone).unix()) {
      event = evt;
      tweetDayBefore = true;
      break;
    }

    // Tweet five days out.
    if (!evt.tweeted[username].dayOf && !evt.tweeted[username].dayBefore && !evt.tweeted[username].weekOf &&
        startTime < moment().add(5, 'days').tz(evt.timezone).unix()) {
      event = evt;
      tweetWeekOf = true;
      break;
    }
  }

  if (!event) {
    console.log('No events.');
    return;
  }

  const eventType = getEventType(event);

  // Build time text.
  let eventTime = moment.unix(event.timeslots[0].start_date).tz(event.timezone).format('ddd M/D LT').replace(/:00/g, '');
  const endTime = moment.unix(event.timeslots[0].end_date).tz(event.timezone).format('LT').replace(/:00/g, '');
  eventTime = `${eventTime}-${endTime}`;
  eventTime = eventTime.replace(/ PM/g, 'PM').replace(/ AM/g, 'AM');

  // Build location text.
  let eventLocation = event.location.venue || event.location.address_lines[0];
  let description;
  if (!eventLocation || eventLocation.indexOf('is private') !== -1) {
    description = `${getTitle(event)} at ${eventTime}`;
  } else {
    description = `${getTitle(event)} at ${eventLocation} on ${eventTime}`;
  }

  // Build tweet text.
  let tweetTime;
  if (tweetDayOf) { tweetTime = '[Today]'; }
  if (tweetDayBefore) { tweetTime = '[Tomorrow]'; }
  if (tweetWeekOf) { tweetTime = '[This Week]'; }
  const tweet = `${tweetTime} ${templates[eventType]} ${description} ${event.browser_url}`;

  if (process.env.DRY) {
    console.log(`[@${username}] | ${tweet}`);
    return;
  }

  // Tweet.
  validateEvent(event).then(() => {
    account.client.post('statuses/update', {
      status: tweet
    }, () => {
      // Mark as tweeted (per user per timeline).
      console.log(tweet);
      db[event.id].tweeted = db[event.id].tweeted || {};
      db[event.id].tweeted[username] = db[event.id].tweeted[username] || {};
      if (tweetDayOf) {
        db[event.id].tweeted[username].dayOf = true;
      } else if (tweetDayBefore) {
        db[event.id].tweeted[username].dayBefore = true;
      } else if (tweetWeekOf) {
        db[event.id].tweeted[username].weekOf = true;
      }
      fs.writeFileSync('events.json', JSON.stringify(db));
    });
  }, () => {
    console.log('Event deleted.');
    delete db[event.id];
    fs.writeFileSync('events.json', JSON.stringify(db));
  });
};

// Make sure event still exists.
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
  if (title.match(/tabling/i) || title.match(/tabel/i) || title.match(/table/i)) { return 'tabling'; }
  if (evt.type === 'CANVASS' || title.match(/canvas/i) || (title.match(/door/i) && title.match(/knock/i))) { return 'canvass'; }
  if (title.match(/crowd/i)) { return 'crowd'; }
  if (title.match(/gang hang/)) { return 'hang'; }
  if (evt.type === 'PHONE_BANK' || title.match(/phonebank/i) || title.match(/phone bank/i)) { return 'phonebank'; }
  if (title.match(/textbank/i) || title.match(/text bank/i) || title.match(/texting/i)) { return 'textbank'; }
  return 'misc';
}

function migrate (evt) {
  if (evt.tweetInitial) {
    evt.tweeted['SFYangGang'] = evt.tweeted['SFYangGang'] || {};
    evt.tweeted['SFYangGang'].weekOf = true;
  }
  if (evt.tweetDayBefore) {
    evt.tweeted['SFYangGang'] = evt.tweeted['SFYangGang'] || {};
    evt.tweeted['SFYangGang'].dayBefore = true;
  }
  if (evt.tweetDayOf) {
    evt.tweeted['SFYangGang'] = evt.tweeted['SFYangGang'] || {};
    evt.tweeted['SFYangGang'].dayOf = true;
  }
}

require('make-runnable');
