$("#searchBox").keydown((event) => {
	clearTimeout(timer);
	let textBox = $(event.target);
	let value = textBox.val();
	let searchType = textBox.data().search;

	timer = setTimeout(() => {
		value = textBox.val().trim();

		if (value == "") {
			$(".resultsContainer").html("");
		}
		else {
			search(value, searchType);
		}
	}, 1000);
});

const search = (searchTerm, searchType) => {
	let url = (searchType == "posts") ? "/api/posts" : "/api/users";

	$.get(url, { search: searchTerm }, (results) => {
		if (searchType == "posts") {
			outputPost(results, $(".resultsContainer"));
		}
		else {
			outputUsers(results, $(".resultsContainer"))
		}
	})
};