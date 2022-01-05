// Globals
var cropper;
var timer;
var selectedUsers = [];

$(document).ready(() => {
    refreshMessagesBadge();
    refreshNotificationBadge();
})

$("#postTextarea, #replyTextarea").keyup((event) => {
    const textbox = $(event.target);
    const value = textbox.val().trim();

    const isModal = textbox.parents(".modal").length == 1;

    // const submitButton = $("#submitPostButton");
    const submitButton = isModal ? $("#submitReplyButton") : $("#submitPostButton");

    if (submitButton.length == 0) {
        return alert("No submit button found");
    }

    if (value == "") {
        submitButton.prop("disabled", true);
        return;
    }

    submitButton.prop("disabled", false);
});

$("#submitPostButton, #submitReplyButton").click((event) => {
    const button = $(event.target);

    const isModal = button.parents(".modal").length == 1;
    const textbox = isModal ? $("#replyTextarea") : $("#postTextarea");

    const data = {
        content: textbox.val(),
    };

    if (isModal) {
        const id = button.data().id;
        if (id == null) return alert("Button id is null");
        data.replyTo = id;
    }

    $.post("/api/posts", data, (postData) => {

        if (postData.replyTo) {
            emitNotification(postData.replyTo.postedBy);
            location.reload();
        }
        else {
            const html = createPostHtml(postData);
            $(".postsContainer").prepend(html);
            textbox.val("");
            button.prop("disabled", true);
        }
    });
});

$("#replyModal").on("show.bs.modal", (event) => {

    const button = $(event.relatedTarget);
    const postId = getPostIdFromElement(button);
    $("#submitReplyButton").data("id", postId);

    $.get("/api/post/" + postId, (results) => {
        outputPost(results.postData, $("#originalPostConatainer"))
    });

})

$("#replyModal").on("hidden.bs.modal", () => $("#originalPostConatainer").html = "")


$("#deletePostModal").on("show.bs.modal", (event) => {

    const button = $(event.relatedTarget);
    const postId = getPostIdFromElement(button);
    $("#deletePostButton").data("id", postId);

})

$("#unpinPostModal").on("show.bs.modal", (event) => {

    const button = $(event.relatedTarget);
    const postId = getPostIdFromElement(button);
    $("#unpinPostButton").data("id", postId);

})

$("#pinPostModal").on("show.bs.modal", (event) => {

    const button = $(event.relatedTarget);
    const postId = getPostIdFromElement(button);
    $("#pinPostButton").data("id", postId);

})

$("#unpinPostButton").click((event) => {
    const postId = $(event.target).data("id");

    $.ajax({
        url: `/api/posts/${postId}`,
        type: "PUT",
        data: { pinned: false },
        success: (data, status, xhr) => {
            location.reload();
        },
    });
})

$("#pinPostButton").click((event) => {
    const postId = $(event.target).data("id");

    $.ajax({
        url: `/api/posts/${postId}`,
        type: "PUT",
        data: { pinned: true },
        success: (data, status, xhr) => {
            location.reload();
        },
    });
})

$("#deletePostButton").click((event) => {
    const postId = $(event.target).data("id");

    $.ajax({
        url: `/api/posts/${postId}`,
        type: "DELETE",
        success: (data, status, xhr) => {
            location.reload();
        },
    });
})

$("#filePhoto").change((event) => {
    const input = $(event.target)[0];

    if (input.files && input.files[0]) {
        const reader = new FileReader;
        reader.onload = (e) => {
            let image = document.getElementById("imagePreview");
            image.src = e.target.result;

            if (cropper !== undefined) {
                cropper.destroy();
            }

            cropper = new Cropper(image, {
                aspectRatio: 1 / 1,
                background: false,
            });

        }
        reader.readAsDataURL(input.files[0]);
    }
    else {
        console.log("Image not found");
    }
});

$("#imageUploadButton").click(() => {
    const canvas = cropper.getCroppedCanvas();

    $(".modal-body").html($(".loadingSpinnerContainer").show());
    $("#imageUploadButton").prop("disabled", true);

    if (canvas == null) alert("Could not upload, image not selected");

    canvas.toBlob((blob) => {
        const formData = new FormData();
        formData.append("croppedImage", blob);

        $.ajax({
            url: "/api/users/profilePicture",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: () => location.reload(),
        })
    });
});

