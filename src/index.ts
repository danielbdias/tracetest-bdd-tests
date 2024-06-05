interface PaymentOrderResponse {
    status?: string;
}

const user = "admin";
const password = "supersecret";

export async function callAPI(apiEndpoint: string, apiPayload: { walletId: number; yearsAsACustomer: number; }) : Promise<string> {
    const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(user + ':' + password).toString('base64')
        },
        body: JSON.stringify(apiPayload)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as PaymentOrderResponse;
    return data.status || '';
}