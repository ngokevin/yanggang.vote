const Reddit = require('snoowrap');
const clean = require('./scrape').clean;
const db = require('../events.json');
const fs = require('fs');
const moment = require('moment-timezone');
const nunjucks = require('nunjucks');

const states = {
  states: [
    {state: 'Alaska', subreddit: 'AlaskaForYang', abbr: 'AK'},
    {state: 'Alabama', subreddit: 'AlabamaForYang', abbr: 'AL'},
    {state: 'Arkansas', subreddit: 'ArkansasForYang', abbr: 'AR'},
    {state: 'Arizona', subreddit: 'ArizonaForYang', abbr: 'AZ'},
    {state: 'California', subreddit: 'CaliforniaForYang', abbr: 'CA'},
    {state: 'Colorado', subreddit: 'ColoradoForYang', abbr: 'CO'},
    {state: 'Connecticut', subreddit: 'ConnecticutForYang', abbr: 'CT'},
    {state: 'DC', subreddit: 'DCForYang', abbr: 'DC'},
    {state: 'Delaware', subreddit: 'DelawareForYang', abbr: 'DE'},
    {state: 'Florida', subreddit: 'FloridaForYang', abbr: 'FL'},
    {state: 'Georgia', subreddit: 'GeorgiaForYang', abbr: 'GA'},
    {state: 'Hawaii', subreddit: 'HawaiiForYang', abbr: 'HI'},
    {state: 'Iowa', subreddit: 'IowaForYang', abbr: 'IA'},
    {state: 'Idaho', subreddit: 'IdahoForYang', abbr: 'ID'},
    {state: 'Illinois', subreddit: 'IllinoisForYang', abbr: 'IL'},
    {state: 'Indiana', subreddit: 'IndianaForYang', abbr: 'IN'},
    {state: 'Kansas', subreddit: 'KansasForYang', abbr: 'KS'},
    {state: 'Kentucky', subreddit: 'KentuckyForYang', abbr: 'KY'},
    {state: 'Louisiana', subreddit: 'LouisianaForYang', abbr: 'LA'},
    {state: 'Massachusetts', subreddit: 'MassachusettsForYang', abbr: 'MA'},
    {state: 'Maryland', subreddit: 'MarylandForYang', abbr: 'MD'},
    {state: 'Maine', subreddit: 'MaineForYang', abbr: 'ME'},
    {state: 'Michigan', subreddit: 'MichiganForYang', abbr: 'MI'},
    {state: 'Minnesota', subreddit: 'MinnesotaForYang', abbr: 'MN'},
    {state: 'Missouri', subreddit: 'MissouriForYang', abbr: 'MO'},
    {state: 'Mississippi', subreddit: 'MississippiForYang', abbr: 'MS'},
    {state: 'Montana', subreddit: 'MontanaForYang', abbr: 'MT'},
    {state: 'North Carolina', subreddit: 'NCForYang', abbr: 'NC'},
    {state: 'North Dakota', subreddit: 'NorthDakotaForYang', abbr: 'ND'},
    {state: 'Nebraska', subreddit: 'NebraskaForYang', abbr: 'NE'},
    {state: 'New Hampshire', subreddit: 'NewHampshireForYang', abbr: 'NH'},
    {state: 'New Jersey', subreddit: 'NewJerseyForYang', abbr: 'NJ'},
    {state: 'New Mexico', subreddit: 'NewMexicoForYang', abbr: 'NM'},
    {state: 'New York', subreddit: 'NewYorkForYang', abbr: 'NY'},
    {state: 'Nevada', subreddit: 'NevadaForYang', abbr: 'NV'},
    {state: 'Ohio', subreddit: 'OhioForYang', abbr: 'OH'},
    {state: 'Oklahoma', subreddit: 'OklahomaForYang', abbr: 'OK'},
    {state: 'Oregon', subreddit: 'OregonForYang', abbr: 'OR'},
    {state: 'Pennsylvania', subreddit: 'PennsylvaniaForYang', abbr: 'PA'},
    {state: 'Rhode Island', subreddit: 'RIForYang', abbr: 'RI'},
    {state: 'South Carolina', subreddit: 'SouthCarolinaForYang', abbr: 'SC'},
    {state: 'Tennessee', subreddit: 'TennesseeForYang', abbr: 'TN'},
    {state: 'Texas', subreddit: 'TexasForYang', abbr: 'TX'},
    {state: 'Utah', subreddit: 'UtahForYang', abbr: 'UT'},
    {state: 'Virginia', subreddit: 'VirginiaForYang', abbr: 'VA'},
    {state: 'Vermont', subreddit: 'VermontForYang', abbr: 'VT'},
    {state: 'Washington', subreddit: 'WashingtonForYang', abbr: 'WA'},
    {state: 'Wisconsin', subreddit: 'WisconsinForYang', abbr: 'WI'},
    {state: 'WestVirginia', subreddit: 'WestVirginiaForYang', abbr: 'WV'},
    {state: 'Wyoming', subreddit: 'WyomingForYang', abbr: 'WY'},
  ],
  total: 0
};

module.exports.scrape = function post () {
  const client = new Reddit(require('./config.local'));
  let total = 0;

  const promises = states.states.map(state => {
    return client
      .getSubreddit(state.subreddit)
      .fetch()
      .then(res => {
        state.counts = res.subscribers;
        total += res.subscribers;
      });
  });

  Promise.all(promises).then(() => {
    states.total = total;
    fs.writeFileSync('../src/subredditCounts.json', JSON.stringify(states));
  });
}

require('make-runnable');
