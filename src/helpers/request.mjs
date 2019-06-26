async function json(url, options) {
  const response = fetch(url, options);
  return await response.json();
}

async function text(url, options) {
  const response = fetch(url, options);
  return await response.text();
}

export default {
  json,
  text
};
