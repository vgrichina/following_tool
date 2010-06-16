$(document).ready(function() {
    $("a.unfollow").each(function(index, it) {
        var href = $(it).attr("href");
        $(it).click(function() {
            // Send AJAX request
            $.get(href, null, function(data) {
                if (data.indexOf("Unfollowed") >= 0) {
                    var row = $(it).parent().parent();

                    // Delete row
                    row.remove();
                }
            })

            return false;
        });
    });
});

