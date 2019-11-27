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
  total: 0,

  statesSanders: [
    {state: 'Alaska', subreddit: 'alaskaforsanders', abbr: 'AK'},
    {state: 'Alabama', subreddit: 'AlabamaForSanders', abbr: 'AL'},
    {state: 'Arkansas', subreddit: 'ArkansasForSanders', abbr: 'AR'},
    {state: 'Arizona', subreddit: 'ArizonaForSanders', abbr: 'AZ'},
    {state: 'California', subreddit: 'CaliforniaForSanders', abbr: 'CA'},
    {state: 'Colorado', subreddit: 'Colorado4Sanders', abbr: 'CO'},
    {state: 'Connecticut', subreddit: 'Connecticut4Sanders', abbr: 'CT'},
    {state: 'DC', subreddit: 'dc4sanders', abbr: 'DC'},
    {state: 'Delaware', subreddit: 'Delaware4Sanders', abbr: 'DE'},
    {state: 'Florida', subreddit: 'FloridaForSanders', abbr: 'FL'},
    {state: 'Georgia', subreddit: 'Georgia4Sanders', abbr: 'GA'},
    {state: 'Hawaii', subreddit: 'HawaiiForSanders', abbr: 'HI'},
    {state: 'Iowa', subreddit: 'IowaForSanders', abbr: 'IA'},
    {state: 'Idaho', subreddit: 'Idaho4Sanders', abbr: 'ID'},
    {state: 'Illinois', subreddit: 'Illinois4Sanders', abbr: 'IL'},
    {state: 'Indiana', subreddit: 'IndianaForSanders', abbr: 'IN'},
    {state: 'Kansas', subreddit: 'Kansas4Sanders', abbr: 'KS'},
    {state: 'Kentucky', subreddit: 'KentuckyForSanders', abbr: 'KY'},
    {state: 'Louisiana', subreddit: 'LouisianaForSanders', abbr: 'LA'},
    {state: 'Massachusetts', subreddit: 'Massachusetts4Sanders', abbr: 'MA'},
    {state: 'Maryland', subreddit: 'Maryland4Sanders', abbr: 'MD'},
    {state: 'Maine', subreddit: 'Maine4Sanders', abbr: 'ME'},
    {state: 'Michigan', subreddit: 'Michigan4Sanders', abbr: 'MI'},
    {state: 'Minnesota', subreddit: 'MinnesotaForBernie', abbr: 'MN'},
    {state: 'Missouri', subreddit: 'MississippiForSanders', abbr: 'MO'},
    {state: 'Mississippi', subreddit: 'Missouri4Sanders', abbr: 'MS'},
    {state: 'Montana', subreddit: 'Montana4Sanders', abbr: 'MT'},
    {state: 'North Carolina', subreddit: 'NorthCarolina4Sanders', abbr: 'NC'},
    {state: 'North Dakota', subreddit: 'NorthDakota4Sanders', abbr: 'ND'},
    {state: 'Nebraska', subreddit: 'Nebraska4Sanders', abbr: 'NE'},
    {state: 'New Hampshire', subreddit: 'NewJerseyforSanders', abbr: 'NH'},
    {state: 'New Jersey', subreddit: 'NevadaForSanders', abbr: 'NJ'},
    {state: 'New Mexico', subreddit: 'NewYorkForSanders', abbr: 'NM'},
    {state: 'New York', subreddit: 'NewHampshire4Sanders', abbr: 'NY'},
    {state: 'Nevada', subreddit: 'NewMexicoForSanders', abbr: 'NV'},
    {state: 'Ohio', subreddit: 'ohioforsanders', abbr: 'OH'},
    {state: 'Oklahoma', subreddit: 'OklahomaForSanders', abbr: 'OK'},
    {state: 'Oregon', subreddit: 'OregonForSanders', abbr: 'OR'},
    {state: 'Pennsylvania', subreddit: 'PAForSanders', abbr: 'PA'},
    {state: 'Rhode Island', subreddit: 'RhodeIsland4Sanders', abbr: 'RI'},
    {state: 'South Carolina', subreddit: 'SouthCarolina4Sanders', abbr: 'SC'},
    {state: 'Tennessee', subreddit: 'SouthDakotaForSanders', abbr: 'TN'},
    {state: 'Texas', subreddit: 'TennesseeForSanders', abbr: 'TX'},
    {state: 'Utah', subreddit: 'TexasForSanders', abbr: 'UT'},
    {state: 'Virginia', subreddit: 'Utah4Sanders', abbr: 'VA'},
    {state: 'Vermont', subreddit: 'VirginiaForSanders', abbr: 'VT'},
    {state: 'Washington', subreddit: 'Vermont4Sanders', abbr: 'WA'},
    {state: 'Wisconsin', subreddit: 'WashingtonForSanders', abbr: 'WI'},
    {state: 'WestVirginia', subreddit: 'Wisconsin4Sanders', abbr: 'WV'},
    {state: 'Wyoming', subreddit: 'WVForSanders', abbr: 'WY'}
  ],
  totalSanders: 0,
};

module.exports.scrape = function post () {
  const client = new Reddit(require('./config.local'));
  let total = 0;
  let totalSanders = 0;

  const promises = states.states.map(state => {
    return client
      .getSubreddit(state.subreddit)
      .fetch()
      .then(res => {
        state.counts = res.subscribers;
        total += res.subscribers;
      });
  });

  promises.concat(states.statesSanders.map(state => {
    return client
      .getSubreddit(state.subreddit)
      .fetch()
      .then(res => {
        state.counts = res.subscribers;
        totalSanders += res.subscribers;
      }).catch(err => {
        console.log(state);
      });
  }));

  Promise.all(promises).then(() => {
    states.total = total;
    states.totalSanders = totalSanders;
    fs.writeFileSync('../src/subredditCounts.json', JSON.stringify(states));
  });
}

require('make-runnable');
