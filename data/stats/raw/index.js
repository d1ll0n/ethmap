const fs = require('fs')
const path = require('path')
  
const area = require('./area.json')
const population = require('./population.json')
const government = require('./government.json')
const income = require('./income.json')
const lifeExpectancy = require('./life-expectancy.json')
const alliances = require('./alliances-by-country.json')

const abbreviation = require('./abbreviation.json')
const countryToAlpha2 = abbreviation.reduce((obj, { country, abbreviation }) => ({
  ...obj,
  [country]: abbreviation
}), {})

const stats = {}
const outDir = path.join(__dirname, '..', 'a2')

const handlers = {
  income: (obj) => {
    let income = obj.incomeLevel?.value
    if (income === 'Aggregates') income = null;
    return {
      alpha2: obj.iso2Code,
      country: obj.name,
      income
    }
  }
}

function writeAlpha2(_countries, key, name) {
  if (!name) name = key;
  const out = {};
  const handler = handlers[key] ? handlers[key] : (c) => c;
  const countries = _countries.map(handler);
  for (const country of countries) {
    const a2 = country.alpha2 ?? countryToAlpha2[country.country];
    if (!a2) {
      console.log(`${key} not found: ${country.country}`);
      continue;
    }
    out[a2] = country[key];
  }
  fs.writeFileSync(
    path.join(outDir, `${name}-by-alpha2.json`),
    JSON.stringify(out, null, 2)
  )
}

writeAlpha2(area, 'area')
writeAlpha2(population, 'population')
writeAlpha2(government, 'government')
writeAlpha2(income, 'income')
writeAlpha2(lifeExpectancy, 'expectancy', 'lifeExpectancy')
writeAlpha2(alliances, 'alliances')