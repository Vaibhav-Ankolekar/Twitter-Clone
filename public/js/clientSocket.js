let connected = false;

let socket = io("http://localhost:5000");

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

