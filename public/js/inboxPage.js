$(document).ready(() => {
	$.get("/api/chats", (data, status, xhr) => {
		if (xhr.status == 400) {
			alert("Could not get chat list");
		}
		else {
			outputChatList(data, $(".resultsContainer"));
		}
		$(".loadingSpinnerContainer").remove();
	})
})

const outputChatList = (chatList, container) => {
	chatList.forEach(chat => {
		let html = createChatHtml(chat);
		container.append(html);
	})

	if (chatList.length == 0) {
		container.append("<div class='noResults'>Nothing to show.</div>");
	}
};

