// api.js for mainscreen
export async function getPendingShareRequests() {
    try {
        const res = await fetch('/api/get-pending-share-requests', {
            method: 'GET',
            credentials: 'include'
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to get pending share requests');
        }

        return res.json();
    } catch (error) {
        console.error('Get pending share requests error:', error);
        throw error;
    }
}

export async function respondToShareRequest(requestId, accept) {
    try {
        const res = await fetch('/api/respond-to-share-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ requestId, accept })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to respond to share request');
        }

        return res.json();
    } catch (error) {
        console.error('Respond to share request error:', error);
        throw error;
    }
}