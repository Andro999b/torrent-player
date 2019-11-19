var x = '#2aHR0cDovL2RhdGExMS1jZG4uZGF0YWxvY2sucnUvZmkybG0vNGYwYzk//b2xvbG8=xMjAwNzQ5ZGZlMTNhZjYwOWIwOTY5ODcyYjcvN2ZfTXIuUm9ib3QuUzA0RTAyLjcyMHAucnVzLkxvc3RGaWxtLlRWLmExLjE2LjEwLjE5Lm1wNA=='
var a = x.substr(2)

function b1(str) {
    const binary = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
        })

    return Buffer.from(binary, 'binary').toString('base64')
}

function b2(str) {
    const encodedUrl = Buffer.from(str, 'base64').toString('binary').split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join('')
    return decodeURIComponent(encodedUrl)
}

a = a.replace('//' + b1('ololo'), '')

try {
    a = b2(a)
} catch (e) {
    a = ''
}

console.log(a)