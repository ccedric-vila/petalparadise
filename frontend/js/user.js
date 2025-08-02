$(document).ready(function () {
    const url = `http://localhost:4000/api/v1/register`;
    
    // Custom validation methods
    $.validator.addMethod("nameFormat", function(value, element) {
        return this.optional(element) || (/^[A-Za-z\s]+$/.test(value) && /[A-Z]/.test(value) && /[a-z]/.test(value));
    }, "Name must contain both uppercase and lowercase letters, no numbers allowed");

    $.validator.addMethod("passwordFormat", function(value, element) {
        return this.optional(element) || /^(?=.*[A-Z])(?=.*\d).+$/.test(value);
    }, "Password must contain at least one uppercase letter and minimum of 1 number");

    $.validator.addMethod("addressFormat", function(value, element) {
        return this.optional(element) || /[A-Z]/.test(value);
    }, "Address must contain at least one uppercase letter");

    // 🔍 VALIDATION FOR REGISTRATION FORM
    $("#registerForm").validate({
        rules: {
            name: {
                required: true,
                minlength: 2,
                maxlength: 100,
                nameFormat: true
            },
            email: {
                required: true,
                email: true,
                minlength: 8,
                maxlength: 100
            },
            password: {
                required: true,
                passwordFormat: true
            }
        },
        messages: {
            name: {
                required: "Full name is required",
                minlength: "Name must be at least 2 characters",
                maxlength: "Name cannot exceed 100 characters"
            },
            email: {
                required: "Email is required",
                email: "Please enter a valid email address",
                minlength: "Email must be at least 8 characters",
                maxlength: "Email cannot exceed 100 characters"
            },
            password: {
                required: "Password is required"
            }
        },
        errorElement: 'div',
        errorClass: 'error-message',
        errorPlacement: function(error, element) {
            error.insertAfter(element);
        },
        highlight: function(element) {
            $(element).addClass('error-input');
        },
        unhighlight: function(element) {
            $(element).removeClass('error-input');
        }
    });
    
    // 🔍 VALIDATION FOR PROFILE UPDATE FORM
    $("#profileForm").validate({
        rules: {
            name: {
                required: true,
                minlength: 2,
                maxlength: 100,
                nameFormat: true
            },
            contact_number: {
                required: true,
                digits: true,
                minlength: 11,
                maxlength: 11
            },
            address: {
                required: true,
                maxlength: 255,
                addressFormat: true
            }
        },
        messages: {
            name: {
                required: "Full name is required",
                minlength: "Name must be at least 2 characters",
                maxlength: "Name cannot exceed 100 characters"
            },
            contact_number: {
                required: "Phone number is required",
                digits: "Please enter only numbers",
                minlength: "Phone number must be exactly 11 digits",
                maxlength: "Phone number must be exactly 11 digits"
            },
            address: {
                required: "Address is required",
                maxlength: "Address cannot exceed 255 characters"
            }
        },
        errorElement: 'div',
        errorClass: 'error-message',
        errorPlacement: function(error, element) {
            error.insertAfter(element);
        },
        highlight: function(element) {
            $(element).addClass('error-input');
        },
        unhighlight: function(element) {
            $(element).removeClass('error-input');
        }
    });

    // 🔍 FETCH PROFILE DATA ON PAGE LOAD - FIXED VERSION
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');

    if (token && userId) {
        $.ajax({
            method: "GET",
            url: `http://localhost:4000/api/v1/profile/${userId}`,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function (data) {
                if (data.user) {
                    // Populate form fields with existing data
                    $('#fullName').val(data.user.name || '');
                    $('#phone').val(data.user.contact_number || '');
                    $('#address').val(data.user.address || '');
                    
                    // Handle profile image if exists - FIXED TO MATCH PRODUCT PATTERN
                    if (data.user.profile_image) {
                        // Extract just the filename if it includes path
                        let imageName = data.user.profile_image;
                        if (imageName.includes('/')) {
                            imageName = imageName.split('/').pop(); // Get just the filename
                        }
                        
                        $('#avatarPreview')
                            .attr('src', `/frontend/images/${imageName}`) // ✅ Same pattern as products
                            .show()
                            .on('error', function() {
                                console.log('Image not found, hiding preview');
                                this.style.display = 'none';
                            });
                        $('.upload-placeholder').hide();
                        $('.avatar-upload-area').addClass('has-image');
                    }
                }
            },
            error: function () {
                sessionStorage.clear();
                window.location.href = "/frontend/Userhandling/login.html";
            }
        });
    }

    // 📌 REGISTER USER
    $("#register").on('click', function (e) {
        e.preventDefault();
        
        if (!$("#registerForm").valid()) {
            return;
        }

        const name = $("#name").val().trim();
        const email = $("#email").val().trim();
        const password = $("#password").val().trim();

        const user = { name, email, password };

        $.ajax({
            method: "POST",
            url: `http://localhost:4000/api/v1/register`,
            data: JSON.stringify(user),
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                console.log(data);
                Swal.fire({
                    icon: "success",
                    text: "Registration successful! Redirecting to login...",
                    position: 'bottom-right',
                    timer: 1500,
                    showConfirmButton: false
                });

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1600);
            },
            error: function (error) {
                console.error(error);
                Swal.fire({
                    icon: "error",
                    text: "Registration failed. Please try again.",
                    position: 'bottom-right'
                });
            }
        });
    });

    // 🖼 AVATAR PREVIEW
    $('#avatar').on('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                $('#avatarPreview').attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // 🔐 LOGIN USER
    $("#login").on('click', function (e) {
        e.preventDefault();
        const email = $("#email").val().trim();
        const password = $("#password").val().trim();

        if (!email || !password) {
            return Swal.fire({
                icon: "warning",
                text: "Email and password are required.",
                position: 'bottom-right'
            });
        }

        const user = { email, password };

        $.ajax({
            method: "POST",
            url: `http://localhost:4000/api/v1/login`,
            data: JSON.stringify(user),
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                console.log(data);

                Swal.fire({
                    text: data.success,
                    position: 'bottom-right',
                    timer: 1000,
                    showConfirmButton: false,
                    timerProgressBar: true
                });

                // Save token and user data
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('userId', data.user.id);
                sessionStorage.setItem('role', data.user.role);

                // Redirect based on role
                if (data.user.role === 'admin') {
                    window.location.href = '/frontend/AdminHandling/admindashboard.html';
                } else {
                    window.location.href = '/frontend/UserHandling/home.html';
                }
            },
            error: function (error) {
                console.error(error);
                Swal.fire({
                    icon: "error",
                    text: error.responseJSON?.message || "Login failed",
                    position: 'bottom-right',
                    timer: 1500,
                    showConfirmButton: false,
                    timerProgressBar: true
                });
            }
        });
    });

    // 📝 UPDATE PROFILE
    $("#updateBtn").on('click', function (e) {
        e.preventDefault();
        
        if (!$("#profileForm").valid()) {
            return;
        }

        const userId = sessionStorage.getItem('userId');
        if (!userId) {
            return Swal.fire({
                icon: "error",
                text: "User not logged in.",
                position: 'bottom-right'
            });
        }

        const form = $('#profileForm')[0];
        const formData = new FormData(form);
        formData.append('userId', userId);

        $.ajax({
            method: "POST",
            url: `http://localhost:4000/api/v1/profile`,
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            success: function (data) {
                console.log(data);
                Swal.fire({
                    icon: "success",
                    text: "Profile updated!",
                    position: 'bottom-right',
                    timer: 1500,
                    showConfirmButton: false
                });
            },
            error: function (error) {
                console.error(error);
                Swal.fire({
                    icon: "error",
                    text: "Profile update failed.",
                    position: 'bottom-right'
                });
            }
        });
    });
});