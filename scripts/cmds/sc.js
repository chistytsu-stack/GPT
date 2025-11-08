const { findUid } = global.utils;
const regExCheckURL = /^(http|https):\/\/(www\.)?facebook\.com\/[^ "]+$/;

module.exports = {
	config: {
		name: "sc",
		aliases: ["uid2","sharecontact","sc"],
		version: "1.6.9",
		author: "Nazrul",
		countDown: 5,
		role: 0,
		description: "Send target facebook UID as shareContact",
		category: "info",
		guide: "{pn}: send your UID as shareContact\n{pn} @tag: send UID of tagged user\n{pn} <link profile>: send UID from link\nReply to a message to send UID"
	},

	onStart: async function ({ event, args, api }) {
		try {
			let targetID = null;

			if (event.messageReply) {
				targetID = event.messageReply.senderID;
			} else if (event.mentions && Object.keys(event.mentions).length > 0) {
				targetID = Object.keys(event.mentions)[0];
			} else if (args[0] && args[0].match(regExCheckURL)) {
				for (const link of args) {
					try {
						const uid = api.getUID ? await api.getUID(link) : await findUid(link);
						if (uid) {
							targetID = uid;
							break;
						}
					} catch {}
				}
			}

			if (!targetID) targetID = event.senderID;

			await api.shareContact(targetID, targetID, event.threadID);
		} catch {}
	}
};
