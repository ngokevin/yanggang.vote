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
  canvass: [
    `${emoji.find('door').emoji}${emoji.find('woman-walking').emoji} Wanna claim some turf for @AndrewYang? Join us #YangGang in knocking door-to-door.`,
    `${emoji.find('door').emoji}${emoji.find('woman-walking').emoji} Let's knock on some doors and plant the #YangGang flag in the neighborhood.`,
    `${emoji.find('door').emoji}${emoji.find('woman-walking').emoji} Talking face-to-face is the most effective way to get people onboard #HumanityFirst. Come knock on some doors!`,
  ],
  crowd: [
    `${emoji.find('speaking_head_in_silhouette').emoji}${emoji.find('cityscape').emoji} Shout to the streets for @AndrewYang! Come show off our #YangGang numbers.`,
    `${emoji.find('speaking_head_in_silhouette').emoji}${emoji.find('cityscape').emoji} Come hold signs, engage with the crowd, and turn people #YangGang!`,
    `${emoji.find('speaking_head_in_silhouette').emoji}${emoji.find('cityscape').emoji} People walking by; they can't sleep on @AndrewYang. Show our #YangGang strength in numbers.`
  ],
  hang: [
    `${emoji.find('man-woman-girl-boy').emoji} Hang with the #YangGang and coordinate on getting @AndrewYang to the White House!`,
    `${emoji.find('man-woman-girl-boy').emoji} Come hang out with your fellow #YangGang and hatch a plot for a better world.`,
    `${emoji.find('man-woman-girl-boy').emoji} Raise a glass to freedom for @AndrewYang! Come join our #YangGang hang and chill.`,
  ],
  misc: [
    `${emoji.find('v').emoji} The better world is still possible! Come out for @AndrewYang and the #YangGang.`,
    `${emoji.find('v').emoji} Rise up #YangGang! Come lend your heart and soul to volunteer for @AndrewYang.`,
    `${emoji.find('v').emoji} Are you going to wait for it, or are you willing to fight for it? Get out here for the #YangGang.`
  ],
  phonebank: [
    `${emoji.find('computer').emoji}${emoji.find('telephone').emoji} Come make calls to early states. Phonebanking is the highest priority #YangGang! Newcomers encouraged, we'll get you trained and set up quick.`,
    `${emoji.find('computer').emoji}${emoji.find('telephone').emoji} It's crunchtime to call for @AndrewYang. We need more phonebankers! It's super easy, come and we'll show you how.`,
    `${emoji.find('computer').emoji}${emoji.find('telephone').emoji} Phonebanking for @AndrewYang is easy and empowering. Newbies strongly encouraged! Orders from the Chief.`,
  ],
  signature: [
    `${emoji.find('clipboard').emoji} Get @AndrewYang on the ballot! Help us gather signatures for the #YangGang.`,
    `${emoji.find('clipboard').emoji} We need help gathering signatures to get @AndrewYang on the ballot! Come out and volunteer #YangGang.`
  ],
  tabling: [
    `${emoji.find('seat').emoji} Come show support and talk to the @AndrewYang-curious with the #YangGang.`,
    `${emoji.find('seat').emoji} We'll set up a table for @AndrewYang in a busy area, come help hold it down!`,
    `${emoji.find('seat').emoji} People are waiting for you to flip their world and tell them about @AndrewYang. Come to the #YangGang table.`,
  ],
  textbank: [
    `${emoji.find('computer').emoji}${emoji.find('iphone').emoji} Send out a wave of texts to spread the word about @AndrewYang and mobilize #YangGang volunteers.`,
    `${emoji.find('computer').emoji}${emoji.find('iphone').emoji} Feeling a bit introverted? This is for you. Send texts for @AndrewYang to spread the world and mobilize volunteers.`,
    `${emoji.find('computer').emoji}${emoji.find('iphone').emoji} Get set up textbanking, and it's something you can do in with any spare seconds of your day!`,
  ]
};

