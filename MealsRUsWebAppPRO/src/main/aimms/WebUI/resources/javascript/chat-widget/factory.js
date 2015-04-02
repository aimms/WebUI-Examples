// factory.js
AWF.Bus.subscribe({
	onDecorateElement: function(elQ, type) {
		if (type === "chat") {
			elQ.aimms_chat_widget();
		}
	},
});
