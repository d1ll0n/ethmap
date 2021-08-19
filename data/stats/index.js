const area = require('./a2/area-by-alpha2.json')
const population = require('./a2/population-by-alpha2.json')
const government = require('./a2/government-by-alpha2.json')
const income = require('./a2/income-by-alpha2.json')
const name = require('./a2/name-by-alpha2.json')
const nuclear = require('./a2/nuclear-by-alpha2.json')
const alliances = require('./a2/alliances-by-alpha2.json')
const lifeExpectancy = require('./a2/lifeExpectancy-by-alpha2.json')
const countryAlpha2s = require('./country-alpha2s.json')

const stats = {}

const allA2 = countryAlpha2s.reduce((obj, k) => ({ ...obj, [k]: true }), {})

function writeToStats(obj, key) {
  const alpha2s = Object.keys(obj).filter(k => allA2[k]);
  for (const alpha2 of alpha2s) {
    if (!stats[alpha2]) stats[alpha2] = {};
    stats[alpha2][key] = obj[alpha2]
  }
}

writeToStats(area, 'area')
writeToStats(population, 'population')
writeToStats(government, 'government')
writeToStats(income, 'income')
writeToStats(alliances, 'alliances')
writeToStats(nuclear, 'nuclear')
writeToStats(lifeExpectancy, 'lifeExpectancy')

for (const [a2, obj] of Object.entries(stats)) {
  let notFound = [
    'area',
    'population',
    'government',
    'income',
    'nuclear',
    'lifeExpectancy'
  ].filter(key => !(obj[key]));
  if (!obj.alliances) {
    obj.alliances = [];
  }
  notFound.forEach((key) => obj[key] = null)
  notFound = notFound.filter(n => n != 'nuclear')
  if (notFound.length) {
    console.log(`Not found for ${a2} (${name[a2]}): ${notFound.join(', ')}`)
  }
}

const path = require('path')
require('fs').writeFileSync(
  path.join(__dirname, 'stats.json'),
  JSON.stringify(stats, null, 2)
)