$("#coverPhoto").change((event) => {
    const input = $(event.target)[0];

    if (input.files && input.files[0]) {
        const reader = new FileReader;
        reader.onload = (e) => {
            let image = document.getElementById("coverPhotoPreview");
            image.src = e.target.result;

            if (cropper !== undefined) {
                cropper.destroy();
            }

            cropper = new Cropper(image, {
                aspectRatio: 16 / 9,
                background: false,
            });

        }
        reader.readAsDataURL(input.files[0]);
    }
});

$("#coverPhotoUploadButton").click(() => {

    if (!cropper) return alert("Could not upload, image not selected");
    const canvas = cropper.getCroppedCanvas();

    $(".modal-body").html($(".loadingSpinnerContainer").show());
    $("#coverPhotoUploadButton").prop("disabled", true);

    canvas.toBlob((blob) => {
        const formData = new FormData();
        formData.append("croppedImage", blob);

        $.ajax({
            url: "/api/users/coverPhoto",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: () => location.reload()
        })
    });
});

$("#userSearchTextbox").keydown((event) => {
    clearTimeout(timer);
    let textBox = $(event.target);
    let value = textBox.val();

    if (value == "" && (event.which == 8 || event.keyCode == 8)) {
        // remove user from selection
        selectedUsers.pop();
        updateSelectedUserHtml();
        $(".resultsContainer").html("");

        if (selectedUsers.length == 0)
            $("#createChatButton").prop("disabled", true);

        return;
    }

    timer = setTimeout(() => {
        value = textBox.val().trim();

        if (value == "") {
            $(".resultsContainer").html("");
        }
        else {
            searchUsers(value);
        }
    }, 1000);
});

$("#createChatButton").click(() => {
    let data = JSON.stringify(selectedUsers);

    $.post("/api/chats", { users: data }, (chat) => {
        if (!chat || !chat._id) {
            return alert("invalid response from server");
        }
        window.location.href = `/messages/${chat._id}`;
    });
});

$(document).on("click", ".likeButton", (event) => {
    const button = $(event.target);
    const postId = getPostIdFromElement(button);

    if (postId === undefined) return;

    $.ajax({
        url: `/api/posts/${postId}/like`,
        type: "PUT",
        success: (postData) => {
            button.find("span").text(postData.likes.length || "");

            if (postData.likes.includes(userLoggedIn._id)) {
                button.addClass("active");
                emitNotification(postData.postedBy);
            } else {
                button.removeClass("active");
            }
        },
    });
});

$(document).on("click", ".retweetButton", (event) => {
    const button = $(event.target);
    const postId = getPostIdFromElement(button);

    if (postId === undefined) return;

    $.ajax({
        url: `/api/posts/${postId}/retweet`,
        type: "POST",
        success: (postData) => {
            button.find("span").text(postData.retweetUsers.length || "");

            if (postData.retweetUsers.includes(userLoggedIn._id)) {
                button.addClass("active");
                emitNotification(postData.postedBy);
            } else {
                button.removeClass("active");
            }
        },
    });
});

$(document).on("click", ".post", (event) => {
    const element = $(event.target);
    const postId = getPostIdFromElement(element);

    if (postId !== undefined && !element.is("button")) {
        window.location.href = "/post/" + postId;
    }
});

$(document).on("click", ".followButton", (event) => {
    const button = $(event.target);
    const userId = button.data().user;

    $.ajax({
        url: `/api/users/${userId}/follow`,
        type: "PUT",
        success: (data, status, xhr) => {
            if (xhr.status == 404) {
                return;
            }

            let difference = 1;
            if (data.following && data.following.includes(userId)) {
                button.addClass("following");
                button.text("Following");
                emitNotification(userId);
            } else {
                difference = 1;
                button.removeClass("following");
                button.text("Follow");
            }

            const followersLabel = $("#followersValue");
            if (followersLabel.length != 0) {
                let followersText = parseInt(followersLabel.text());
                followersLabel.text(followersText + difference);
            }
        },
    });
});

$(document).on("click", ".notification.active", (event) => {
    let container = $(event.target);
    let notificationId = container.data().id;

    let href = container.attr("href");
    event.preventDefault();

    let callback = () => window.location = href;
    markNotificationAsOpened(notificationId, callback);
});

