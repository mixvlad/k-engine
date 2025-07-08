(() => {
  function wrapWithLoader(pictureOrImg) {
    // Skip if already wrapped or already loaded
    const img = pictureOrImg.tagName === 'PICTURE' ? pictureOrImg.querySelector('img') : pictureOrImg;
    if (!img) return;
    if (pictureOrImg.parentElement && pictureOrImg.parentElement.classList.contains('img-wrapper')) return;

    // Create wrapper
    const wrapper = document.createElement('span');
    wrapper.className = 'img-wrapper';
    pictureOrImg.parentNode.insertBefore(wrapper, pictureOrImg);
    wrapper.appendChild(pictureOrImg);

    // Hide image until loaded
    img.style.visibility = 'hidden';
    img.style.opacity = '0';

    // Create loader overlay
    const loader = document.createElement('span');
    loader.className = 'img-loader';
    loader.innerHTML = '<div class="loader"></div>';
    wrapper.appendChild(loader);

    const remove = () => loader.remove();
    img.addEventListener('load', remove, { once: true });
    img.addEventListener('error', remove, { once: true });

    const fadeIn = () => {
      wrapper.classList.add('loaded');
      img.style.visibility = 'visible';
      img.style.opacity = '1';
    };
    img.addEventListener('load', fadeIn, { once: true });
    img.addEventListener('error', fadeIn, { once: true });

    // If image already in cache and loaded, trigger immediately
    if (img.complete && img.naturalWidth) {
      remove();
      fadeIn();
    }
  }

  // Lazy loading with IntersectionObserver
  const lazyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          lazyObserver.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px 0px', // Start loading 50px before entering viewport
    threshold: 0.01
  });

  // Process lazy images
  document.querySelectorAll('img[data-src]').forEach(img => {
    lazyObserver.observe(img);
  });

  // Observe DOM additions to catch images as they are parsed
  const obs = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.tagName === 'IMG' || node.tagName === 'PICTURE') {
          wrapWithLoader(node);
          // Check for lazy loading
          const img = node.tagName === 'IMG' ? node : node.querySelector('img');
          if (img && img.dataset.src) {
            lazyObserver.observe(img);
          }
        } else {
          node.querySelectorAll && node.querySelectorAll('img, picture').forEach(wrapWithLoader);
          // Check for lazy loading in nested elements
          node.querySelectorAll && node.querySelectorAll('img[data-src]').forEach(img => {
            lazyObserver.observe(img);
          });
        }
      });
    });
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });

  // Process any images already present
  document.querySelectorAll('img, picture').forEach(wrapWithLoader);
  document.querySelectorAll('img[data-src]').forEach(img => {
    lazyObserver.observe(img);
  });
})(); 