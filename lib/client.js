const { Readable: ReadableStream } = require('stream');

/**
 * streaming client-interface for the openpixelcontrol-protocol.
 * For protocol-details see http://openpixelcontrol.org/
 *
 *
 *
 * @constructor
 */
class OpcClientStream extends ReadableStream {
	constructor(options) {
		super();

		this.stream = this;
	}

	/**
	 * Send a SetPixelColors message.
	 * @param {number} channel Channel for the command to be sent on
	 * @param {Buffer | Uint32Array} data The raw pixel data to be rendered
	 */
	setPixelColors(channel, data) {
		if (data instanceof Uint32Array) {
			const tmp = Buffer.alloc(3 * data.length);

			for (let i = 0; i < data.length; i++) {
				const rgb = data[i];

				tmp.writeUInt8((rgb >> 16) & 0xff, 3 * i);
				tmp.writeUInt8((rgb >> 8) & 0xff, 3 * i + 1);
				tmp.writeUInt8(rgb & 0xff, 3 * i + 2);
			}

			data = tmp;
		}

		const msg = OpcClientStream.createMessage(channel, OpcClientStream.Command.SETPIXELCOLORS, data);

		this.push(msg);
	}

	/**
	 * Sends a SysEx message
	 * @param {number} channel Channel for the command to be sent on
	 * @param {number} systemId 16-bit integer indicating the systemId
	 * @param {Buffer} data The data to be sent.
	 */
	sysex(channel, systemId, data) {
		const buffer = Buffer.alloc(2 + data.length);

		buffer.writeUInt16BE(systemId, 0, true);
		data.copy(buffer, 2);

		const msg = OpcClientStream.createMessage(channel, OpcClientStream.Command.SYSEX, buffer);

		this.push(msg);
	}

	/**
	 * required to implement for readable-streams.
	 * Doesn't do anything as data is only pushed from other API-methods
	 * @private
	 */
	_read() {}

	/**
	 * Creates a new OpenPixelControl message
	 * @param {number} channel
	 * @param {OpcClientStream.Command} command
	 * @param {Buffer} data
	 * @returns {Buffer}
	 */
	static createMessage(channel, command, data) {
		const msg = Buffer.alloc(4 + data.length);

		msg.writeUInt8(channel, 0, true);
		msg.writeUInt8(command, 1, true);
		msg.writeUInt16BE(data.length, 2, true);

		data.copy(msg, 4);

		return msg;
	}
}

/**
 * @enum {number}
 */
OpcClientStream.Command = {
	SETPIXELCOLORS: 0x00,
	SYSEX: 0xff
};

module.exports = OpcClientStream;
