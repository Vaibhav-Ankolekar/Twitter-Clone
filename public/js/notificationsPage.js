$(document).ready(() => {
	$.get("/api/notifications", (data) => {
		outputNotificationList(data, $(".resultsContainer"));
		$(".loadingSpinnerContainer").remove();
	});
});

$("#markAllNotificationAsRead").click(() => {
	markNotificationAsOpened();
})

const outputNotificationList = (notifications, container) => {
	notifications.forEach((notification) => {
		let html = createNotificationHtml(notification);
		container.append(html);
	});

	if (notifications.length == 0) {
		container.append("<div class='noResults'>Nothing to show.</div>");
	}
};


