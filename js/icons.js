(function () {
    const icons = {
        'fa-th-large': '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
        'fa-th': '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
        'fa-code': '<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/>',
        'fa-calculator': '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h4"/>',
        'fa-plus': '<path d="M12 5v14M5 12h14"/>',
        'fa-link': '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/>',
        'fa-user': '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
        'fa-user-edit': '<circle cx="10" cy="7" r="4"/><path d="M3 21a7 7 0 0 1 10-6.3M15 19l4-4 2 2-4 4h-2v-2Z"/>',
        'fa-user-check': '<circle cx="9" cy="7" r="4"/><path d="M2 21a7 7 0 0 1 12-5M16 19l2 2 4-5"/>',
        'fa-shopping-cart': '<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.5 11h10l2-7H6"/>',
        'fa-receipt': '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
        'fa-whatsapp': '<path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.4-4A8 8 0 1 1 20 11.5Z"/><path d="M9 8.5c.6 2.5 2 4 4.5 5"/>',
        'fa-arrow-left': '<path d="M19 12H5m6 6-6-6 6-6"/>',
        'fa-save': '<path d="M4 4h14l2 2v14H4V4Z"/><path d="M8 4v6h8V4M8 20v-6h8v6"/>',
        'fa-trash': '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
        'fa-cog': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
        'fa-copy': '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
        'fa-terminal': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/>',
        'fa-clipboard-list': '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h4"/>',
        'fa-paperclip': '<path d="m20 12-8.5 8.5a6 6 0 0 1-8.5-8.5l9-9a4 4 0 0 1 5.7 5.7l-9 9a2 2 0 0 1-2.9-2.9l8.5-8.5"/>',
        'fa-check': '<path d="m20 6-11 11-5-5"/>',
        'fa-times': '<path d="m18 6-12 12M6 6l12 12"/>',
        'fa-folder': '<path d="M3 5h6l2 2h10v12H3V5Z"/>',
        'fa-folder-open': '<path d="M3 6h6l2 2h10l-2 11H5L3 6Z"/>',
        'fa-edit': '<path d="M12 20H4v-8L15 1l8 8-11 11Z"/><path d="m13 3 8 8"/>',
        'fa-eye': '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
        'fa-info-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
        'fa-spinner': '<path d="M21 12a9 9 0 1 1-6.2-8.6"/>',
        'fa-clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        'fa-gem': '<path d="m3 9 4-5h10l4 5-9 11L3 9Z"/><path d="M3 9h18M8 4l4 16 4-16"/>',
        'fa-bullseye': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
        'fa-video': '<rect x="3" y="5" width="14" height="14" rx="2"/><path d="m17 10 4-2v8l-4-2"/>',
        'fa-headset': '<path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H5a1 1 0 0 1-1-1v-5ZM20 14h-3v6h2a1 1 0 0 0 1-1v-5Z"/>',
        'fa-rocket': '<path d="M14 5c3-3 6-3 7-3 0 1 0 4-3 7l-5 5-7-7 5-5Z"/><path d="m9 10-4 1-3 3 6 1M14 15l-1 4-3 3-1-6"/><circle cx="16" cy="7" r="1"/>',
        'fa-file-alt': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>'
    };

    function replaceIcon(element) {
        if (!element?.matches?.('i[class*="fa-"]')) return;
        const iconClass = [...element.classList].find((name) => name.startsWith('fa-') && name !== 'fa-spin');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.classList.add('ui-icon');
        if (element.classList.contains('fa-spin')) svg.classList.add('icon-spin');
        svg.innerHTML = icons[iconClass] || '<circle cx="12" cy="12" r="8"/>';
        element.replaceWith(svg);
    }

    function replaceAll(root) {
        if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
        if (root.matches?.('i[class*="fa-"]')) replaceIcon(root);
        root.querySelectorAll?.('i[class*="fa-"]').forEach(replaceIcon);
    }

    document.addEventListener('DOMContentLoaded', () => {
        replaceAll(document);
        new MutationObserver((mutations) => mutations.forEach((mutation) => mutation.addedNodes.forEach(replaceAll)))
            .observe(document.body, { childList: true, subtree: true });
    });
}());
