(function () {
  'use strict';
  const sliders = document.querySelectorAll('.slider');
  if (!sliders.length) {
    return;
  }

  Array.prototype.forEach.call(sliders, initSlider);

  function initSlider(slider) {
    const slides = slider.querySelectorAll('.slider__slide');
    if (slides.length < 2) {
      slider.classList.add('slider_inactive');
      return;
    }

    const transitionDuration = app.lib.getTransitionDuration(slides[0]);
    let activeInd = 0;
    let inProgress = false;

    slider.querySelector('.slider__prev').addEventListener('click', e => {
      e.preventDefault();
      switchSlide('prev');
    });
    slider.querySelector('.slider__next').addEventListener('click', e => {
      e.preventDefault();
      switchSlide('next');
    });


    function switchSlide(dir) {
      if (inProgress) {
        return;
      }
      inProgress = true;
      slides[0].parentNode.style.height = slides[activeInd].offsetHeight + 'px';


      let newInd = dir === 'prev' ? activeInd - 1 : activeInd + 1;
      if (newInd < 0) {
        newInd = slides.length - 1;
      } else if (newInd > slides.length - 1) {
        newInd = 0;
      }

      if (dir === 'prev') {
        slides[activeInd].classList.add('slider__slide_fadingout_prev');
        slides[newInd].classList.add('slider__slide_fadingin_prev');
        slides[0].parentNode.style.height = slides[newInd].offsetHeight + 'px';
        slides[newInd].classList.add('slider__slide_active');
        slides[newInd].classList.remove('slider__slide_fadingin_prev');

      } else {
        slides[activeInd].classList.add('slider__slide_fadingout_next');
        slides[newInd].classList.add('slider__slide_fadingin_next');
        slides[0].parentNode.style.height = slides[newInd].offsetHeight + 'px';
        slides[newInd].classList.add('slider__slide_active');
        slides[newInd].classList.remove('slider__slide_fadingin_next');
      }

      setTimeout(() => {
        slides[0].parentNode.style.height = '';
        slides[activeInd].classList.remove('slider__slide_fadingout_prev');
        slides[activeInd].classList.remove('slider__slide_fadingout_next');
        slides[activeInd].classList.remove('slider__slide_active');
        activeInd = newInd;
        inProgress = false;
      }, transitionDuration);
    }
  }
})();
