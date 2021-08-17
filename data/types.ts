export type OriginalCountry = {
  id: number
  name: string
  symbol: string
}

export type ISO_4217 = {
  name: string            // ISO4217-currency_name
  numeric_code: number    // ISO4217-currency_numeric_code
  alphabetic_code: string // ISO4217-currency_alphabetic_code
}

export type ISO_3166_1 = {
  alpha2: string        // ISO3166-1-Alpha-2
  alpha3: string        // ISO3166-1-Alpha-3
  numeric_code: number  // ISO3166-1-numeric
}

export type M49_Region = {
  name: string
  numeric_code: number
}

export type M49_Regions = {
  numeric_code: number | null
  region: M49_Region | null
  subregion: M49_Region | null
  intermediate_region: M49_Region | null
}

export type Names = {
  cldr: string | null     // CLDR display name
  official: string | null // official_name_en
  unterm_formal: string | null   // UNTERM English Formal
  unterm_short: string | null    // UNTERM English Short
}

export type FullCountry = {
  id: number
  original_name: string
  original_symbol: string
  long_name: string | null
  short_name: string | null
  abbreviation: string | null
  names: Names
  iso_3166_1: ISO_3166_1 | null
  m49: M49_Regions
  iso_4217: ISO_4217 | null
}