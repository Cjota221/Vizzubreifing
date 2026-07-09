document.addEventListener('click', function (e) {
  var link = e.target.closest('a[href*="wa.me"]');
  if (link && typeof fbq === 'function') {
    fbq('track', 'Contact');
  }
});
