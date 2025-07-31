$(document).ready(function () {
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');
    const pdfDownloadUrl = 'http://localhost:4000/api/v1/orders/download/pdf';
    let allOrders = []; // ✅ store all loaded orders for filtering

    if (!token || !userId) {
        return window.location.href = "/frontend/Userhandling/login.html";
    }

    // ✅ Verify admin
    $.ajax({
        method: "GET",
        url: `http://localhost:4000/api/v1/profile/${userId}`,
        headers: { 'Authorization': `Bearer ${token}` },
        success: function (res) {
            if (!res.user || res.user.role !== 'admin') {
                alert('Access denied: admin only');
                sessionStorage.clear();
                return window.location.href = "/frontend/Userhandling/login.html";
            }

            // ✅ If admin, load orders
            loadOrders();
        },
        error: function (err) {
            console.error('Failed to verify admin', err);
            sessionStorage.clear();
            window.location.href = "/frontend/Userhandling/login.html";
        }
    });

    function loadOrders() {
        $.ajax({
            url: 'http://localhost:4000/api/v1/orders',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (orders) {
                allOrders = orders; // ✅ save for filtering
                renderOrders(allOrders);
            },
            error: function (err) {
                console.error('Failed to load orders', err);
                alert('Could not load orders');
            }
        });
    }

    // ✅ Separate function to render table rows
    function renderOrders(orders) {
        let rows = '';
        orders.forEach((order, index) => {
            let actionButtons = getActionButtons(order.status, order.id);

            rows += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${order.customer_name || 'N/A'}</td>
                    <td><span class="status-badge status-${order.status.toLowerCase().replace(' ', '-')}">${order.status}</span></td>
                    <td>${order.shipping_address || '-'}</td>
                    <td class="amount">₱${order.total_amount || 0}</td>
                    <td class="actions-cell">
                        ${actionButtons}
                    </td>
                </tr>`;
        });
        $('#orderTable tbody').html(rows);
    }

    // Generate action buttons based on order status
    function getActionButtons(status, orderId) {
        switch (status) {
            case 'Pending':
                return `
                    <button class="btn-confirm" data-id="${orderId}" data-action="Confirmed">Confirm Order</button>
                    <button class="btn-cancel" data-id="${orderId}" data-action="Cancelled">Cancel Order</button>
                `;
            case 'Confirmed':
                return `
                    <span class="status-text confirmed-text">✓ Confirmed</span>
                    <button class="btn-delivery" data-id="${orderId}" data-action="Out for Delivery">Out for Delivery</button>
                `;
            case 'Out for Delivery':
                return `
                    <span class="status-text delivery-text">🚚 Out for Delivery</span>
                    <button class="btn-delivered" data-id="${orderId}" data-action="Delivered">Mark as Delivered</button>
                `;
            case 'Delivered':
                return `<span class="status-completed">✅ Completed</span>`;
            case 'Cancelled':
                return `<span class="status-cancelled">❌ Cancelled</span>`;
            default:
                return '-';
        }
    }

    // Handle action button clicks
    $(document).on('click', '.btn-confirm, .btn-cancel, .btn-delivery, .btn-delivered', function () {
        const orderId = $(this).data('id');
        const action = $(this).data('action');
        const buttonText = $(this).text();

        // Confirm action
        if (confirm(`Are you sure you want to ${buttonText.toLowerCase()} this order?`)) {
            updateOrderStatus(orderId, action, buttonText);
        }
    });

    // Update order status
    function updateOrderStatus(orderId, status, actionName) {
        // Show loading state
        const $button = $(`[data-id="${orderId}"][data-action="${status}"]`);
        const originalText = $button.text();
        $button.text('Processing...').prop('disabled', true);

        $.ajax({
            url: `http://localhost:4000/api/v1/orders/${orderId}/status`,
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            contentType: 'application/json',
            data: JSON.stringify({ status }),
            success: function () {
                alert(`Order ${actionName.toLowerCase()}ed successfully!`);
                loadOrders(); // Reload the table
            },
            error: function (err) {
                console.error(`Failed to ${actionName.toLowerCase()} order:`, err);
                alert(`Failed to ${actionName.toLowerCase()} order`);
                // Restore button state
                $button.text(originalText).prop('disabled', false);
            }
        });
    }

    // ✅ PDF Download button
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
            a.download = 'orders.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
        })
        .catch(err => {
            console.error('PDF download error:', err);
            alert('Failed to download PDF.');
        });
    });

    // ✅ Status filter handler
    $('#statusFilter').on('change', function () {
        const selectedStatus = $('#statusFilter').val();

        const filtered = selectedStatus
            ? allOrders.filter(o => o.status === selectedStatus)
            : allOrders;

        renderOrders(filtered);
    });
});
