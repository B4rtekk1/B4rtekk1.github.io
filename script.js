$(document).ready(function() {
    $('#nav-toggle').click(function(e) {
        e.preventDefault();
        $(this).toggleClass('active');
        $('.nav-list').slideToggle(300);
    });
});