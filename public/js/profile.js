$(document).ready(() => {
	if (selectedTab === "replies") {
		loadReplies();
	}
	else {
		loadPosts();
	}
});

const loadPosts = () => {
	$.get("/api/posts", { postedBy: profileUserId, pinned: true }, (results) => {
		outputPinnedPost(results, $(".pinnedPostContainer"));
	});

	$.get("/api/posts", { postedBy: profileUserId, isReply: false }, (results) => {
		outputPost(results, $(".postsContainer"));
		$(".loadingSpinnerContainer").hide();
	});
};

const loadReplies = () => {
	$(".pinnedPostContainer").remove();
	$.get("/api/posts", { postedBy: profileUserId, isReply: true }, (results) => {
		outputPost(results, $(".postsContainer"));
		$(".loadingSpinnerContainer").hide();
	});
};

const outputPinnedPost = (results, container) => {
	if (results.length == 0) {
		container.hide();
		return;
	}

	container.html("");

	results.forEach((result) => {
		const html = createPostHtml(result);
		container.append(html);
	});
};