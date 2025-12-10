// Use different API URLs for server-side vs client-side
// Server-side (React Server Components): use API_URL for Docker networking
// Client-side (browser): use NEXT_PUBLIC_API_URL for localhost
const getBaseAPIUrl = () => {
	// Check if running on server (React Server Components)
	if (typeof window === 'undefined') {
		// Server-side: prefer API_URL (Docker service name), fallback to NEXT_PUBLIC_API_URL
		return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
	}
	// Client-side: always use NEXT_PUBLIC_API_URL
	return process.env.NEXT_PUBLIC_API_URL;
};

const constructAPIUrl = (path: string) => {
	const baseUrl = getBaseAPIUrl();
	return `${baseUrl}${path}`;
};

export const fetchAPI = async (path: string, options?: RequestInit) => {
	const req = await fetch(constructAPIUrl(path), {
		method: 'GET',
		...options,
	});

	if (req.status === 404) {
		throw new Error('404 Not Found: The requested paper could not be found.');
	}

	if (!req.ok) {
		const errorDetail = await req.text();
		throw new Error(
			`API Request Failed: ${req.status} ${req.statusText} - Detail: ${errorDetail.substring(0, 150)}...`,
		);
	}

	return req.json();
};

export const postAPI = async (path: string, body: Record<string, unknown>) => {
	const req = await fetch(constructAPIUrl(path), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});

	if (!req.ok) {
		const errorDetail = await req.text();
		throw new Error(
			`API Request Failed: ${req.status} ${req.statusText} - Detail: ${errorDetail.substring(0, 150)}...`,
		);
	}

	return req.json();
};

export const uploadFileAPI = async (path: string, formData: FormData) => {
	const req = await fetch(constructAPIUrl(path), {
		method: 'POST',
		body: formData,
		// Don't set Content-Type header - browser sets it with boundary for multipart/form-data
	});

	if (!req.ok) {
		const errorDetail = await req.text();
		throw new Error(
			`API Request Failed: ${req.status} ${req.statusText} - Detail: ${errorDetail.substring(0, 150)}...`,
		);
	}

	return req.json();
};
