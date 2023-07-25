import fetch from "node-fetch";

export const getGNAutocomplete = async (
  placeName,
  countryCode,
  layers = "macroregion,region"
) => {
  const queryURL = process.env.PELIAS_GEONAME_API_URL.replace(
    /\{cc\}/,
    countryCode
  )
    .replace(/\{layers\}/, layers)
    .replace(/\{q\}/, encodeURIComponent(placeName));
  const response = await fetch(queryURL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (data.features && data.features.length > 0) {
    return data.features[0].properties;
  }
};

export const getWOFAutocomplete = async (
  placeName,
  countryCode,
  layers = "macroregion,region"
) => {
  const queryURL = process.env.PELIAS_WOF_API_URL.replace(/\{cc\}/, countryCode)
    .replace(/\{layers\}/, layers)
    .replace(/\{q\}/, encodeURIComponent(placeName));
  const response = await fetch(queryURL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (data.features && data.features.length > 0) {
    return data.features[0].properties;
  }
};

/**
 *
 * @param {*} placeName
 * @param {*} countryCode
 * @param {'state'|'county'} type
 * @returns
 */
export const getOSMAutocomplete = async (
  placeName,
  countryCode,
  type = "state"
) => {
  const queryURL = process.env.OSM_API_URL.replace(/\{cc\}/, countryCode)
    .replace(/\{q\}/, encodeURIComponent(placeName))
    .replace(/\{t\}/, type);
  const response = await fetch(queryURL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (data.length > 0) {
    return data[0];
  }
};

/**
 *
 * @param {*} id
 * @param {*} type
 * @returns
 */
export const fetchOSM = async (id, type) => {
  const queryURL = process.env.OSM_API_DETAILS_URL.replace(
    /\{id\}/,
    id
  ).replace(/\{t\}/, type);
  const response = await fetch(queryURL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (data && data.osm_type) {
    return {
      ...data,
      place_rank: data.rank_search,
      display_name: data.localname,
      osm_type: { R: "relation", W: "way", N: "node" }[data.osm_type],
    };
  }
};

/**
 *
 * @param {string} promptThatAskingJSON
 * @returns
 */
export const requestChatGPT = async (promptThatAskingJSON) => {
  const response = await fetch(process.env.CHATGPT_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.CHATGPT_MODEL,
      messages: [
        {
          role: "user",
          content: promptThatAskingJSON,
        },
      ],
    }),
  });
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  const raw = data.choices[0].message.content;
  try {
    return {
      raw: raw,
      obj: JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "")),
    };
  } catch (e) {
    console.error(raw);
    throw e;
  }
};
