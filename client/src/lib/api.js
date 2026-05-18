/**
 * SpeedAI — Shared API Helper
 *
 * Provides `apiCall()` which automatically attaches the Clerk session
 * token as a Bearer token to every request to the backend.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

/**
 * Make an authenticated API call to the SpeedAI backend.
 *
 * @param {string}  endpoint  — e.g. '/api/ai/article'
 * @param {object}  options
 * @param {string}  options.method   — HTTP method (default: 'GET')
 * @param {object}  options.body     — JSON body (auto-serialised)
 * @param {FormData} options.formData — Send as multipart/form-data instead of JSON
 * @param {string}  token           — Clerk session token
 * @returns {Promise<object>}       — Parsed JSON response
 */
export async function apiCall(endpoint, { method = 'GET', body, formData } = {}, token) {
    const headers = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchOptions = { method, headers };

    if (formData) {
        // Let the browser set Content-Type with boundary for multipart
        fetchOptions.body = formData;
    } else if (body) {
        headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(body);
    }

    const res = await fetch(`${BACKEND_URL}${endpoint}`, fetchOptions);

    const data = await res.json();

    if (!res.ok) {
        const error = new Error(data.error || 'Something went wrong');
        error.status = res.status;
        throw error;
    }

    return data;
}