const outputPost = (results, container) => {
    container.html("");

    if (!Array.isArray(results)) {
        results = [result];
    }

    results.forEach((result) => {
        const html = createPostHtml(result);
        container.append(html);
    });

    if (results.length == 0) {
        container.append("<div class='noResults'>Nothing to show.</div>");
    }
};

const getPostIdFromElement = (element) => {
    const isRoot = element.hasClass("root");
    const rootElement = isRoot ? element : element.closest(".post");

    const postId = rootElement.data().id;
    if (postId === undefined) return alert("Post id undefined");

    return postId;
};

const createPostHtml = (postData, largeFont = false) => {
    if (postData == null) return alert("Post object is null");

    let isRetweet = postData.retweetData !== undefined;
    let retweetedBy = isRetweet ? postData.postedBy.username : null;
    postData = isRetweet ? postData.retweetData : postData;

    const postedBy = postData.postedBy;

    if (postedBy._id === undefined) {
        console.log("User object not populated");
    }

    const displayName = postedBy.firstName + " " + postedBy.lastName;
    const timestamp = timeDifference(new Date(), new Date(postData.createdAt));

    const likedButtonActiveClass = postData.likes.includes(userLoggedIn._id) ? "active" : "";

    const retweetButtonActiveClass = postData.retweetUsers.includes(userLoggedIn._id) ? "active" : "";

    const largeFontClass = largeFont ? "large-font" : "";

    let reTweetText = "";
    if (isRetweet) {
        reTweetText = ` <span>
                            <i class="fas fa-retweet"></i>
                            Retweeted by <a href='/profile/${retweetedBy}'>@${retweetedBy}</a>
                        </span>`;
    }

    let replyFlag = "";
    if (postData.replyTo && postData.replyTo._id) {
        const replyToUsername = postData.replyTo.postedBy.username;
        replyFlag = `   <div class="replyFlag">
                            Replying to <a href='/profile/${replyToUsername}'>@${replyToUsername}</a>
                        </div>`;
    }

    let buttons = "";
    let pinnedPostText = "";
    if (postData.postedBy._id == userLoggedIn._id) {

        let pinnedClass = "";
        let dataTarget = "#pinPostModal";
        if (postData.pinned === true) {
            pinnedClass = "active";
            dataTarget = "#unpinPostModal"
            pinnedPostText = "<i class='fas fa-thumbtack'></i> <span>Pinned Post</span>"
        }

        buttons = ` <button class="pinButton ${pinnedClass}"" data-id="${postData._id}" data-toggle="modal" data-target="${dataTarget}">
                        <i class="fas fa-thumbtack"></i>
                    </button>
                    <button data-id="${postData._id}" data-toggle="modal" data-target="#deletePostModal">
                        <i class="fas fa-times"></i>
                    </button>`
    }

    return `<div class='post ${largeFontClass}' data-id='${postData._id}'>

                <div class='postActionContainer'>${reTweetText}</div>

                <div class="mainContentContainer">
                    <div class="userImageContainer">
                        <img src="${postedBy.profilePic}">
                    </div>
                    <div class="postContentContainer">
                        <div class="pinnedPostText">${pinnedPostText}</div>
                        <div class="header">
                        <a href="/profile/${postedBy.username}" class="displayName">${displayName}</a>
                        ${buttons}
                        </div>
                        <div class="userPostDetails">
                            <span class="username">@${postedBy.username}</span>
                            <span class="date">${timestamp}</span>
                        </div>
                        ${replyFlag}
                        <div class="postBody">
                            <span>${postData.content}</span>
                        </div>
                        <div class="postFooter">
                            <div class="postButtonContainer">
                                <button data-toggle="modal" data-target="#replyModal" class="replyButton">
                                    <i class="far fa-comment"></i>
                                </button>
                            </div>
                            <div class="postButtonContainer green">
                                <button class="retweetButton ${retweetButtonActiveClass}">
                                    <i class="fas fa-retweet"></i>
                                    <span>${postData.retweetUsers.length || ""}</span>
                                </button>
                            </div>
                            <div class="postButtonContainer red">
                                <button class="likeButton ${likedButtonActiveClass}">
                                    <i class="far fa-heart"></i>
                                    <span>${postData.likes.length || ""}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
};

const timeDifference = (current, previous) => {
    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
        return Math.round(elapsed / 1000) + " seconds ago";
    } else if (elapsed < msPerHour) {
        return Math.round(elapsed / msPerMinute) + " minutes ago";
    } else if (elapsed < msPerDay) {
        return Math.round(elapsed / msPerHour) + " hours ago";
    } else if (elapsed < msPerMonth) {
        return Math.round(elapsed / msPerDay) + " days ago";
    } else if (elapsed < msPerYear) {
        return Math.round(elapsed / msPerMonth) + " months ago"
    } else {
        return Math.round(elapsed / msPerYear) + " years ago";
    }
};

const outputPostWithReplies = (results, container) => {
    container.html("");

    if ((results.replyTo !== undefined && results.replyTo != null) && results.replyTo._id !== undefined) {
        const html = createPostHtml(results.replyTo);
        container.append(html);
    }

    const mainPostHtml = createPostHtml(results.postData, true);
    container.append(mainPostHtml);

    results.replies.forEach((result) => {
        const html = createPostHtml(result);
        container.append(html);
    });
};

const outputUsers = (results, container) => {
    container.html("");

    results.forEach(result => {
        let html = createUserHtml(result, true);
        container.append(html);
    });

    if (results.length == 0) {
        container.append("<div class='noResults'>Nothing to show.</div>");
    }
};

const createUserHtml = (userData, showFollowButton) => {

    const name = userData.firstName + " " + userData.lastName;
    const isFollowing = userLoggedIn.following && userLoggedIn.following.includes(userData._id);
    const text = isFollowing ? "Following" : "Follow"
    const buttonClass = isFollowing ? "followButton following" : "followButton"

    let followButton = "";
    if (showFollowButton && userLoggedIn._id != userData._id) {
        followButton = `<div class="followButtonContainer">
							<button class="${buttonClass}" data-user="${userData._id}">${text}</button>
						</div>`;
    }

    return `<div class="user">
				<div class="userImageContainer">
					<img src='${userData.profilePic}'>
				</div>
				<div class="userDetailsContainer">
					<div class="header">
						<a href="/profile/${userData.username}">${name}</a>
						<span class="username">@${userData.username}</span>
					</div>
				</div>
				${followButton}
			</div>`
};

const searchUsers = (searchTerm) => {
    $.get("/api/users", { search: searchTerm }, (results) => {
        outputSelectableUsers(results, $(".resultsContainer"));
    });
};

const outputSelectableUsers = (results, container) => {
    container.html("");

    results.forEach(result => {

        if (result._id == userLoggedIn._id || selectedUsers.some(u => u._id == result._id)) {
            return;
        }

        let html = createUserHtml(result, false);
        var element = $(html);
        element.click(() => userSelected(result))

        container.append(element);
    });

    if (results.length == 0) {
        container.append("<div class='noResults'>Nothing to show.</div>");
    }
};

const userSelected = (user) => {
    selectedUsers.push(user);
    updateSelectedUserHtml();
    $("#userSearchTextbox").val("").focus();
    $(".resultsContainer").html("");
    $("#createChatButton").prop("disabled", false);
}

const updateSelectedUserHtml = () => {
    let elements = [];

    selectedUsers.forEach(user => {
        let name = user.firstName + " " + user.lastName;
        let userElement = $(`<span class="selectedUser">${name}</span>`);
        elements.push(userElement);
    })

    $(".selectedUser").remove();
    $("#selectedUsers").prepend(elements);
}

const getChatName = (chatData) => {
    let chatName = chatData.chatName;

    if (!chatName) {
        let otherChatUsers = getOtherChatUsers(chatData.users);
        let namesArray = otherChatUsers.map(user => user.firstName + " " + user.lastName);

        chatName = namesArray.join(", ");
    }

    return chatName;
}

const getOtherChatUsers = (users) => {
    if (users.length == 1) return users;

    return users.filter(user => user._id != userLoggedIn._id);
}

const messageReceived = (newMessage) => {
    if ($(`[data-room="${newMessage.chat._id}"]`).length == 0) {
        // show pop up notification
        showMessagePopup(newMessage);
    }
    else {
        addChatMessageHtml(newMessage);
    }
    refreshMessagesBadge();
}

const markNotificationAsOpened = (notificationId = null, callback = null) => {
    if (callback == null) callback = () => location.reload();

    let url = notificationId != null ? `/api/notifications/${notificationId}/markAsOpened` : `/api/notifications/markAsOpened`;

    $.ajax({
        url: url,
        type: "PUT",
        success: callback
    });
}

const refreshMessagesBadge = () => {
    $.get("/api/chats", { unreadOnly: true }, (data) => {

        let numResults = data.length;

        if (numResults > 0) {
            $(".messagesBadge").text(numResults).addClass("active");
        } else {
            $(".messagesBadge").text("").removeClass("active");
        }
    })
}

const refreshNotificationBadge = () => {
    $.get("/api/notifications", { unreadOnly: true }, (data) => {

        let numResults = data.length;

        if (numResults > 0) {
            $(".notificationsBadge").text(numResults).addClass("active");
        } else {
            $(".notificationsBadge").text("").removeClass("active");
        }
    })
}

const createNotificationHtml = (notification) => {
    let userFrom = notification.userFrom;
    let text = getNotificationText(notification);
    let href = getNotificationUrl(notification);
    let className = notification.opened ? "" : "active";

    return `<a href="${href}" class="resultListItem notification ${className}" data-id="${notification._id}">
				<div class="resultsImageContainer">
					<img src="${userFrom.profilePic}">
				</div>
				<div class="resultsDetailsContainer ellipsis">
					${text}
				</div>

			</a>`;
};

const getNotificationText = (notification) => {
    let userFrom = notification.userFrom;

    if (!userFrom.firstName || !userFrom.lastName) {
        return alert("User from data not populated");
    }

    let userFromName = `${userFrom.firstName} ${userFrom.lastName}`;

    let text;

    if (notification.notificationType == "retweet") {
        text = `${userFromName} retweeted one of your post`;
    }
    else if (notification.notificationType == "like") {
        text = `${userFromName} liked one of your post`;
    }
    else if (notification.notificationType == "reply") {
        text = `${userFromName} replied one of your posts`;
    }
    else if (notification.notificationType == "follow") {
        text = `${userFromName} followed you`;
    }

    return `<span class="ellipsis">${text}</span>`;
};

const getNotificationUrl = (notification) => {

    let url = "#";

    if (notification.notificationType == "retweet" ||
        notification.notificationType == "like" ||
        notification.notificationType == "reply") {
        url = `/post/${notification.entityId}`;
    }
    else if (notification.notificationType == "follow") {
        url = `/profile/${notification.entityId}`;
    }

    return url;
};

const showNotificationPopup = (data) => {
    let html = createNotificationHtml(data);
    let element = $(html);
    element.hide().prependTo("#notificationList").slideDown("fast");

    setTimeout(() => element.fadeOut(400), 5000);
}

const createChatHtml = (chatData) => {
    let chatName = getChatName(chatData);
    let image = getChatImageElements(chatData);
    let latestMessage = getLatestMessage(chatData.latestMessage);

    let activeClass = !chatData.latestMessage || chatData.latestMessage.readBy.includes(userLoggedIn._id) ? "" : "active";

    return `<a class="resultListItem ${activeClass}" href="/messages/${chatData._id}">
				${image}
				<div class="resultsDetailContainer ellipsis">
					<span class="heading ellipsis">${chatName}</span>
					<span class="subtext ellipsis">${latestMessage}</span>
				</div>
			</a>`
}

const getLatestMessage = (latestMessage) => {
    if (latestMessage != null) {
        let sender = latestMessage.sender;
        return `${sender.firstName} ${sender.lastName}: ${latestMessage.content}`
    }

    return 'New Chat';
}

const getChatImageElements = (chatData) => {
    let otherChatUsers = getOtherChatUsers(chatData.users);

    let groupChatClass = "";
    let chatImage = getUserChatImageElement(otherChatUsers[0]);

    if (otherChatUsers.length > 1) {
        groupChatClass = "groupChatImage";
        chatImage += getUserChatImageElement(otherChatUsers[1]);
    }

    return `<div class="resultsImageContainer ${groupChatClass}">${chatImage}</div>`;
}

const getUserChatImageElement = (user) => {
    if (!user || !user.profilePic) {
        return alert("User passed into function is invalid");
    }

    return `<img src="${user.profilePic}" alt="User's Profile Pic">`;
}

const showMessagePopup = (data) => {

    if (!Array.isArray(data.chat.latestMessage)) {
        data.chat.latestMessage = data;
    }

    let html = createChatHtml(data.chat);
    let element = $(html);
    element.hide().prependTo("#notificationList").slideDown("fast");

    setTimeout(() => element.fadeOut(400), 5000);
}