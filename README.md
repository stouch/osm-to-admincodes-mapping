# OSM Admin Codes

It can be useful to get the structure of all the admin areas (states), and their sub admin areas (counties), of any country. This project allows this using ChatGPT and a OpenStreetMap Nominatim instance.

Currently available countries are :

- France
- Italy
- Belgium
- Switzerland

Outputs are in `./output/osm-to-admin-codes`

## Prerequisites

You need to set the .env file, with your ChatGPT token and the Nominatim server you want to use. 
**Be warned that the official Nominatim server has rate usage limits.**

## Installation

```bash
nvm use
npm ci
```

## Dev (new country)

Create a `./prompts/<country>.txt` for ChatGPT, and then you can execute Usage commands below.

## Usage

```bash
node main.js FR
```

Full OSM administrative areas structure of the country is created in `./output/osm-country-admin-areas`

(If it does not exist, an intermediate helper outputs generated using ChatGPT is created in `./output-intermediate`)

Then :

```bash
node osm-to-codes.js FR
```

The final outputs in `./output/osm-to-admin-codes`

## Example

Example for a french _Région_ and its _départements_ (FR.json) :

```json
{
  "relation:3792877": {
    "code": "84",
    "identifier": "ARA",
    "children": {
      "relation:7411": { "code": "01" },
      "relation:1450201": { "code": "03" },
      "relation:7430": { "code": "07" },
      "relation:7381": { "code": "15" },
      "relation:7434": { "code": "26" },
      "relation:7452": { "code": "43" },
      "relation:7407": { "code": "74" },
      "relation:7437": { "code": "38" },
      "relation:7420": { "code": "42" },
      "relation:7406": { "code": "63" },
      "relation:4850451": { "code": "69" },
      "relation:7425": { "code": "73" }
    }
  }, ...
}
```
