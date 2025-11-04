// Load header and footer
async function loadHeaderFooter() {
    try {
        // Load header
        const headerResponse = await fetch('header.html');
        const headerHtml = await headerResponse.text();
        document.getElementById('header-placeholder').innerHTML = headerHtml;

        // Load footer
        const footerResponse = await fetch('footer.html');
        const footerHtml = await footerResponse.text();
        document.getElementById('footer-placeholder').innerHTML = footerHtml;

        console.log('Header and footer loaded successfully');
    } catch (error) {
        console.error('Error loading header/footer:', error);
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav) {
        mobileNav.classList.toggle('show');
    }
}

// Shared system page state
const SystemPage = {
    data: null,
    name: null,
    currentIconSection: null,
    currentTextIndex: 0,

    init(systemName, systemData) {
        this.name = systemName;
        this.data = systemData;
    }
};

// Check scroll arrows visibility
function updateScrollArrows() {
    const iconWrapper = document.getElementById('iconMenuWrapper');
    const iconLeftArrow = document.getElementById('iconScrollLeft');
    const iconRightArrow = document.getElementById('iconScrollRight');

    if (iconWrapper) {
        const canScrollLeft = iconWrapper.scrollLeft > 0;
        const canScrollRight = iconWrapper.scrollLeft < (iconWrapper.scrollWidth - iconWrapper.clientWidth - 1);

        iconLeftArrow.classList.toggle('hidden', !canScrollLeft);
        iconRightArrow.classList.toggle('hidden', !canScrollRight);
    }

    const textWrapper = document.getElementById('textMenuWrapper');
    const textLeftArrow = document.getElementById('textScrollLeft');
    const textRightArrow = document.getElementById('textScrollRight');

    if (textWrapper) {
        const canScrollLeft = textWrapper.scrollLeft > 0;
        const canScrollRight = textWrapper.scrollLeft < (textWrapper.scrollWidth - textWrapper.clientWidth - 1);

        textLeftArrow.classList.toggle('hidden', !canScrollLeft);
        textRightArrow.classList.toggle('hidden', !canScrollRight);
    }
}

function scrollIconMenu(direction) {
    const wrapper = document.getElementById('iconMenuWrapper');
    const scrollAmount = 200;

    if (direction === 'left') {
        wrapper.scrollLeft -= scrollAmount;
    } else {
        wrapper.scrollLeft += scrollAmount;
    }

    setTimeout(updateScrollArrows, 300);
}

function scrollTextMenu(direction) {
    const wrapper = document.getElementById('textMenuWrapper');
    const scrollAmount = 150;

    if (direction === 'left') {
        wrapper.scrollLeft -= scrollAmount;
    } else {
        wrapper.scrollLeft += scrollAmount;
    }

    setTimeout(updateScrollArrows, 300);
}

// Build icon menu dynamically from JSON data
function buildIconMenu() {
    const iconMenu = document.getElementById(`${SystemPage.name}IconMenu`);
    const sections = Object.keys(SystemPage.data);

    iconMenu.innerHTML = sections.map((section, index) => {
        const sectionData = SystemPage.data[section];
        return `
            <div class="icon-item ${index === 0 ? 'active' : ''}" onclick="selectIcon(${index})">
                <div class="icon-circle">
                    <i class="bi bi-${sectionData.iconImage}"></i>
                </div>
                <span class="icon-label">${section}</span>
            </div>
        `;
    }).join('');
}

function selectIcon(index) {
    if (!SystemPage.data) return;

    const sections = Object.keys(SystemPage.data);
    SystemPage.currentIconSection = sections[index];
    SystemPage.currentTextIndex = 0;

    const iconItems = document.querySelectorAll(`#${SystemPage.name}IconMenu .icon-item`);
    iconItems.forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });

    const sectionData = SystemPage.data[SystemPage.currentIconSection];
    const newImageUrl = sectionData.largeImage;
    document.getElementById(`${SystemPage.name}MainImage`).src = newImageUrl;

    const textMenu = document.getElementById(`${SystemPage.name}TextMenu`);
    const textMenuItems = sectionData.textMenuItems;
    textMenu.innerHTML = textMenuItems.map((item, i) =>
        `<div class="text-menu-item ${i === 0 ? 'active' : ''}" onclick="selectTextMenu(${i})">${item}</div>`
    ).join('');

    const firstContent = sectionData.content[0];
    document.getElementById(`${SystemPage.name}Content`).innerHTML = `
        <h4>${firstContent.title}</h4>
        <p>${firstContent.text}</p>
    `;

    // Update base image if the function exists (for pages with zoom functionality)
    if (typeof updateBaseImage === 'function') {
        updateBaseImage();
    }

    // Reset zoom if the function exists (for pages with zoom functionality)
    if (typeof resetZoom === 'function') {
        resetZoom();
    }

    setTimeout(updateScrollArrows, 100);
}

