const cron = require('node-cron');
const reddit = require('./reddit');
const scrape = require('./scrape');
const twitter = require('./twitter');
const widget = require('./widgetEvents');

console.log('Cron for Yang!');
cron.schedule('*/60 * * * *', () => {
  scrape.scrape().then(() => {
    reddit.post();
    twitter.tweet('CA', 'San Francisco');
    widget.updateSidebar();
    widget.updateSidebar(true);
    reddit.updateDB();
  });
});

scrape.scrape().then(() => {
  reddit.post();
  twitter.tweet('CA', 'San Francisco');
  widget.updateSidebar();
  widget.updateSidebar(true);
  reddit.updateDB();
});
