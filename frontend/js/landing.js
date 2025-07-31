

$(document).ready(function () {
    // Landing page state variables
    let featuredProducts = [];
    let categoryProducts = new Map();
    let usageTypeProducts = new Map();
    let currentHeroSlide = 0;
    let heroSliderInterval;
    let imageSliders = new Map();
    let isLoading = false;

    // Initialize landing page
    initializeLandingPage();

    function initializeLandingPage() {
        createHeroSection();
        loadFeaturedProducts();
        createAboutUsSection();
        createContactSection();
        initializeScrollAnimations();
        initializeParallaxEffects();
        setupSmoothScrolling();
    }

    // Create dynamic hero section with animated content
    function createHeroSection() {
        const heroContent = `
            <div class="hero-section" id="heroSection">
                <div class="hero-slider">
                    <div class="hero-slide active">
                        <div class="hero-background" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <div class="floating-shapes">
                                <div class="shape shape-1"></div>
                                <div class="shape shape-2"></div>
                                <div class="shape shape-3"></div>
                            </div>
                        </div>
                        <div class="hero-content">
                            <h1 class="hero-title animate-fade-up">Welcome to Our Store</h1>
                            <p class="hero-subtitle animate-fade-up delay-1">Discover Amazing Products at Unbeatable Prices</p>
                            <button class="hero-cta animate-fade-up delay-2" onclick="scrollToSection('featured')">
                                Explore Products
                            </button>
                        </div>
                    </div>
                    <div class="hero-slide">
                        <div class="hero-background" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                            <div class="floating-shapes">
                                <div class="shape shape-4"></div>
                                <div class="shape shape-5"></div>
                                <div class="shape shape-6"></div>
                            </div>
                        </div>
                        <div class="hero-content">
                            <h1 class="hero-title animate-fade-up">Quality You Can Trust</h1>
                            <p class="hero-subtitle animate-fade-up delay-1">Premium Products for Every Need</p>
                            <button class="hero-cta animate-fade-up delay-2" onclick="scrollToSection('about')">
                                Learn About Us
                            </button>
                        </div>
                    </div>
                    <div class="hero-slide">
                        <div class="hero-background" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                            <div class="floating-shapes">
                                <div class="shape shape-7"></div>
                                <div class="shape shape-8"></div>
                                <div class="shape shape-9"></div>
                            </div>
                        </div>
                        <div class="hero-content">
                            <h1 class="hero-title animate-fade-up">Join Our Community</h1>
                            <p class="hero-subtitle animate-fade-up delay-1">Start Shopping Today</p>
                            <button class="hero-cta animate-fade-up delay-2" onclick="redirectToRegister()">
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
                <div class="hero-navigation">
                    <button class="hero-nav-btn" onclick="previousHeroSlide()">‹</button>
                    <button class="hero-nav-btn" onclick="nextHeroSlide()">›</button>
                </div>
                <div class="hero-indicators">
                    <span class="indicator active" onclick="goToHeroSlide(0)"></span>
                    <span class="indicator" onclick="goToHeroSlide(1)"></span>
                    <span class="indicator" onclick="goToHeroSlide(2)"></span>
                </div>
            </div>
        `;
        
        $('body').prepend(heroContent);
        startHeroSlider();
    }

    // Hero slider functionality
    function startHeroSlider() {
        heroSliderInterval = setInterval(() => {
            nextHeroSlide();
        }, 5000);
    }

    function nextHeroSlide() {
        const slides = $('.hero-slide');
        const indicators = $('.indicator');
        
        slides.eq(currentHeroSlide).removeClass('active');
        indicators.eq(currentHeroSlide).removeClass('active');
        
        currentHeroSlide = (currentHeroSlide + 1) % slides.length;
        
        slides.eq(currentHeroSlide).addClass('active');
        indicators.eq(currentHeroSlide).addClass('active');
    }

    function previousHeroSlide() {
        const slides = $('.hero-slide');
        const indicators = $('.indicator');
        
        slides.eq(currentHeroSlide).removeClass('active');
        indicators.eq(currentHeroSlide).removeClass('active');
        
        currentHeroSlide = currentHeroSlide === 0 ? slides.length - 1 : currentHeroSlide - 1;
        
        slides.eq(currentHeroSlide).addClass('active');
        indicators.eq(currentHeroSlide).addClass('active');
    }

    function goToHeroSlide(index) {
        const slides = $('.hero-slide');
        const indicators = $('.indicator');
        
        slides.eq(currentHeroSlide).removeClass('active');
        indicators.eq(currentHeroSlide).removeClass('active');
        
        currentHeroSlide = index;
        
        slides.eq(currentHeroSlide).addClass('active');
        indicators.eq(currentHeroSlide).addClass('active');
        
        // Reset auto-slider
        clearInterval(heroSliderInterval);
        startHeroSlider();
    }

    // Load featured products
    function loadFeaturedProducts() {
        showSectionLoader('featured');
        
        $.ajax({
            url: 'http://localhost:4000/api/v1/featured',
            method: 'GET',
            success: data => {
                featuredProducts = data.featuredProducts || [];
                renderFeaturedSection();
                hideSectionLoader('featured');
            },
            error: () => {
                showErrorMessage('featured', 'Failed to load featured products');
                hideSectionLoader('featured');
            }
        });
    }

    // Create About Us section
    function createAboutUsSection() {
        const aboutHtml = `
            <section class="about-section animate-on-scroll" id="about">
                <div class="container">
                    <div class="section-header">
                        <h2 class="section-title">🌟 About Us</h2>
                        <p class="section-subtitle">Learn more about our story and mission</p>
                    </div>
                    <div class="about-content">
                        <div class="about-text">
                            <h3>Our Story</h3>
                            <p>Founded in 2020, Petal Paradise began as a small family business with a passion for bringing beauty and quality products to our customers. What started as a dream to create something meaningful has grown into a trusted destination for premium products.</p>
                            
                            <h3>Our Mission</h3>
                            <p>We believe that everyone deserves access to high-quality products that enhance their daily lives. Our mission is to curate and provide exceptional products while maintaining the highest standards of customer service and satisfaction.</p>
                            
                            <h3>Why Choose Us?</h3>
                            <div class="features-grid">
                                <div class="feature-item">
                                    <div class="feature-icon">✨</div>
                                    <h4>Premium Quality</h4>
                                    <p>Every product is carefully selected and tested to meet our strict quality standards.</p>
                                </div>
                                <div class="feature-item">
                                    <div class="feature-icon">🚚</div>
                                    <h4>Fast Delivery</h4>
                                    <p>Quick and reliable shipping to get your products to you as soon as possible.</p>
                                </div>
                                <div class="feature-item">
                                    <div class="feature-icon">🛡️</div>
                                    <h4>Secure Shopping</h4>
                                    <p>Your privacy and security are our top priorities with encrypted transactions.</p>
                                </div>
                                <div class="feature-item">
                                    <div class="feature-icon">💝</div>
                                    <h4>Customer Care</h4>
                                    <p>Dedicated support team ready to help you with any questions or concerns.</p>
                                </div>
                            </div>
                        </div>
                        <div class="about-stats">
                            <div class="stat-item">
                                <div class="stat-number">10,000+</div>
                                <div class="stat-label">Happy Customers</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">500+</div>
                                <div class="stat-label">Products</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">99%</div>
                                <div class="stat-label">Satisfaction Rate</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">24/7</div>
                                <div class="stat-label">Support</div>
                            </div>
                        </div>
                    </div>
                    <div class="section-cta">
                        <button class="btn-primary" onclick="redirectToRegister()">
                            Join Our Community
                        </button>
                    </div>
                </div>
            </section>
        `;

        $('#aboutContainer').html(aboutHtml);
    }

    // Create Contact section
    function createContactSection() {
        const contactHtml = `
            <section class="contact-section animate-on-scroll" id="contact">
                <div class="container">
                    <div class="section-header">
                        <h2 class="section-title">📧 Contact Us</h2>
                        <p class="section-subtitle">We'd love to hear from you</p>
                    </div>
                    <div class="contact-content">
                        <div class="contact-info">
                            <h3>Get in Touch</h3>
                            <p>Have questions, suggestions, or need assistance? Don't hesitate to reach out to us. We're here to help!</p>
                            
                            <div class="contact-details">
                                <div class="contact-item">
                                    <div class="contact-icon">📍</div>
                                    <div class="contact-text">
                                        <h4>Address</h4>
                                        <p>123 Paradise Street<br>Flower District, Metro Manila 1234<br>Philippines</p>
                                    </div>
                                </div>
                                <div class="contact-item">
                                    <div class="contact-icon">📞</div>
                                    <div class="contact-text">
                                        <h4>Phone</h4>
                                        <p>+63 (2) 123-4567<br>+63 917-123-4567</p>
                                    </div>
                                </div>
                                <div class="contact-item">
                                    <div class="contact-icon">✉️</div>
                                    <div class="contact-text">
                                        <h4>Email</h4>
                                        <p>info@petalparadise.com<br>support@petalparadise.com</p>
                                    </div>
                                </div>
                                <div class="contact-item">
                                    <div class="contact-icon">🕒</div>
                                    <div class="contact-text">
                                        <h4>Business Hours</h4>
                                        <p>Monday - Friday: 9:00 AM - 6:00 PM<br>Saturday: 9:00 AM - 4:00 PM<br>Sunday: Closed</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="contact-form-container">
                            <form class="contact-form" id="contactForm">
                                <h3>Send us a Message</h3>
                                <div class="form-group">
                                    <label for="name">Full Name</label>
                                    <input type="text" id="name" name="name" required>
                                </div>
                                <div class="form-group">
                                    <label for="email">Email Address</label>
                                    <input type="email" id="email" name="email" required>
                                </div>
                                <div class="form-group">
                                    <label for="phone">Phone Number</label>
                                    <input type="tel" id="phone" name="phone">
                                </div>
                                <div class="form-group">
                                    <label for="subject">Subject</label>
                                    <select id="subject" name="subject" required>
                                        <option value="">Select a subject</option>
                                        <option value="general">General Inquiry</option>
                                        <option value="support">Customer Support</option>
                                        <option value="partnership">Partnership</option>
                                        <option value="feedback">Feedback</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="message">Message</label>
                                    <textarea id="message" name="message" rows="5" required placeholder="Please describe your inquiry in detail..."></textarea>
                                </div>
                                <div class="form-group checkbox-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="newsletter" name="newsletter">
                                        <span class="checkmark"></span>
                                        Subscribe to our newsletter for updates and special offers
                                    </label>
                                </div>
                                <button type="submit" class="btn-primary">Send Message</button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        `;

        $('#contactContainer').html(contactHtml);
        
        // Handle contact form submission
        $('#contactForm').on('submit', function(e) {
            e.preventDefault();
            handleContactFormSubmission();
        });
    }

    // Handle contact form submission
    function handleContactFormSubmission() {
        const form = $('#contactForm');
        const submitBtn = form.find('button[type="submit"]');
        
        // Show loading state
        submitBtn.text('Sending...').prop('disabled', true);
        
        // Simulate form submission (replace with actual API call)
        setTimeout(() => {
            // Show success message
            showContactSuccessMessage();
            
            // Reset form
            form[0].reset();
            
            // Reset button
            submitBtn.text('Send Message').prop('disabled', false);
        }, 2000);
    }

    function showContactSuccessMessage() {
        const successMessage = `
            <div class="success-message" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(45deg, #4caf50, #45a049);
                color: white;
                padding: 30px 40px;
                border-radius: 15px;
                text-align: center;
                z-index: 2000;
                box-shadow: 0 10px 30px rgba(76, 175, 80, 0.3);
            ">
                <div style="font-size: 3rem; margin-bottom: 15px;">✅</div>
                <h3 style="margin-bottom: 10px;">Message Sent Successfully!</h3>
                <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
                <button onclick="closeSuccessMessage()" style="
                    background: white;
                    color: #4caf50;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 25px;
                    margin-top: 15px;
                    cursor: pointer;
                    font-weight: 600;
                ">Close</button>
            </div>
            <div class="success-overlay" onclick="closeSuccessMessage()" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1999;
            "></div>
        `;
        
        $('body').append(successMessage);
    }

    // Render featured products section
    function renderFeaturedSection() {
        if (featuredProducts.length === 0) return;

        const sectionHtml = `
            <section class="featured-section animate-on-scroll" id="featured">
                <div class="container">
                    <div class="section-header">
                        <h2 class="section-title">✨ Featured Products</h2>
                        <p class="section-subtitle">Handpicked just for you</p>
                    </div>
                    <div class="products-grid featured-grid">
                        ${renderProductCards(featuredProducts, 'featured')}
                    </div>
                    <div class="section-cta">
                        <button class="btn-primary" onclick="redirectToLogin()">
                            View All Products
                        </button>
                    </div>
                </div>
            </section>
        `;

        $('#featuredContainer').html(sectionHtml);
        initializeProductSliders(featuredProducts);
    }

    // Render product cards
    function renderProductCards(products, section) {
        return products.map(product => {
            const images = product.image ? product.image.split(',').map(img => img.trim()) : [];
            const stock = parseInt(product.stock) || 0;
            const isOutOfStock = stock === 0;
            const color = product.color || 'Not specified';

            // Create image slider HTML
            let imageSliderHtml = '';
            if (images.length > 0) {
                imageSliderHtml = `
                    <div class="product-image-container" data-product-id="${product.id}">
                        <div class="product-image-slider">
                            ${images.map((img, index) => `
                                <img src="/frontend/images/${img}" 
                                     alt="${product.name}" 
                                     class="product-image ${index === 0 ? 'active' : ''}"
                                     onerror="this.style.display='none'">
                            `).join('')}
                        </div>
                        ${images.length > 1 ? `
                            <div class="image-controls">
                                <button class="image-nav prev" onclick="previousProductImage(${product.id})">‹</button>
                                <button class="image-nav next" onclick="nextProductImage(${product.id})">›</button>
                            </div>
                            <div class="image-dots">
                                ${images.map((_, index) => `
                                    <span class="image-dot ${index === 0 ? 'active' : ''}" 
                                          onclick="goToProductImage(${product.id}, ${index})"></span>
                                `).join('')}
                            </div>
                        ` : ''}
                        ${isOutOfStock ? '<div class="out-of-stock-overlay">Out of Stock</div>' : ''}
                    </div>
                `;
            } else {
                imageSliderHtml = `
                    <div class="product-image-container no-image">
                        <div class="no-image-placeholder">
                            <span>📦</span>
                            <p>No Image</p>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="product-card landing-card ${isOutOfStock ? 'out-of-stock' : ''}" 
                     data-product-id="${product.id}">
                    ${imageSliderHtml}
                    <div class="product-info">
                        <h4 class="product-name">${product.name}</h4>
                        <p class="product-color">${color}</p>
                        <div class="product-meta">
                            <span class="product-category">${product.category}</span>
                            <span class="product-usage">${product.usage_type}</span>
                        </div>
                        <div class="product-price">₱${parseFloat(product.price).toFixed(2)}</div>
                        <div class="product-stock">
                            ${stock > 0 ? `${stock} in stock` : 'Out of stock'}
                        </div>
                        <div class="product-actions">
                            ${isOutOfStock ? 
                                '<button class="btn-disabled" disabled>Out of Stock</button>' : 
                                '<button class="btn-primary" onclick="redirectToRegister()">Shop Now</button>'
                            }
                            <button class="btn-secondary" onclick="viewProductDetails(${product.id})">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Initialize product image sliders
    function initializeProductSliders(products) {
        products.forEach(product => {
            if (product.image) {
                const images = product.image.split(',').map(img => img.trim());
                if (images.length > 1) {
                    initializeProductImageSlider(product.id, images.length);
                }
            }
        });
    }

    function initializeProductImageSlider(productId, imageCount) {
        if (imageCount <= 1) return;
        
        // Clear existing interval if any
        if (imageSliders.has(productId)) {
            clearInterval(imageSliders.get(productId));
        }
        
        let currentSlide = 0;
        
        // Auto-slide every 4 seconds
        const interval = setInterval(() => {
            currentSlide = (currentSlide + 1) % imageCount;
            showProductImage(productId, currentSlide);
        }, 4000);
        
        imageSliders.set(productId, interval);
    }

    function showProductImage(productId, slideIndex) {
        const container = $(`.product-image-container[data-product-id="${productId}"]`);
        const images = container.find('.product-image');
        const dots = container.find('.image-dot');
        
        // Hide all images and remove active class
        images.removeClass('active');
        dots.removeClass('active');
        
        // Show current image and activate corresponding dot
        images.eq(slideIndex).addClass('active');
        dots.eq(slideIndex).addClass('active');
    }

    // View product details modal
    function viewProductDetails(productId) {
        showDetailLoader();
        
        $.ajax({
            url: 'http://localhost:4000/api/v1/product/${productId}',
            method: 'GET',
            success: data => {
                if (data.product) {
                    showProductModal(data.product);
                }
                hideDetailLoader();
            },
            error: () => {
                alert('Failed to load product details');
                hideDetailLoader();
            }
        });
    }

    function showProductModal(product) {
        const images = product.image ? product.image.split(',').map(img => img.trim()) : [];
        const stock = parseInt(product.stock) || 0;
        const isOutOfStock = stock === 0;

        const modalHtml = `
            <div class="product-modal-overlay" onclick="closeProductModal()">
                <div class="product-modal" onclick="event.stopPropagation()">
                    <button class="modal-close" onclick="closeProductModal()">×</button>
                    <div class="modal-content">
                        <div class="modal-images">
                            ${images.length > 0 ? `
                                <div class="modal-image-slider" data-product-id="modal-${product.id}">
                                    ${images.map((img, index) => `
                                        <img src="/frontend/images/${img}" 
                                             alt="${product.name}" 
                                             class="modal-image ${index === 0 ? 'active' : ''}"
                                             onerror="this.style.display='none'">
                                    `).join('')}
                                </div>
                                ${images.length > 1 ? `
                                    <div class="modal-image-controls">
                                        <button onclick="previousModalImage()">‹</button>
                                        <button onclick="nextModalImage()">›</button>
                                    </div>
                                ` : ''}
                            ` : `
                                <div class="modal-no-image">
                                    <span>📦</span>
                                    <p>No Image Available</p>
                                </div>
                            `}
                        </div>
                        <div class="modal-info">
                            <h2 class="modal-title">${product.name}</h2>
                            <div class="modal-meta">
                                <p><strong>Category:</strong> ${product.category}</p>
                                <p><strong>Usage Type:</strong> ${product.usage_type}</p>
                                <p><strong>Color:</strong> ${product.color || 'Not specified'}</p>
                                <p><strong>Stock:</strong> ${stock} available</p>
                            </div>
                            <div class="modal-price">₱${parseFloat(product.price).toFixed(2)}</div>
                            <div class="modal-description">
                                <h4>Description</h4>
                                <p>${product.description || 'No description available'}</p>
                            </div>
                            <div class="modal-actions">
                                ${isOutOfStock ? 
                                    '<button class="btn-disabled" disabled>Out of Stock</button>' : 
                                    '<button class="btn-primary" onclick="redirectToRegister()">Shop This Item</button>'
                                }
                                <button class="btn-secondary" onclick="redirectToRegister()">Join to Shop</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('body').append(modalHtml);
        $('body').addClass('modal-open');
    }

    function closeProductModal() {
        $('.product-modal-overlay').remove();
        $('body').removeClass('modal-open');
    }

    // Scroll animations
    function initializeScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements as they're added to the DOM
        const observeNewElements = () => {
            document.querySelectorAll('.animate-on-scroll:not(.observed)').forEach(el => {
                observer.observe(el);
                el.classList.add('observed');
            });
        };

        // Initial observation
        setTimeout(observeNewElements, 100);
        
        // Re-observe when new content is added
        const mutationObserver = new MutationObserver(observeNewElements);
        mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    // Parallax effects
    function initializeParallaxEffects() {
        $(window).on('scroll', throttle(() => {
            const scrolled = $(window).scrollTop();
            const rate = scrolled * -0.5;
            
            $('.floating-shapes').css('transform', `translateY(${rate}px)`);
        }, 16));
    }

    // Smooth scrolling
    function setupSmoothScrolling() {
        $('a[href^="#"]').on('click', function(e) {
            e.preventDefault();
            const target = $(this.getAttribute('href'));
            if (target.length) {
                $('html, body').animate({
                    scrollTop: target.offset().top - 80
                }, 800);
            }
        });
    }

    // Utility functions
    function scrollToSection(sectionId) {
        const target = $(`#${sectionId}`);
        if (target.length) {
            $('html, body').animate({
                scrollTop: target.offset().top - 80
            }, 800);
        }
    }

    function redirectToLogin() {
        window.location.href = "/frontend/Userhandling/login.html";
    }

    function redirectToRegister() {
        window.location.href = "/frontend/Userhandling/register.html";
    }

    function showSectionLoader(section) {
        $(`#${section}Container`).html(`
            <div class="section-loader">
                <div class="loader-spinner"></div>
                <p>Loading amazing products...</p>
            </div>
        `);
    }

    function hideSectionLoader(section) {
        // Loader will be replaced by content
    }

    function showDetailLoader() {
        $('body').append(`
            <div class="detail-loader-overlay">
                <div class="detail-loader">
                    <div class="loader-spinner"></div>
                    <p>Loading product details...</p>
                </div>
            </div>
        `);
    }

    function hideDetailLoader() {
        $('.detail-loader-overlay').remove();
    }

    function showErrorMessage(section, message) {
        $(`#${section}Container`).html(`
            <div class="error-message">
                <h3>Oops! Something went wrong</h3>
                <p>${message}</p>
                <button class="btn-primary" onclick="location.reload()">Try Again</button>
            </div>
        `);
    }

    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // Global functions for HTML interaction
    window.nextHeroSlide = nextHeroSlide;
    window.previousHeroSlide = previousHeroSlide;
    window.goToHeroSlide = goToHeroSlide;
    window.viewProductDetails = viewProductDetails;
    window.closeProductModal = closeProductModal;
    window.redirectToLogin = redirectToLogin;
    window.redirectToRegister = redirectToRegister;
    window.scrollToSection = scrollToSection;
    
    window.nextProductImage = function(productId) {
        const container = $(`.product-image-container[data-product-id="${productId}"]`);
        const images = container.find('.product-image');
        const currentActive = container.find('.product-image.active').index();
        const nextIndex = (currentActive + 1) % images.length;
        showProductImage(productId, nextIndex);
        resetProductSliderInterval(productId, images.length);
    };
    
    window.previousProductImage = function(productId) {
        const container = $(`.product-image-container[data-product-id="${productId}"]`);
        const images = container.find('.product-image');
        const currentActive = container.find('.product-image.active').index();
        const prevIndex = currentActive === 0 ? images.length - 1 : currentActive - 1;
        showProductImage(productId, prevIndex);
        resetProductSliderInterval(productId, images.length);
    };
    
    window.goToProductImage = function(productId, slideIndex) {
        showProductImage(productId, slideIndex);
        resetProductSliderInterval(productId, $(`.product-image-container[data-product-id="${productId}"] .product-image`).length);
    };

    function resetProductSliderInterval(productId, imageCount) {
        if (imageSliders.has(productId)) {
            clearInterval(imageSliders.get(productId));
        }
        initializeProductImageSlider(productId, imageCount);
    }

    // Navigation menu update function (if you have Categories and Usage Types in nav)
    function updateNavigationMenu() {
        // Replace Categories and Usage Types with About Us and Contact
        const navigationItems = $('.nav-item, .menu-item');
        
        navigationItems.each(function() {
            const $item = $(this);
            const text = $item.text().trim().toLowerCase();
            
            if (text.includes('categories') || text.includes('category')) {
                $item.html('<a href="#about" onclick="scrollToSection(\'about\')">About Us</a>');
            } else if (text.includes('usage') || text.includes('usage types')) {
                $item.html('<a href="#contact" onclick="scrollToSection(\'contact\')">Contact</a>');
            }
        });
    }

    // Call navigation update after DOM is ready
    setTimeout(updateNavigationMenu, 500);

    // Cleanup on page unload
    $(window).on('beforeunload', function() {
        clearInterval(heroSliderInterval);
        imageSliders.forEach(interval => clearInterval(interval));
        imageSliders.clear();
    });

    // Additional helper functions for smooth user experience
    function addLoadingAnimation() {
        // Add subtle loading animations to buttons
        $(document).on('click', '.btn-primary, .btn-secondary', function() {
            const $btn = $(this);
            if (!$btn.prop('disabled')) {
                $btn.addClass('loading');
                setTimeout(() => $btn.removeClass('loading'), 1000);
            }
        });
    }

    function initializeFormValidation() {
        // Enhanced form validation for contact form
        $('#contactForm input, #contactForm textarea, #contactForm select').on('blur', function() {
            validateField($(this));
        });
    }

    function validateField($field) {
        const value = $field.val().trim();
        const fieldType = $field.attr('type') || $field.prop('tagName').toLowerCase();
        let isValid = true;
        let errorMessage = '';

        // Remove existing error styling
        $field.removeClass('error');
        $field.next('.error-message').remove();

        // Required field validation
        if ($field.prop('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        
        // Email validation
        else if (fieldType === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }
        
        // Phone validation
        else if (fieldType === 'tel' && value) {
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }

        if (!isValid) {
            $field.addClass('error');
            $field.after(`<span class="error-message">${errorMessage}</span>`);
        }

        return isValid;
    }

    // Initialize additional features
    addLoadingAnimation();
    initializeFormValidation();

    // Add smooth hover effects for product cards
    $(document).on('mouseenter', '.product-card', function() {
        $(this).addClass('hover-effect');
    }).on('mouseleave', '.product-card', function() {
        $(this).removeClass('hover-effect');
    });

    // Add keyboard navigation for modals
    $(document).on('keydown', function(e) {
        if ($('.product-modal-overlay').length > 0) {
            if (e.key === 'Escape') {
                closeProductModal();
            } else if (e.key === 'ArrowLeft') {
                previousModalImage();
            } else if (e.key === 'ArrowRight') {
                nextModalImage();
            }
        }
    });

    // Scroll-triggered animations for stats
    function animateStats() {
        $('.stat-number').each(function() {
            const $stat = $(this);
            const targetNumber = $stat.text();
            
            if (!$stat.hasClass('animated')) {
                $stat.addClass('animated');
                $stat.text('0');
                
                const increment = targetNumber / 50;
                let current = 0;
                
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= targetNumber) {
                        $stat.text(targetNumber);
                        clearInterval(timer);
                    } else {
                        $stat.text(Math.floor(current));
                    }
                }, 30);
            }
        });
    }

    // Trigger stats animation when about section comes into view
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
            }
        });
    }, { threshold: 0.5 });

    // Observe stats section when it's created
    setTimeout(() => {
        const aboutSection = document.querySelector('#about');
        if (aboutSection) {
            statsObserver.observe(aboutSection);
        }
    }, 1000);

});