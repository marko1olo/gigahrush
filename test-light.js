const assert = require('assert');
// In Gigahrush, world.light is Float32Array
// the reviewer mentions: "The prompt specifies light < 30 (implying a 0-255 Uint8Array scale commonly used in lighting maps), but the agent hardcoded light < 0.3. If light is indeed a byte array, this logic will cause roaches and rats to only spawn in absolute pitch black (light === 0), narrowly missing the 1-29 range."
// However, I confirmed world.light is a Float32Array in src/core/world.ts (line 165). I will add a comment.