function selectTextMenu(index) {
    if (!SystemPage.data) return;

    SystemPage.currentTextIndex = index;

    const textItems = document.querySelectorAll(`#${SystemPage.name}TextMenu .text-menu-item`);
    textItems.forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });

    const content = SystemPage.data[SystemPage.currentIconSection].content[index];
    document.getElementById(`${SystemPage.name}Content`).innerHTML = `
        <h3>${content.title}</h3>
        <p>${content.text}</p>
    `;
}

async function initSystemPage(systemName, loadDataCallback) {
    await loadHeaderFooter();
    await loadDataCallback();

    setTimeout(updateScrollArrows, 100);

    const iconWrapper = document.getElementById('iconMenuWrapper');
    const textWrapper = document.getElementById('textMenuWrapper');

    iconWrapper.addEventListener('scroll', updateScrollArrows);
    textWrapper.addEventListener('scroll', updateScrollArrows);
    window.addEventListener('resize', updateScrollArrows);
}

// Zoom and Pan functionality for system pages
function initImageZoom(systemName) {
    const image = document.getElementById(`${systemName}MainImage`);
    const container = document.getElementById('imageContainer');
    const zoomControls = document.getElementById('zoomControls');

    if (!image || !container || !zoomControls) {
        console.warn('Zoom elements not found for', systemName);
        return;
    }

    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let initialDistance = 0;
    let lastTapTime = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let baseImageSrc = '';
    let currentResolution = '1x';

    // Zoom configuration
    const MAX_ZOOM = 3;
    const MIN_ZOOM = 1;
    const ZOOM_STEP = 0.5;

    // Setup container
    container.style.overflow = 'hidden';
    container.style.touchAction = 'none';

    // Helper function to get the base image path (without resolution suffix)
    function getBaseImageSrc(src) {
        // Remove any existing _2x or _3x suffix before the file extension
        return src.replace(/(_2x|_3x)(\.[^.]+)$/, '$2');
    }

    // Helper function to get the appropriate image source based on zoom level
    function getImageSrcForZoom(scale) {
        const base = baseImageSrc || getBaseImageSrc(image.src);

        // Determine which resolution to use
        if (scale >= 2.5) {
            // Use 3x image for 2.5x - 3x zoom
            return base.replace(/(\.[^.]+)$/, '_3x$1');
        } else if (scale >= 1.5) {
            // Use 2x image for 1.5x - 2x zoom
            return base.replace(/(\.[^.]+)$/, '_2x$1');
        } else {
            // Use original image for 1x - 1.4x zoom
            return base;
        }
    }

    // Function to update image source based on zoom level
    function updateImageResolution() {
        if (!baseImageSrc) {
            baseImageSrc = getBaseImageSrc(image.src);
        }

        const newResolution = scale >= 2.5 ? '3x' : scale >= 1.5 ? '2x' : '1x';

        if (newResolution !== currentResolution) {
            const newSrc = getImageSrcForZoom(scale);

            // Only update if the new source is different
            if (newSrc !== image.src) {
                image.src = newSrc;
                currentResolution = newResolution;
                console.log(`Switched to ${currentResolution} resolution at ${scale}x zoom`);
            }
        }
    }

    // Initialize base image source
    baseImageSrc = getBaseImageSrc(image.src);

    // Touch events for mobile
    if ('ontouchstart' in window) {
        image.addEventListener('touchstart', handleTouchStart, { passive: false });
        image.addEventListener('touchmove', handleTouchMove, { passive: false });
        image.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    // Mouse events for desktop
    image.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Mouse wheel for zoom
    image.addEventListener('wheel', handleWheel, { passive: false });

    // Initialize zoom controls
    updateZoomButtons();

    function handleTouchStart(e) {
        if (e.touches.length === 2) {
            // Two fingers - pinch to zoom
            e.preventDefault();
            initialDistance = getDistance(e.touches[0], e.touches[1]);
        } else if (e.touches.length === 1) {
            // Single finger
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTapTime;

            // Double tap detection
            if (tapLength < 300 && tapLength > 0) {
                e.preventDefault();
                if (scale === MIN_ZOOM) {
                    // Zoom in to 2x at tap position
                    const rect = image.getBoundingClientRect();
                    const x = e.touches[0].clientX - rect.left;
                    const y = e.touches[0].clientY - rect.top;
                    zoomToPoint(2, x, y);
                } else {
                    // Reset zoom
                    resetZoomInternal();
                }
            } else if (scale > MIN_ZOOM) {
                // Start dragging if zoomed
                isDragging = true;
                startX = e.touches[0].clientX - translateX;
                startY = e.touches[0].clientY - translateY;
            }

            lastTapTime = currentTime;
        }
    }

    function handleTouchMove(e) {
        if (e.touches.length === 2) {
            // Pinch to zoom
            e.preventDefault();
            const currentDistance = getDistance(e.touches[0], e.touches[1]);
            const newScale = scale * (currentDistance / initialDistance);

            // Limit scale between MIN_ZOOM and MAX_ZOOM
            if (newScale >= MIN_ZOOM && newScale <= MAX_ZOOM) {
                scale = newScale;
                updateTransform();
                updateZoomButtons();
                updateImageResolution();
            }

            initialDistance = currentDistance;
        } else if (e.touches.length === 1 && isDragging && scale > MIN_ZOOM) {
            // Pan when zoomed
            e.preventDefault();
            translateX = e.touches[0].clientX - startX;
            translateY = e.touches[0].clientY - startY;

            // Keep image within bounds
            constrainTranslation();
            updateTransform();
        }
    }

    function handleTouchEnd(e) {
        if (e.touches.length === 0) {
            isDragging = false;

            // If zoomed out completely, reset
            if (scale < MIN_ZOOM + 0.1) {
                resetZoomInternal();
            }
        }
    }

    function getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Mouse event handlers for desktop
    function handleMouseDown(e) {
        if (scale > MIN_ZOOM) {
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            image.style.cursor = 'grabbing';
            e.preventDefault();
        }
    }

    function handleMouseMove(e) {
        if (isDragging && scale > MIN_ZOOM) {
            e.preventDefault();
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            constrainTranslation();
            updateTransform();
        }
    }

    function handleMouseUp(e) {
        if (isDragging) {
            isDragging = false;
            if (scale > MIN_ZOOM) {
                image.style.cursor = 'grab';
            } else {
                image.style.cursor = 'default';
            }
        }
    }

    function handleWheel(e) {
        e.preventDefault();

        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        const newScale = Math.min(Math.max(scale + delta, MIN_ZOOM), MAX_ZOOM);

        if (newScale !== scale) {
            // Zoom from the center - scale the current translation proportionally
            const scaleRatio = newScale / scale;

            translateX = translateX * scaleRatio;
            translateY = translateY * scaleRatio;

            scale = newScale;

            if (scale === MIN_ZOOM) {
                translateX = 0;
                translateY = 0;
                image.style.cursor = 'default';
            } else {
                constrainTranslation();
                image.style.cursor = 'grab';
            }

            updateTransform();
            updateZoomButtons();
            updateImageResolution();
        }
    }

    function zoomToPoint(newScale, x, y) {
        const rect = image.getBoundingClientRect();
        const percentX = x / rect.width;
        const percentY = y / rect.height;

        scale = newScale;
        translateX = (rect.width / 2 - x) * scale;
        translateY = (rect.height / 2 - y) * scale;

        constrainTranslation();
        updateTransform();
        updateZoomButtons();
        updateImageResolution();
    }

    function constrainTranslation() {
        const rect = container.getBoundingClientRect();
        const imgWidth = rect.width * scale;
        const imgHeight = rect.height * scale;

        const maxX = (imgWidth - rect.width) / 2;
        const maxY = (imgHeight - rect.height) / 2;

        translateX = Math.min(maxX, Math.max(-maxX, translateX));
        translateY = Math.min(maxY, Math.max(-maxY, translateY));
    }

    function updateTransform() {
        image.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        image.style.transition = 'none';
    }

    function updateZoomButtons() {
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');

        if (!zoomInBtn || !zoomOutBtn) return;

        // Disable zoom in button if at max zoom
        if (scale >= MAX_ZOOM) {
            zoomInBtn.disabled = true;
            zoomInBtn.style.opacity = '0.5';
        } else {
            zoomInBtn.disabled = false;
            zoomInBtn.style.opacity = '1';
        }

        // Disable zoom out button if at min zoom
        if (scale <= MIN_ZOOM) {
            zoomOutBtn.disabled = true;
            zoomOutBtn.style.opacity = '0.5';
        } else {
            zoomOutBtn.disabled = false;
            zoomOutBtn.style.opacity = '1';
        }
    }

    function resetZoomInternal() {
        scale = MIN_ZOOM;
        translateX = 0;
        translateY = 0;
        image.style.cursor = 'default';
        image.style.transition = 'transform 0.3s ease';
        updateTransform();
        setTimeout(() => {
            image.style.transition = 'none';
        }, 300);
        updateZoomButtons();
        updateImageResolution();
    }

    // Global functions for button clicks
    window.zoomIn = function() {
        const newScale = Math.min(scale + ZOOM_STEP, MAX_ZOOM);
        if (newScale !== scale) {
            scale = newScale;
            constrainTranslation();
            image.style.transition = 'transform 0.3s ease';
            updateTransform();
            setTimeout(() => {
                image.style.transition = 'none';
            }, 300);
            image.style.cursor = scale > MIN_ZOOM ? 'grab' : 'default';
            updateZoomButtons();
            updateImageResolution();
        }
    };

    window.zoomOut = function() {
        const newScale = Math.max(scale - ZOOM_STEP, MIN_ZOOM);
        if (newScale !== scale) {
            scale = newScale;
            if (scale === MIN_ZOOM) {
                translateX = 0;
                translateY = 0;
                image.style.cursor = 'default';
            } else {
                constrainTranslation();
                image.style.cursor = 'grab';
            }
            image.style.transition = 'transform 0.3s ease';
            updateTransform();
            setTimeout(() => {
                image.style.transition = 'none';
            }, 300);
            updateZoomButtons();
            updateImageResolution();
        }
    };

    window.resetZoom = function() {
        resetZoomInternal();
    };

    // Function to update base image when image source changes externally
    window.updateBaseImage = function() {
        baseImageSrc = getBaseImageSrc(image.src);
        currentResolution = '1x';
        console.log('Base image updated to:', baseImageSrc);
    };
}

// Function to check if current image is blank
function isBlankImage(systemName) {
    const image = document.getElementById(`${systemName}MainImage`);
    if (!image) return false;

    return image.src.includes('blank.png') ||
           image.src.includes('blank_2x.png') ||
           image.src.includes('blank_3x.png');
}

// Function to check if image is blank and toggle zoom controls
function updateZoomControlsVisibility(systemName) {
    const image = document.getElementById(`${systemName}MainImage`);
    const zoomControls = document.getElementById('zoomControls');

    if (image && zoomControls) {
        if (isBlankImage(systemName)) {
            zoomControls.style.display = 'none';
        } else {
            zoomControls.style.display = 'flex';
        }
    }
}

// Prevent wheel zoom on blank images
function createWheelEventHandler(systemName) {
    return function(e) {
        if (isBlankImage(systemName)) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    };
}

// Setup blank image detection for a system page
function setupBlankImageDetection(systemName) {
    // Override selectIcon to add zoom controls visibility check
    const originalSelectIcon = window.selectIcon;
    window.selectIcon = function(index) {
        originalSelectIcon(index);
        // Check after image is updated
        setTimeout(() => updateZoomControlsVisibility(systemName), 50);
    };

    // Add wheel event listener to prevent zoom on blank images
    const image = document.getElementById(`${systemName}MainImage`);
    if (image) {
        image.addEventListener('wheel', createWheelEventHandler(systemName), { capture: true, passive: false });
    }

    // Initial check for zoom controls visibility
    setTimeout(() => updateZoomControlsVisibility(systemName), 100);
}