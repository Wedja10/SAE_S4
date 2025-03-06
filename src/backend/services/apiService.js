export const postRequest = async (url, body) => {
    console.log(`Making POST request to: ${url}`);
    console.log(`Request body:`, body);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error response: ${errorText}`);
            throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`Response data:`, data);
        return data;
    } catch (error) {
        console.error(`API request failed: ${error.message}`);
        throw error;
    }
};
