// api.js
export async function login(email, password) {
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Login failed');
        }

        return res.json();
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

export async function register(email, password) {
    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Registration failed');
        }

        return res.json();
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

export async function getStickies() {
    try {
        const res = await fetch('/api/get-stickies', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
            if (res.status === 401) {
                throw new Error('Unauthorized - redirecting to login');
            }
            throw new Error('Failed to get stickies');
        }

        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Get stickies error:', error);
        throw error;
    }
}

export async function postSticky({ title, text, color, x, y, groupId }) {
    try {
        // Get group ID from URL if not provided
        if (!groupId) {
            const pathParts = window.location.pathname.split('/');
            groupId = pathParts[pathParts.length - 1];
        }

        const res = await fetch('/api/post-sticky', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                title: title || 'New Note',
                text: text || '',
                color: color || '#ffeb3b',
                x: x || 50,
                y: y || 50,
                groupId: groupId,
                width: 250,
                height: 200
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to create sticky');
        }

        const data = await res.json();
        return { _id: data.id, title, text, color, x, y };
    } catch (error) {
        console.error('Post sticky error:', error);
        throw error;
    }
}

export async function updateStickyPosition(id, x, y) {
    try {
        const res = await fetch('/api/update-sticky-position', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id, x, y })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to update position');
        }

        return res.json();
    } catch (error) {
        console.error('Update sticky position error:', error);
        throw error;
    }
}

export async function updateStickyText(id, title, text) {
    try {
        const res = await fetch('/api/update-sticky-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id, title, text })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to update text');
        }

        return res.json();
    } catch (error) {
        console.error('Update sticky text error:', error);
        throw error;
    }
}

export async function removeSticky(id) {
    try {
        const res = await fetch('/api/remove-sticky', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to remove sticky');
        }

        return res.json();
    } catch (error) {
        console.error('Remove sticky error:', error);
        throw error;
    }
}

export async function updateStickySize(id, width, height) {
    try {
        const res = await fetch('/api/update-sticky-size', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id, width, height })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to update size');
        }

        return res.json();
    } catch (error) {
        console.error('Update sticky size error:', error);
        throw error;
    }
}

export async function createGroup(name, image) {
    try {
        const res = await fetch('/api/create-group', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, image })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to create group');
        }

        return res.json();
    } catch (error) {
        console.error('Create group error:', error);
        throw error;
    }
}

export async function getJoinedGroups() {
    try {
        const res = await fetch('/api/get-joined-groups', {
            method: 'GET',
            credentials: 'include'
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to get groups');
        }

        return res.json();
    } catch (error) {
        console.error('Get joined groups error:', error);
        throw error;
    }
}

export async function getAvailableScenes() {
    try {
        const res = await fetch('/api/get-avaliable-scenes', {
            method: 'GET'
        });

        if (!res.ok) {
            throw new Error('Failed to get available scenes');
        }

        return res.json();
    } catch (error) {
        console.error('Get available scenes error:', error);
        throw error;
    }
}

export async function addPersonToGroup(email, groupId) {
    try {
        // If groupId is not provided, get it from the URL
        if (!groupId) {
            const pathParts = window.location.pathname.split('/');
            groupId = pathParts[pathParts.length - 1];
        }

        const res = await fetch('/api/add-person-to-group', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, groupId })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to add person to group');
        }

        return res.json();
    } catch (error) {
        console.error('Add person to group error:', error);
        throw error;
    }
}
