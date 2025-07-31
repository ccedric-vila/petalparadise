$(document).ready(function() {
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');
    const role = sessionStorage.getItem('role');
    const pdfDownloadUrl = 'http://localhost:4000/api/v1/reviews/download/pdf';
    let allReviews = []; // store all reviews globally

    // Check authentication and admin role
    if (!token || !userId || role !== 'admin') {
        sessionStorage.clear();
        return window.location.href = "/frontend/Userhandling/login.html";
    }

    loadReviews();

    function loadReviews() {
        $.ajax({
            url: 'http://localhost:4000/api/v1/managereview',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: res => {
                allReviews = res.reviews || [];
                renderReviews(allReviews); // render initially
            },
            error: (xhr, status, error) => {
                console.error('Failed to load reviews:', xhr.responseJSON || error);
                
                if (xhr.status === 401) {
                    alert('Session expired. Please login again.');
                    sessionStorage.clear();
                    window.location.href = "/frontend/Userhandling/login.html";
                } else {
                    alert('Failed to load reviews. Please try again.');
                }
            }
        });
    }

    function renderReviews(reviews) {
        let rows = '';
        if (reviews.length > 0) {
            reviews.forEach((r, idx) => {
                const reviewDate = new Date(r.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
                rows += `
                    <tr>
                        <td>${idx + 1}</td>
                        <td>${r.user_name}<br><small>ID: ${r.user_id}</small></td>
                        <td>Order #${r.order_id}<br><small>${r.products_ordered || 'No products'}</small></td>
                        <td><span style="color: #ffa000; font-size: 16px;">${stars}</span><br><small>(${r.rating}/5)</small></td>
                        <td style="max-width: 200px; word-wrap: break-word;">${r.comment || 'No comment'}</td>
                        <td>${reviewDate}</td>
                        <td>
                            <button class="deleteBtn" data-id="${r.id}">Delete</button>
                        </td>
                    </tr>`;
            });
        } else {
            rows = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 30px; color: #666;">
                        No reviews found
                    </td>
                </tr>`;
        }
        $('#reviewTable tbody').html(rows);
    }

    // Filter by rating dropdown listener
    $('#filterByRating').on('change', function () {
        const selected = parseInt($(this).val(), 10);
        if (isNaN(selected) || selected === 0) {
            renderReviews(allReviews);
        } else {
            const filtered = allReviews.filter(r => r.rating === selected);
            renderReviews(filtered);
        }
    });

    // Delete review handler
    $(document).on('click', '.deleteBtn', function() {
        const id = $(this).data('id');
        if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;

        const $btn = $(this);
        const originalText = $btn.text();
        $btn.prop('disabled', true).text('Deleting...');

        $.ajax({
            url: `http://localhost:4000/api/v1/managereview/${id}`,
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
            success: () => {
                alert('Review deleted successfully!');
                loadReviews();
            },
            error: (xhr, status, error) => {
                console.error('Failed to delete review:', xhr.responseJSON || error);
                if (xhr.status === 401) {
                    alert('Session expired. Please login again.');
                    sessionStorage.clear();
                    window.location.href = "/frontend/Userhandling/login.html";
                } else if (xhr.status === 404) {
                    alert('Review not found. It may have already been deleted.');
                    loadReviews();
                } else {
                    alert('Failed to delete review. Please try again.');
                }
                $btn.prop('disabled', false).text(originalText);
            }
        });
    });

    // Download PDF
    $('#downloadPdfBtn').click(function () {
        fetch(pdfDownloadUrl, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to download PDF');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reviews.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
        })
        .catch(err => {
            console.error('PDF download error:', err);
            alert('Failed to download PDF.');
        });
    });
});
