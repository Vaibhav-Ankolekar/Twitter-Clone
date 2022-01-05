let connected = false;

server_url = window.location.protocol + "//" + window.location.host;
let socket = io(server_url);

socket.emit("setup", userLoggedIn);

socket.on("connected", () => connected = true);

socket.on("message received", (newMessage) => messageReceived(newMessage));

socket.on("notification received", () => {
	$.get("/api/notifications/latest", (notification) => {
		showNotificationPopup(notification);
		refreshNotificationBadge();
	})
});

const emitNotification = (userId) => {
	if (userId == userLoggedIn._id) return;

	socket.emit("notification received", userId);
}

