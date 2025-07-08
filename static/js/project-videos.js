(() => {
  // Replace project cover images with autoplay videos if conditions are met.
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection) {
    if (connection.saveData) return; // Respect user save-data preference
    const slow = /2g|3g|slow/.test(connection.effectiveType || "");
    if (slow) return; // Do not load videos on slow connections
  }

  // Lazy video loading
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const item = entry.target;
        if (item.dataset.videoLoaded) return; // Already processed
        
        const img = item.querySelector('img');
        if (!img) return;

        const href = item.getAttribute('href');
        if (!href) return;
        
        // Derive project folder path from href (remove index.html and any trailing slashes)
        let folder = href.replace(/\\/g, '/').replace(/index\.html.*$/, '');
        if (!folder.endsWith('/')) folder += '/';
        const videoSrc = folder + 'video.mp4';

        // Prepare video element
        const video = document.createElement('video');
        video.src = videoSrc;
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        video.poster = img.getAttribute('src') || img.getAttribute('data-src');
        video.style.width = '100%';
        video.style.borderRadius = getComputedStyle(img).borderRadius;
        video.style.display = 'none';
        // Preserve aspect ratio to avoid layout shift
        const aspect = img.style.aspectRatio || getComputedStyle(img).aspectRatio;
        if (aspect) video.style.aspectRatio = aspect;

        const swapInVideo = () => {
          // Remove loader if exists on wrapper
          const wrapper = (item.parentElement && item.parentElement.classList.contains('img-wrapper')) ? item.parentElement : null;
          if (wrapper) {
            const loader = wrapper.querySelector('.img-loader');
            if (loader) loader.remove();
            wrapper.classList.add('loaded');
          }
          img.replaceWith(video);
          video.style.display = 'block';
        };

        // Swap when video is ready to play through
        video.addEventListener('canplaythrough', swapInVideo, { once: true });
        // If loading fails, remove the video element to free memory
        video.addEventListener('error', () => {
          video.remove();
          const wrapper = (item.parentElement && item.parentElement.classList.contains('img-wrapper')) ? item.parentElement : null;
          if (wrapper) {
            const loader = wrapper.querySelector('.img-loader');
            if (loader) loader.remove();
            wrapper.classList.add('loaded');
          }
        }, { once: true });

        // Attach video element after image but hidden until ready
        img.after(video);
        item.dataset.videoLoaded = 'true';
        videoObserver.unobserve(item);
      }
    });
  }, {
    rootMargin: '100px 0px', // Start loading 100px before entering viewport
    threshold: 0.01
  });

  // Start observing video items
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.project-item[data-video]').forEach(item => {
      videoObserver.observe(item);
    });
  });
})(); 