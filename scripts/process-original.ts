import http from 'https'
import fs from 'fs'
import path from 'path'
import countries from '../data/country-list.json'
import original from '../data/original-formatted.json'
import {
  OriginalCountry,
  ISO_4217,
  ISO_3166_1,
  M49_Regions,
  Names,
  FullCountry
} from '../data/types'

type CountryData = typeof countries[number]

const dataPath = path.join(__dirname, '..', 'data')

const imagesPath = path.join(dataPath, 'images');
const outPath = path.join(dataPath, 'countries.json')

if (!fs.existsSync(imagesPath)) fs.mkdirSync(imagesPath);

function downloadFile(alpha2: string, abbr: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/hampusborgos/country-flags/main/svg/${alpha2.toLowerCase()}.svg`
  const filePath = path.join(imagesPath, `${abbr}.svg`)
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filePath)) return resolve('');
    const file = fs.createWriteStream(filePath);
    http.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close()  // close() is async, call cb after close completes.
        resolve('')
      });
    }).on('error', (err) => {
      fs.unlinkSync(filePath)
      resolve(err.message)
    });
  })
}

const getISO_4217 = ({
  "ISO4217-currency_name": name,
  "ISO4217-currency_numeric_code": numeric_code,
  "ISO4217-currency_alphabetic_code": alphabetic_code,
}: CountryData): ISO_4217 | null => (name && numeric_code && alphabetic_code) ? {
  name,
  numeric_code: +numeric_code,
  alphabetic_code
} : null

const getISO_3166_1 = ({
  "ISO3166-1-Alpha-2": alpha2,
  "ISO3166-1-Alpha-3": alpha3,
  "ISO3166-1-numeric": numeric_code,
}: CountryData): ISO_3166_1 | null => (alpha2 && alpha3 && numeric_code) ? {
  alpha2, alpha3, numeric_code: +numeric_code
} : null

const getNames = ({
  "CLDR display name": cldr,
  "official_name_en": official,
  "UNTERM English Formal": unterm_formal,
  "UNTERM English Short": unterm_short,
}: CountryData): Names => ({ cldr, official, unterm_formal, unterm_short })

const getFirstFilledProp = (
  country: CountryData,
  keys: Array<keyof Omit<Omit<CountryData, "Geoname ID">, "M49">>
): string | null => {
  for (const key of keys) {
    if (country[key]) return country[key];
  }
  return null;
}

const getLongName = (country: CountryData): string | null => getFirstFilledProp(
  country, ['official_name_en', 'UNTERM English Formal']
)

const getShortName = (country: CountryData): string | null => getFirstFilledProp(
  country, ['CLDR display name', 'UNTERM English Short']
)

const getAbbreviation = (country: CountryData): string | null => getFirstFilledProp(
  country,
  [
    "ISO3166-1-Alpha-3",
    "IOC",
    "FIFA",
    "DS",
    "ITU"
  ]
);

const getM49_Regions = ({
  "M49": numeric_code,
  "Region Code": region_code,
  "Region Name": region_name,
  "Sub-region Code": subregion_code,
  "Sub-region Name": subregion_name,
  "Intermediate Region Code": intermediate_region_code,
  "Intermediate Region Name": intermediate_region_name,
}: CountryData): M49_Regions => ({
  numeric_code: numeric_code ? +numeric_code : null,
  region: (region_code && region_name) ? { numeric_code: +region_code, name: region_name } : null,
  subregion: (subregion_code && subregion_name) ? { numeric_code: +subregion_code, name: subregion_name } : null,
  intermediate_region: (intermediate_region_code && intermediate_region_name) ? { numeric_code: +intermediate_region_code, name: intermediate_region_name } : null,
})

function findByAbbreviation(abbreviation: string): CountryData | null {
  return countries.find(c =>
    c["ISO3166-1-Alpha-3"] === abbreviation ||
    c.ITU === abbreviation ||
    c.FIFA === abbreviation ||
    c.IOC === abbreviation
  ) || null;
}

function getFullCountry(country: CountryData, original: OriginalCountry): FullCountry {
  return {
    id: original.id,
    original_name: original.name,
    original_symbol: original.symbol,
    long_name: getLongName(country),
    short_name: getShortName(country),
    abbreviation: getAbbreviation(country),
    names: getNames(country),
    iso_3166_1: getISO_3166_1(country),
    m49: getM49_Regions(country),
    iso_4217: getISO_4217(country)
  }
}

const isoNotFound: string[] = [];
const imageNotFound: string[] = [];

const fullCountries: FullCountry[] = [];

async function mapCountry(country: OriginalCountry) {
  const countryISO = findByAbbreviation(country.symbol);
  if (!countryISO) {
    isoNotFound.push(country.symbol)
  } else {
    const fullCountry = getFullCountry(countryISO, country);
    fullCountries.push(fullCountry);
    const alpha2 = fullCountry.iso_3166_1?.alpha2;
    if (alpha2 && fullCountry.abbreviation) {
      const err = await downloadFile(alpha2, fullCountry.abbreviation);
      if (err) {
        imageNotFound.push(country.symbol)
      }
    } else {
      imageNotFound.push(country.symbol)
    }
  }
}

for (const country of original) {
  mapCountry(country)
}

require('fs').writeFileSync(outPath, JSON.stringify(fullCountries, null, 2))
console.log(`Countries not found:`)
isoNotFound.map(countries => console.log(countries))
console.log(`Images not found:`)
imageNotFound.map(countries => console.log(countries))