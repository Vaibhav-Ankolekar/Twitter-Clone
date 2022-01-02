$(document).ready(() => {
    $.get("/api/posts", { followingOnly: true }, (results) => {
        outputPost(results, $(".postsContainer"));
        $(".loadingSpinnerContainer").remove();
    });
});
