function parseText(response) {
    return response.text();
}

function parseBlob(response) {
    return response.blob();
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
        "Content-Type": "application/json"
    };
    let charset = "";
    if (options.charset) {
        charset = options.charset;
        delete options.charset;
    }

    // 合并头部信息
    options.headers = {
        ...commonHeaders,
        ...(options.headers || {})
    };

    // 跨域请求
    // options.mode = 'no-cors';
    // 允许cookie
    // options.credentials = 'include';

    if(charset === 'gbk') {
        return new Promise( (resolve, reject) => {
            fetch(url, options)
                .then(checkStatus)
                .then(parseBlob)
                .then(blob => {
                    let reader = new FileReader();
                    reader.onload = function(e) {
                        let text = reader.result;
                        resolve({data:text})
                    };
                    reader.readAsText(blob, 'GBK')
                })
                .catch(err => {
                    reject({err})
                });
        })
    }

    return fetch(url, options)
        .then(checkStatus)
        .then(parseText)
        .then(data => ({ data }))
        .catch(err => ({ err }));
}
