function getToken(key, options) {
	options = options || {}
	let epoch, time, shaObj, hmac, offset, otp
	options.period = options.period || 30
	options.algorithm = options.algorithm || "SHA-1"
	options.digits = options.digits || 6
	options.timestamp = options.timestamp || Date.now()
	key = base32tohex(key)
	epoch = Math.floor(options.timestamp / 1000.0)
	time = leftpad(dec2hex(Math.floor(epoch / options.period)), 16, "0")
	shaObj = new jsSHA(options.algorithm, "HEX")
	shaObj.setHMACKey(key, "HEX")
	shaObj.update(time)
	hmac = shaObj.getHMAC("HEX")
	offset = hex2dec(hmac.substring(hmac.length - 1))
	otp = (hex2dec(hmac.substr(offset * 2, 8)) & hex2dec("7fffffff")) + ""
	otp = otp.substr(Math.max(otp.length - options.digits, 0), options.digits)
	return otp
}

function hex2dec(s) {
	return parseInt(s, 16)
}

function dec2hex(s) {
	return (s < 15.5 ? "0" : "") + Math.round(s).toString(16)
}

function base32tohex(base32Encoded) {
	let base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
		bits = "",
		hex = ""

	base32Encoded = base32Encoded.replace(/=+$/, "")

	for (let i = 0; i < base32Encoded.length; i++) {
		let val = base32chars.indexOf(base32Encoded.charAt(i).toUpperCase())
		if (val === -1) throw new Error("Invalid base32 character in key")
		bits += leftpad(val.toString(2), 5, "0")
	}

	for (let i = 0; i + 8 <= bits.length; i += 8) {
		let chunk = bits.substr(i, 8)
		hex = hex + leftpad(parseInt(chunk, 2).toString(16), 2, "0")
	}
	return hex
}

function leftpad(str, len, pad) {
	if (len + 1 >= str.length) {
		str = Array(len + 1 - str.length).join(pad) + str
	}
	return str
}

function updateKey() {
    const input = document.getElementById("input").value
    const prefix = 'otpauth://totp/myapp_user?secret='
    const base32Encoded = base32.encode(input).split("=")[0]
    document.getElementById("key").innerHTML = base32Encoded
    document.getElementById("qrCode").src = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${prefix}${base32Encoded}`
    const token = getToken(base32Encoded)
    document.getElementById("token").innerHTML = token
}

function updateTimeOnUI(timeRemaining) {
    const el = document.getElementById("timeRemaining")
    el.innerHTML = timeRemaining
}

setInterval(() => {
    const ts = new Date()
    const seconds = ts.getSeconds()
    const diff =  30 - seconds%30

    const tokenDiv = document.getElementById("token")

    updateTimeOnUI(diff)
    if (diff <= 5) {
        tokenDiv.classList.remove("text-success");
        tokenDiv.classList.add("text-danger");
    } else {
        tokenDiv.classList.add("text-success");
        tokenDiv.classList.remove("text-danger");
    }
    if (diff >= 29) {
        const key = document.getElementById("key").innerHTML
        const token = getToken(key)
        console.log(key, token)
        tokenDiv .innerHTML = token
    }
}, 1000)
