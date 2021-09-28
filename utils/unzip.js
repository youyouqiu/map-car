const pako = require('pako');
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const Base64 = {
    btoa: (input = '') => {
        const str = input;
        let output = '';

        for (let block = 0, charCode, i = 0, map = chars;
            str.charAt(i | 0) || (map = '=', i % 1);
            output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
            charCode = str.charCodeAt(i += 3 / 4);

            if (charCode > 0xFF) {
                throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
            }

            block = block << 8 | charCode;
        }

        return output;
    },

    atob: (input = '') => {
        const str = input.replace(/=+$/, '');
        let output = '';

        if (str.length % 4 == 1) {
            throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
        }
        for (let bc = 0, bs = 0, buffer, i = 0;
            buffer = str.charAt(i++);

            ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
                bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
        ) {
            buffer = chars.indexOf(buffer);
        }

        return output;
    },
};

/**
 * 解压缩字符串
 * @param zipData 经过 gzip压缩和base64编码的字符串   
 * @param callback 回调函数 用解压缩后的数据进行处理后续操作      
 */
export function ungzip(zipData) {
    // try {
    const punzipstr = zipData;
    // punzipstr =decodeURIComponent(punzipstr);
    const restored = pako.inflate(punzipstr, { to: 'string' }); // 解 压
    return restored;
    // }
}


/**
 * 
 * @param b64Data 
 */
export function unzip(b64Data) {
    // const binaryString = pako.gzip(b64Data, { to: 'string' });

    // return binaryString;

    let strData = Base64.atob(b64Data);
    //
    // Convert binary string to character-number array
    const charData = strData.split('').map(x => x.charCodeAt(0));


    // Turn number array into byte-array
    const binData = new Uint8Array(charData);


    // // unzip
    const data = pako.inflate(binData);


    // Convert gunzipped byteArray back to ascii string:
    strData = String.fromCharCode.apply(null, new Uint16Array(data));
    return strData;
}
