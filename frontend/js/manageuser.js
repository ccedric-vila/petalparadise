$(document).ready(function () {
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');
    const apiUrl = 'http://localhost:4000/api/v1/users';
    const pdfDownloadUrl = 'http://localhost:4000/api/v1/manageuser/download/pdf';
    let allUsers = []; // store users for filtering

    if (!token || !userId) {
        return window.location.href = "/frontend/Userhandling/login.html";
    }

    // ✅ Verify if user is really admin
    $.ajax({
        method: "GET",
        url: `http://localhost:4000/api/v1/profile/${userId}`,
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function (res) {
            if (res.user.role !== 'admin') {
                sessionStorage.clear();
                return window.location.href = "/frontend/Userhandling/home.html";
            }

            loadUsers();
        },
        error: function () {
            sessionStorage.clear();
            window.location.href = "/frontend/Userhandling/login.html";
        }
    });

    function loadUsers() {
        $.ajax({
            url: apiUrl,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function (data) {
                allUsers = data; // save all users
                renderUsers(allUsers);
            },
            error: function () {
                alert('Failed to load users');
            }
        });
    }

    function renderUsers(users) {
        let rows = '';
        users.forEach((u, index) => {
            rows += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${u.name}</td>
                    <td>${u.email}</td>
                    <td>${u.contact_number || ''}</td>
                    <td>${u.address || ''}</td>
                    <td>${u.role}</td>
                    <td>${u.status}</td>
                    <td>
                        <button class="editBtn" data-id="${u.id}">Edit</button>
                    </td>
                </tr>`;
        });
        $('#userTable tbody').html(rows);
    }

    $('#userForm').on('submit', function (e) {
        e.preventDefault();

        const id = $('#userId').val();
        const user = {
            role: $('#role').val(),
            status: $('#status').val()
        };

        $.ajax({
            url: `${apiUrl}/${id}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(user),
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: () => {
                alert('Role and status updated!');
                $('#userForm')[0].reset();
                $('#submitBtn').text('Update');
                $('#userId').val('');
                $('#editingUserName').text('');
                loadUsers();
            },
            error: err => alert(err.responseJSON?.error || 'Error occurred.')
        });
    });

    $(document).on('click', '.editBtn', function () {
        const id = $(this).data('id');
        $.ajax({
            url: `${apiUrl}/${id}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function (u) {
                $('#userId').val(u.id);
                $('#role').val(u.role);
                $('#status').val(u.status);
                $('#submitBtn').text('Update');
                $('#editingUserName').text(`Editing: ${u.name}`);
                $('#formContainer').show();
            },
            error: function () {
                alert('Failed to load user details');
            }
        });
    });

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
            a.download = 'users.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
        })
        .catch(err => {
            console.error('PDF download error:', err);
            alert('Failed to download PDF.');
        });
    });

    // ✅ Filter immediately when dropdown changes
    $('#roleFilter, #statusFilter').on('change', function () {
        const selectedRole = $('#roleFilter').val();
        const selectedStatus = $('#statusFilter').val();

        const filtered = allUsers.filter(u => {
            const roleMatch = selectedRole ? u.role === selectedRole : true;
            const statusMatch = selectedStatus ? u.status === selectedStatus : true;
            return roleMatch && statusMatch;
        });

        renderUsers(filtered);
    });

});
