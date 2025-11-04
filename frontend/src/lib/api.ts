const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL;

const constructAPIUrl = (path: string) => {
	return `${BASE_API_URL}${path}`;
};

export const fetchAPI = async (path: string) => {
	const req = await fetch(constructAPIUrl(path), { method: 'GET' });

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
