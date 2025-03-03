export const postRequest = async (url, body) => {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
    return await response.json();
};
