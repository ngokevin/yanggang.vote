const cron = require('node-cron');
const execSync = require('child_process').execSync;

cron.schedule('*/10 * * * *', () => {
  execSync('npm run count', {cwd: 'redditBot'});
  execSync('npm run deploy');
});
