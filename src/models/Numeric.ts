export class Numeric {
    bits: bigint
    constructor(bits: Buffer | bigint | boolean | number[] | string) {
        if (Buffer.isBuffer(bits)) {
            this.bits = Numeric.fromBytes(bits);
        } else if (Array.isArray(bits)) {
            this.bits = Numeric.fromBytes(Buffer.from(bits));
        } else {
            this.bits = BigInt(bits);
        }
    }

    toJSON() {
        return {
            __type: 'Numeric',
            bits: this.bits.toString()
        }
    }

    static fromJSON(json: any): Numeric {
        return new Numeric(json.bits);
    }

    static fromBytes(buffer: Buffer) {
        if (buffer.length !== 16) throw new Error("Numeric is not 16 byte!");
        let hex = Buffer.from(buffer).reverse().toString("hex"); // Little-endian
        return BigInt("0x" + hex);
    }

    toBytes() {
        let hex = this.bits.toString(16).padStart(32, "0");
        let matches = hex.match(/../g) || [];
        return Buffer.from(matches.reverse().map(h => parseInt(h, 16)));
    }

    static fromU64(value: bigint | boolean | number | string) {
        return new Numeric(BigInt(value) << 48n); // 48-bit shift
    }

    toU64() {
        return this.bits >> 48n; // Kembali ke integer tanpa desimal
    }

    static fromFraction(numerator: number | bigint | string, denominator: number | bigint | string) {
        return new Numeric((BigInt(numerator) << 48n) / BigInt(denominator));
    }

    add(other: Numeric) {
        return new Numeric(this.bits + other.bits);
    }

    sub(other: Numeric) {
        return new Numeric(this.bits - other.bits);
    }

    mul(other: Numeric) {
        return new Numeric((this.bits * other.bits) >> 48n);
    }

    div(other: Numeric) {
        return new Numeric((this.bits << 48n) / other.bits);
    }

    gt(other: Numeric) {
        return this.bits > other.bits;
    }

    toString() {
        return `Numeric(bits=${this.bits.toString()})`;
    }
}