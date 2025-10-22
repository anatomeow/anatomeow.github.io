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
        <h3>${firstContent.title}</h3>
        <p>${firstContent.text}</p>
    `;

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