const cron = require('node-cron');
const reddit = require('./src/reddit');
const scrape = require('./src/scrape');
const twitter = require('./src/twitter');
const widget = require('./src/widgetEvents');

console.log('Cron for Yang!');
cron.schedule('0 6-16 * * *', () => {
  scrape.scrape().then(() => {
  reddit.updateDB();
  reddit.post();
  twitter.tweet('CA', 'San Francisco');
  widget.updateSidebar();
  widget.updateSidebar(true);
  });
}, {
  timezone: 'America/Los_Angeles'
});

scrape.scrape().then(() => {
  reddit.updateDB();
  widget.updateSidebar();
  widget.updateSidebar(true);
});

const twitterSignIn = require('./src/twitterSignIn');
