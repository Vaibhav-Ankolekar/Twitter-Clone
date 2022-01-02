$(document).ready(() => {
	$.get("/api/posts/" + postId, (results) => {
		outputPostWithReplies(results, $(".postsContainer"));
		$(".loadingSpinnerContainer").remove();
	});
});
