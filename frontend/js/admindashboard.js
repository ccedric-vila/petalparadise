$(document).ready(function () {
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');

    if (!token || !userId) {
        return window.location.href = "/frontend/Userhandling/login.html";
    }

    $.ajax({
        method: "GET",
        url: `http://localhost:4000/api/v1/profile/${userId}`,
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function (res) {
            if (res.user.role !== 'admin') {
                sessionStorage.clear();
                // Show authorization message before redirect
                Swal.fire({
                    title: "Access Denied",
                    text: "You do not have admin privileges to access this page.",
                    icon: "error",
                    confirmButtonText: "OK"
                }).then(() => {
                    window.location.href = "/frontend/Userhandling/home.html";
                });
                return;
            }

            $("#adminName").text(res.user.name);
        },
        error: function () {
            sessionStorage.clear();
            window.location.href = "/frontend/Userhandling/login.html";
        }
    });

    // Admin dashboard data request
    $.ajax({
        method: "GET",
        url: "http://localhost:4000/api/v1/admindashboard",
        headers: { 'Authorization': `Bearer ${token}` },
        success: function (res) {
            const stats = res.stats;
            $("#statUsers").text(stats.customers);
            $("#statProducts").text(stats.products);
            $("#statOrders").text(stats.orders);
            $("#statReviews").text(stats.reviews);
        },
        error: function (xhr) {
            // Handle authorization errors from the backend
            if (xhr.status === 403) {
                const response = xhr.responseJSON;
                Swal.fire({
                    title: "Access Denied",
                    text: response.message || "You do not have permission to access admin resources.",
                    icon: "error",
                    confirmButtonText: "OK"
                }).then(() => {
                    sessionStorage.clear();
                    window.location.href = response.redirectTo || "/frontend/Userhandling/home.html";
                });
            } else {
                Swal.fire("Error", "Failed to load dashboard stats", "error");
            }
        }
    });
});