const cron = require('node-cron');
const reddit = require('./reddit');
const scrape = require('./scrape');

console.log('Cron for Yang!');
cron.schedule('*/10 * * * *', () => {
  scrape.scrape().then(() => {
    reddit.post();
  });
});

scrape.scrape().then(() => {
  reddit.post();
});
