function parseText(response) {
    return response.text();
}

function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
        return response;
    }
    const error = new Error(response.statusText);
    error.response = response;
    throw error;
}

export default function request(url, options = {}) {

    const commonHeaders = {
        'Content-Type': 'application/json'
    };

    //合并头部信息
    options.headers = {
        ...commonHeaders,
        ...(options.headers || {} )
    };

    // 跨域请求
    // options.mode = 'no-cors';
    // 允许cookie
    // options.credentials = 'include';

    return fetch(url, options)
        .then(checkStatus)
        .then(parseText)
        .then(data => ({data}))
        .catch(err => ({err}));
}
