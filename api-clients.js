import fetch from "node-fetch";

/**
 *
 * @param {*} placeName
 * @param {*} countryCode
 * @param {'state'|'county'} type
 * @returns
 */
export const RequestOSMFirstResult = async (
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
 * @param {string} promptThatAskingJSON
 * @returns
 */
export const RequestChatGPT = async (promptThatAskingJSON) => {
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
