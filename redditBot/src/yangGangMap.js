const data = {};

const fields = {
  'City': 'city',
  'Name': 'name',
  'State': 'state',
  'Yang Gang Primary Contact': 'contactName',
  'Yang Gang Primary Email': 'contactEmail',
  'Yang Gang Regional Organizer Email': 'regionalEmail',
  'Yang Gang Facebook Group': 'facebook'
};

let gangCount = 0;
const links = document.querySelectorAll('.HzV7m-pbTTYe-ibnC6b');
for (let i = 0; i < links.length; i++) {
  setTimeout(() => {
    links[i].click();
    setTimeout(() => {
      const state = document.querySelectorAll('.qqvbed-p83tee-lTBxed')[2].innerHTML;
      const gang = {state: state};

      const items = document.querySelectorAll('.qqvbed-p83tee');
      for (let i = 0; i < items.length; i++) {
        const fieldName = items[i].children[0].innerHTML;
        if (!fields[fieldName]) { continue; }
        if (items[i].children[1].children.length) {
          gang[fields[fieldName]] = items[i].children[1].children[0].innerHTML;
        } else {
          gang[fields[fieldName]] = items[i].children[1].innerHTML;
        }
      }


      data[state] = data[state] || [];
      data[state].push(gang);
      gangCount++;
    }, 100);
  }, i * 220);

