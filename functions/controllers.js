export async function onRequest(context) {
  const apiUrl = 'https://live.env.vnas.vatsim.net/data-feed/controllers.json';
  const apiRes = await fetch(apiUrl);
  const apiData = await apiRes.text();
  return new Response(apiData, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
