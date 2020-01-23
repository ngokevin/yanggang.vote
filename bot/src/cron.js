const cron = require('node-cron');
const reddit = require('./reddit');
const scrape = require('./scrape');
const twitter = require('./twitter');
const widget = require('./widgetEvents');

console.log('Cron for Yang!');
cron.schedule('*/60 * * * *', () => {
  scrape.scrape().then(() => {
    reddit.updateDB();
    reddit.post();
    twitter.tweet('CA', 'San Francisco');
    widget.updateSidebar();
    widget.updateSidebar(true);
  });
});

scrape.scrape().then(() => {
  reddit.updateDB();
  widget.updateSidebar();
  widget.updateSidebar(true);
});
