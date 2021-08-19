import path from 'path'
import fs from 'fs'
import {
  FullCountry,
  FullMetadata,
  Boost,
  Ranking,
  Stat,
  Trait,
  Date,
} from '../data/types';
import countries from '../data/countries.json'

const metadataDir = path.join(__dirname, '..', 'data', 'metadata');
if (!fs.existsSync(metadataDir)) fs.mkdirSync(metadataDir)

const toTrait = (name?: string, value?: string | null): Trait | null => {
  if (!value) return null
  return {
    trait_type: name,
    value
  }
}

const toStat = (name: string, value?: number | null): Stat | null => {
  if (!value) return null
  return {
    display_type: 'number',
    trait_type: name,
    value
  }
}

const getTraits = (country: FullCountry): Trait[] => {
  return [
    toTrait('Currency', country.iso_4217?.name),
    toTrait('Capital', country.capital),
    toTrait('Continent', country.continent),
    toTrait('Economy', country.economy),
    toTrait('Government', country.government),
    toTrait('Nuclear Weapon State', country.nuclear),
    ...country.alliances.map(alliance => toTrait(undefined, `Member of ${alliance}`)),
    ...country.languages.map(language => toTrait(undefined, `${language} Speaking`))
  ].filter(Boolean) as Trait[];
}

const getStats = (country: FullCountry): Stat[] => {
  let gdp = (country.gdp || 0) / 1e9;
  let shortGDP;
  if (gdp > 0) {
    for (let i = 2; i < 10; i++) {
      shortGDP = parseFloat(gdp.toFixed(i));
      if (shortGDP > 0) break;
    }
  }
  gdp = shortGDP ?? gdp;
  // if (+gdp.toFixed(2) > 0) 
  return [
    toStat('Population (Million)', country.population && country.population / 1e6),
    toStat('Area (sq. km)', country.area),
    toStat('Life Expectancy', country.lifeExpectancy),
    toStat('GDP (Billion USD)', gdp),
  ].filter(Boolean) as Stat[];
}

const md: string[] = [];

const getMetadata = (country: FullCountry): FullMetadata => {
  const traits = getTraits(country)
  const stats = getStats(country)
  const file = [
    `# ${country.short_name}\n`,
    `https://ethmap.zone/flags/${country.abbreviation}.svg\n`,
    `## Traits`,
    ...traits.map(
      t => `- ${t.trait_type ? `**${t.trait_type}**: ` : ``}${t.value}`
    ),
    '',
    `## Stats\n`,
    ...stats.map(
      t => `- ${t.trait_type ? `**${t.trait_type}**: ` : ''}${t.value}`
    )
  ].join('\n');
  md.push(file);

  return {
    external_url: 'https://ethmap.app',
    image: `https://ethmap.zone/flags/${country.abbreviation}.svg`,
    name: country.short_name as string,
    attributes: [
      ...getTraits(country),
      ...getStats(country)
    ]
  }
}

for (const country of countries) {
  const metadata = getMetadata(country as FullCountry);
  fs.writeFileSync(
    path.join(metadataDir, `${country.id}.json`),
    JSON.stringify(metadata)
  )
}

fs.writeFileSync(
  path.join(__dirname, '..', `metadata.md`),
  md.join('\n\n')
)