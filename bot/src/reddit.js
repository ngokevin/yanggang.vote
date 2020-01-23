const Reddit = require('snoowrap');
const clean = require('./scrape').clean;
const gangs = require('./yangGangs.json');
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
**Title:** {{ title }}

**Time:** {{ time }}

**Location:** {{ city }} / {{ location }}

**Event URL:** RSVP at [{{ url }}]({{ url }})

{%- if facebook %}

**~Join the [{{ city }} Yang Gang Facebook Group]({{ facebook }}) for More Information~**

{% else %}

**~[Join your Local Yang Gang](https://yangnearme.com) for More Information~**

{% endif -%}

{% if true %}{% endif %}

{{ description }}

**Get everyone in on the action by joining their local state subreddits:** [yanggang.vote](http://yanggang.vote)

*To get in touch with organizers, RSVP to the event and check your regional Yang Gang's Facebook group. This event was cross-posted from an automated bot by [@andgokevin](https://twitter.com/andgokevin). I am not the organizer.*
`;

let errors = 0;

let stateCounts = {};

module.exports.post = function post (debug) {
  stateCounts = {};
  clean(db);

  const client = new Reddit(require('./config.local'));

  const posts = Object.keys(db).map((id, i) => {
    const event = db[id];

    if (!process.env.TEST) {
      if (event.posted === true) {
        console.log('Already posted.');
        return;
      }

      // Some online event.
      if (!event.location || !event.location.region || event.location.region === 'PR') {
        console.log('No location.');
        return;
      }

      if (stateCounts[event.location.region] > 3) {
        console.log('Only 3 posts per run.');
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

    if (event.location.region in stateCounts) {
      stateCounts[event.location.region]++;
    } else {
      stateCounts[event.location.region] = 1;
    }

    // Facebook group.
    let facebook = '';
    const stateGangs = gangs[stateAbbr[event.location.region].trim()];
    if (stateGangs) {
      const gang = stateGangs.filter(g => g.city === eventCity);
      if (gang.length) {
        facebook = gang[0].facebook;
      }
    }

    if (process.env.TEST && i > 0) { return; }
    if (process.env.TEST) {
      event.location.region = 'CA';
    }

    // Post.
    const subreddit = subreddits[event.location.region];
    return client
      .getSubreddit(subreddit)
      .submitSelfpost({
        title: `[${eventCity}, ${eventTime}] ${event.title} @ ${eventLocation}`,
        text: nunjucks.renderString(template, {
          city: eventCity,
          description: event.description,
          facebook: facebook,
          location: eventLocation,
          time: eventTime,
          title: event.title,
          url: event.browser_url
        })
      })
      .then(post => {
        return post.id.then(postId => {
          console.log(`Posted to ${subreddit}`);
          db[id].posted = true;
          db[id].postId = postId;
          fs.writeFileSync('events.json', JSON.stringify(db));
        });
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

module.exports.updateDB = function () {
  const mobilizeRe = /mobilize.us\/yang2020\/event\/(\d+)/;
  clean(db);

  const client = new Reddit(require('./config.local'));

  const ids = [];

  client.getMe().then(user => {
    user.getSubmissions({
      amount: 500,
      limit: 500
    }).then(posts => {
      posts.forEach(post => {
        if (!post.selftext_html) { return; }
        const mobilizeLink = post.selftext_html.match(mobilizeRe);
        if (!mobilizeLink) { return; }

        const id = mobilizeLink[1];
        if (!db[id]) { return; }

        if (ids.indexOf(id) !== -1) {
          r.getSubmission(post.id).delete();
          console.log(`Deleting duplicate ${post.id}.`);
          return;
        }

        console.log(`Updating ${id}.`);
        db[id].posted = true;
        ids.push(id);
      });
      fs.writeFileSync('events.json', JSON.stringify(db));
    });
  });
}

require('make-runnable');