// Curate which regions for each account.
const accounts = [
  {
    user: 'OaklandYangGang',
    state: 'CA',
    regions: ['OAKLAND', 'BERKELEY', 'FREMONT', 'ORINDA', 'SAN LEANDRO', 'WALNUT CREEK', 'CONCORD']
  },
  {
    user: 'SFYangGang',
    state: 'CA',
    regions: ['SAN FRANCISCO']
  },
  {
    user: 'Yang2020Mass',
    states: ['MA']
  },
  {
    user: 'BrendonCarpent4',
    states: ['AZ']
  },
  {
    user: 'yennijb',
    states: ['ME', 'VT', 'NH', 'RI', 'MA', 'CT']
  },
  {
    user: 'Kev_Pham03',
    state: 'FL',
    regions: ['Tampa']
  },
  {
    user: 'NOLAYangGang',
    state: 'LA',
    regions: ['New Orleans']
  },
  {
    user: 'HoustonYangGang',
    state: 'TX',
    regions: ['Houston']
  },
  {
    user: 'nycyanggang',
    states: ['NY', 'NJ']
  },
  {
    user: 'CincyYangGang',
    state: 'OH',
    regions: ['Cincinnati']
  },
  {
    user: 'vegasyanggang',
    state: 'NV',
    regions: ['Las Vegas']
  },
  {
    user: 'vegasyanggang',
    state: 'NV',
    regions: ['Las Vegas']
  },
  {
    user: 'IL4Yang',
    states: ['IL']
  },
  {
    user: 'LancPAYangGang',
    state: 'PA',
    regions: ['Lancaster']
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

    if (evt.description.indexOf('Zoom') !== -1) { continue; }

    let viable;
    if (account.states) {
      viable = !!(
        evt.location &&
        account.states.indexOf(evt.location.region.toUpperCase()) !== -1 &&
        startTime > moment().tz(evt.timezone).add(4, 'hours').unix()
      );
    } else {
      viable = !!(
        evt.location &&
        evt.location.region.toUpperCase() === account.state.toUpperCase() &&
        account.regions.indexOf(evt.location.locality.toUpperCase()) !== -1 &&
        startTime > moment().tz(evt.timezone).add(4, 'hours').unix()
      );
    }
    if (!viable) { continue; }

    // Tweet eight hours out.
    if (!evt.tweeted[username].dayOf &&
        startTime < moment().add(8, 'hours').tz(evt.timezone).unix()) {
      event = evt;
      tweetDayOf = true;
      break;
    }

    // Tweet 48 hours out.
    if (!evt.tweeted[username].dayOf && !evt.tweeted[username].dayBefore &&
        startTime < moment().add(48, 'hours').tz(evt.timezone).unix()) {
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
  if (tweetDayBefore) { tweetTime = '[In Two Days]'; }
  if (tweetWeekOf) { tweetTime = '[This Week]'; }
  const tweet = `${tweetTime} ${getTemplate(eventType)} ${description} ${event.browser_url}`;

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
  title = title.replace(` ${event.location.locality}`, ' ');
  title = title.replace(` in ${event.location.region}`, ' ');
  title = title.replace(` in ${event.location.locality}`, ' ');
  title = title.replace(` at ${event.location.region}`, ' ');
  title = title.replace(` at ${event.location.locality}`, ' ');
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
  if (title.match(/signature/i)) { return 'signature'; }
  if (title.match(/tabling/i) || title.match(/tabel/i) || title.match(/table/i)) { return 'tabling'; }
  if (evt.type === 'CANVASS' || title.match(/canvas/i) || (title.match(/door/i) && title.match(/knock/i))) { return 'canvass'; }
  if (title.match(/crowd/i)) { return 'crowd'; }
  if (evt.type === 'PHONE_BANK' || title.match(/phonebank/i) || title.match(/phone bank/i)) { return 'phonebank'; }
  if (title.match(/textbank/i) || title.match(/text bank/i) || title.match(/texting/i)) { return 'textbank'; }
  if (title.match(/hang/i)) { return 'hang'; }
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

function getTemplate (eventType) {
  return templates[eventType][Math.floor(Math.random() * templates[eventType].length)];
}

require('make-runnable');
