// This is a browser-compatible adaptation of secrets.js
// It uses window.crypto for RNG instead of Node's crypto module.

var secrets = (function () {
    var defaults = {
        bits: 8, // default number of bits
        radix: 16, // work with HEX by default
        minBits: 3,
        maxBits: 20, // this allows up to 2^20 shares
        bytesPerChar: 2,
        maxBytesPerChar: 6, // Math.pow(256,7) > Math.pow(2,53)

        // Primitive polynomials (in decimal form) for Galois Fields GF(2^n), for 2 <= n <= 30
        // The index of each element corresponds to n (number of bits)
        primitivePolynomials: [
            null, null,
            7, 11, 19, 37, 67, 131, 283, 529, 1033, 2053, 4179, 8219, 17475, 32771, 65581, 131081, 262179, 524327, 1048585, 2097161, 4194319, 8388617
        ]
    };

    // Protected settings object
    var config = {};

    function init(bits) {
        var logs = [], exps = [], x = 1, primitive, i;

        // reset config
        config = {};

        bits = parseInt(bits, 10) || defaults.bits;

        if (bits < defaults.minBits || bits > defaults.maxBits) {
            throw new Error('Number of bits must be between ' + defaults.minBits + ' and ' + defaults.maxBits);
        }

        config.radix = defaults.radix;
        config.bits = bits;
        config.size = Math.pow(2, bits);
        config.max = config.size - 1;

        // Construct the exp and log tables
        primitive = defaults.primitivePolynomials[bits];

        for (i = 0; i < config.size; i++) {
            exps[i] = x;
            logs[x] = i;
            x = x << 1;
            if (x >= config.size) {
                x = x ^ primitive;
                x = x & config.max;
            }
        }

        config.logs = logs;
        config.exps = exps;
    }

    // Calculate random bits
    function getRNG() {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
            return function (bits) {
                var bytes = Math.ceil(bits / 8);
                var array = new Uint8Array(bytes);
                window.crypto.getRandomValues(array);
                var str = "";
                for (var i = 0; i < array.length; i++) {
                    var h = array[i].toString(16);
                    if (h.length < 2) h = "0" + h;
                    str += h;
                }
                return parseInt(str, 16);
            };
        } else {
            throw new Error("No secure random number generator available.");
        }
    }

    function runCSPRNG(bits) {
        var rng = getRNG();
        var val = rng(bits);
        // Mask out excess bits
        var mask = Math.pow(2, bits) - 1;
        return val & mask;
    }

    // Split a number into the shares
    function split(number, available, needed, poly) {
        if (poly) { var coef = poly; } else {
            // generate random coefficients
            var coef = [number];
            for (var i = 1; i < needed; i++) {
                coef[i] = runCSPRNG(config.bits);
            }
        }

        var x, y, shares = [];
        for (x = 1; x <= available; x++) {
            y = coef[coef.length - 1];
            for (var i = coef.length - 2; i >= 0; i--) {
                y = add(mult(y, x), coef[i]);
            }
            shares.push({ x: x, y: y });
        }
        return shares;
    }

    // Basic arithmetic for GF(2^n)
    function add(a, b) { return a ^ b; }
    function sub(a, b) { return a ^ b; } // Subtraction is same as addition
    function mult(a, b) {
        if (a === 0 || b === 0) return 0;
        var logA = config.logs[a];
        var logB = config.logs[b];
        return config.exps[(logA + logB) % config.max];
    }
    function div(a, b) {
        if (b === 0) throw new Error("Division by zero");
        if (a === 0) return 0;
        var logA = config.logs[a];
        var logB = config.logs[b];
        return config.exps[(logA - logB + config.max) % config.max];
    }

    function pad(num) {
        // Just ensure it fits in bits, though our math should keep it there
        return num;
    }

    // Public API
    var api = {
        init: init,

        // Generate a random hex string of length `bits`
        random: function (bits) {
            var bytes = Math.ceil(bits / 8);
            var array = new Uint8Array(bytes);
            window.crypto.getRandomValues(array);
            return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
        },

        // Share a hex string
        share: function (secret, numShares, threshold) {
            init(8); // Standard 8-bit GF(256) for hex bytes

            // Convert hex secret to array of bytes (numbers)
            var secretBytes = [];
            for (var i = 0; i < secret.length; i += 2) {
                secretBytes.push(parseInt(secret.substr(i, 2), 16));
            }

            // We need to generate `threshold-1` random polynomials for EACH byte of the secret
            // But actually, we can just run the split on each byte independently.
            // The `split` function above works on a single number.

            var shares = new Array(numShares).fill("").map((_, i) => {
                // Each share will start with the share ID (x) in hex
                // We'll use 1 byte for ID (supports up to 255 shares)
                var id = (i + 1).toString(16).padStart(2, '0');
                return id;
            });

            // For each byte of the secret
            for (var i = 0; i < secretBytes.length; i++) {
                var byte = secretBytes[i];
                // Split this byte
                var byteShares = split(byte, numShares, threshold);

                // Append the y-value of each share to the corresponding share string
                for (var j = 0; j < numShares; j++) {
                    shares[j] += byteShares[j].y.toString(16).padStart(2, '0');
                }
            }

            return shares;
        },

        // Combine shares to recover secret
        combine: function (shares) {
            init(8);

            // Parse shares
            // Each share is: [ID(1 byte)][Data....]
            var parsedShares = shares.map(s => {
                var id = parseInt(s.substr(0, 2), 16);
                var dataHex = s.substr(2);
                var data = [];
                for (var i = 0; i < dataHex.length; i += 2) {
                    data.push(parseInt(dataHex.substr(i, 2), 16));
                }
                return { id: id, data: data };
            });

            var secretHex = "";
            var len = parsedShares[0].data.length;

            // For each byte position
            for (var i = 0; i < len; i++) {
                // Collect the points (x, y) for this byte position from all shares
                var points = parsedShares.map(s => {
                    return { x: s.id, y: s.data[i] };
                });

                // Interpolate to find y at x=0
                var recoveredByte = combine(points);
                secretHex += recoveredByte.toString(16).padStart(2, '0');
            }

            return secretHex;
        }
    };

    // Initialize with default
    init(defaults.bits);

    return api;
})();

export default secrets;
