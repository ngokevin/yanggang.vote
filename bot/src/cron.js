const cron = require('node-cron');
const reddit = require('./reddit');
const scrape = require('./scrape');
const widget = require('./widgetEvents');

console.log('Cron for Yang!');
cron.schedule('*/10 * * * *', () => {
  scrape.scrape().then(() => {
    reddit.post();
    widget.updateSidebar();
    widget.updateSidebar(true);
  });
});

scrape.scrape().then(() => {
  reddit.post();
  widget.updateSidebar();
  widget.updateSidebar(true);
});
