# EthMap Data

Sources:
- https://datahub.io/core/country-list
  - Added entries for Kosovo and Northern Cyprus using info from neighbors for region and wikipedia / other sources for primary info
- http://api.worldbank.org/v2/en/indicator/NY.GDP.MKTP.CD?downloadformat=csv
- https://github.com/samayo/country-json
- https://datahub.io/core/language-codes
## Goals

- [] Process wiki-countries into formatted countries
- [] Find sources for other data we need and process it
- [] Create an API conforming to [OpenSea's metadata standards](https://docs.opensea.io/docs/metadata-standards)

## Metadata Standard

https://docs.opensea.io/docs/metadata-standards

## Status

Processed original data, matched to info from country-list to create the output file `data/countries.json`, and downloaded the flags of every country into `data/images` as SVG files.

Country flags are stored under their abbreviations. Abbreviations default to ISO-3166-1 alpha3 codes, and then fall back to a variety of secondary abbreviations for countries without ISO designations (Kosovo, Northern Cyprus). For these, we use other abbreviations the countries have chosen for themselves.

We currently have:
- Flags
- Full name
- Abbreviation
- Languages
- Currencies (ISO-4217)
- Region info (M49)
- ISO identifiers (ISO-3166-1)
- Membership of various alliances:
  - NATO
  - European Union
  - Arab League
  - African Union
  - OAS
  - G7
  - G20
  - CARICOM
  - Rio Pact
  - ZPCAS
  - OIC
  - Based
  - Future Of France

We can use the abbreviations to match countries with their corresponding data from the wiki countries data, which is in `data/wiki-countries` to get most of the remaining info we need.