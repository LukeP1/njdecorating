document.addEventListener("DOMContentLoaded", function () {
  var scroller = document.querySelector(".testimonial-scroller");
  var track = scroller && scroller.querySelector(".testimonial-track");

  if (scroller && track && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    Array.from(track.children).forEach(function (card) {
      var duplicate = card.cloneNode(true);
      duplicate.setAttribute("aria-hidden", "true");
      track.appendChild(duplicate);
    });

    var isPaused = false;
    var x = 0;
    var halfWidth = track.scrollWidth / 2;
    var lastTime = null;

    window.addEventListener("resize", function () {
      halfWidth = track.scrollWidth / 2;
    });
    scroller.addEventListener("mouseenter", function () { isPaused = true; });
    scroller.addEventListener("mouseleave", function () { isPaused = false; });
    scroller.addEventListener("focusin", function () { isPaused = true; });
    scroller.addEventListener("focusout", function () { isPaused = false; });

    function step(timestamp) {
      if (lastTime === null) lastTime = timestamp;
      var elapsed = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      if (!isPaused && track.scrollWidth > scroller.clientWidth) {
        x -= 40 * elapsed;
        if (-x >= halfWidth) x += halfWidth;
        track.style.transform = "translateX(" + x + "px)";
      }
      window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);
  }

  var galleryButtons = Array.from(document.querySelectorAll(".gallery-item"));
  var modal = document.getElementById("galleryLightbox");
  var image = document.getElementById("lightboxImage");
  var caption = document.getElementById("lightboxCaption");
  var previous = document.querySelector(".lightbox-control.prev");
  var next = document.querySelector(".lightbox-control.next");
  var currentIndex = 0;

  if (!galleryButtons.length || !modal || !image || !caption || !previous || !next) return;

  var gallery = galleryButtons.map(function (button) {
    return {
      src: button.getAttribute("data-src"),
      alt: button.getAttribute("data-alt") || "",
      caption: button.getAttribute("data-caption") || ""
    };
  });

  function showImage(index) {
    currentIndex = (index + gallery.length) % gallery.length;
    image.src = gallery[currentIndex].src;
    image.alt = gallery[currentIndex].alt;
    caption.textContent = gallery[currentIndex].caption;
  }

  galleryButtons.forEach(function (button, index) {
    button.addEventListener("click", function () {
      showImage(index);
      window.bootstrap.Modal.getOrCreateInstance(modal).show();
    });
  });
  previous.addEventListener("click", function () { showImage(currentIndex - 1); });
  next.addEventListener("click", function () { showImage(currentIndex + 1); });
  modal.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") showImage(currentIndex - 1);
    if (event.key === "ArrowRight") showImage(currentIndex + 1);
  });
});
