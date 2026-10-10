/* Vastu Design: Bootstrap interactions and progressive form behaviour. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const settings = {
    // Add a direct .mp4/.webm URL or a local video path when the original is available.
    storyVideoUrl: '',
    contactEndpoint: 'contact.php'
  };

  $('#year').textContent = String(new Date().getFullYear());
  const navigation = $('#main-navigation');
  $$('.nav-link, .nav-booking a', navigation).forEach(link => {
    link.addEventListener('click', () => {
      if (navigation.classList.contains('show')) {
        window.bootstrap.Collapse.getOrCreateInstance(navigation).hide();
      }
    });
  });

  $$('[data-service]').forEach(link => {
    link.addEventListener('click', () => { $('#service').value = link.dataset.service; });
  });

  if (settings.storyVideoUrl) {
    const video = document.createElement('video');
    video.className = 'story-video';
    video.controls = true;
    video.preload = 'none';
    video.playsInline = true;
    video.setAttribute('aria-label', 'Vastu Design — our story');
    video.src = settings.storyVideoUrl;
    $('#story-media').replaceChildren(video);
  }

  const checks = {
    light: {
      title: 'Begin with light and orientation.',
      description: 'A useful starting point is to understand how daylight reaches your home during the day.',
      steps: ['Mark the orientation of your home on a floor plan.', 'Notice which rooms are bright or shaded at the times you use them.', 'Share these observations when discussing your priorities.'],
      message: 'I would like to discuss the light and orientation of my home.'
    },
    layout: {
      title: 'Begin with the way your rooms work.',
      description: 'Consider how the arrangement of your rooms supports the people who use them.',
      steps: ['Note the current use of each room on your floor plan.', 'Identify spaces that feel underused or difficult to arrange.', 'List the changes you are already considering.'],
      message: 'I would like to discuss the layout and use of the rooms in my home.'
    },
    flow: {
      title: 'Begin with your everyday movement.',
      description: 'The routes you follow each day can help reveal where the layout needs attention.',
      steps: ['Trace the route from your entrance to your main living spaces.', 'Notice furniture or room arrangements that interrupt movement.', 'Describe where you would like a clearer connection between spaces.'],
      message: 'I would like to discuss the everyday flow and connections between spaces in my home.'
    }
  };
  let chosenCheck = null;
  const resultModal = $('#home-check-modal');
  $('#home-check-form').addEventListener('submit', event => {
    event.preventDefault();
    const selected = $('input[name="home_priority"]:checked');
    if (!selected) return;
    chosenCheck = checks[selected.value];
    $('#check-result-heading').textContent = chosenCheck.title;
    $('#check-result-description').textContent = chosenCheck.description;
    $('#check-result-list').replaceChildren(...chosenCheck.steps.map(text => {
      const li = document.createElement('li');
      li.textContent = text;
      return li;
    }));
    window.bootstrap.Modal.getOrCreateInstance(resultModal).show();
  });
  $('#check-result-contact').addEventListener('click', event => {
    event.preventDefault();
    $('#service').value = 'Full home consultation';
    if (chosenCheck && !$('#message').value.trim()) $('#message').value = chosenCheck.message;
    resultModal.addEventListener('hidden.bs.modal', () => {
      $('#contact').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      setTimeout(() => $('#name').focus({ preventScroll: true }), 300);
    }, { once: true });
    window.bootstrap.Modal.getInstance(resultModal).hide();
  });

  const form = $('#enquiry-form');
  const status = $('#enquiry-status');
  const submit = $('#send-enquiry');
  let csrfToken = '';
  let sending = false;
  let tokenRequest = null;
  const phone = $('#phone');
  phone.addEventListener('input', () => {
    const value = phone.value.trim();
    phone.setCustomValidity(value === '' || /^[+0-9().\s-]{7,30}$/.test(value) ? '' : 'Please check your phone number.');
  });
  const announce = (message, type = '') => {
    status.textContent = message;
    status.className = `form-status mt-3 ${type ? `is-${type}` : ''}`;
    status.hidden = false;
  };
  const getToken = async () => {
    if (csrfToken) return csrfToken;
    if (tokenRequest) return tokenRequest;
    tokenRequest = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      let response;
      try {
        response = await fetch(settings.contactEndpoint, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' }, signal: controller.signal });
      } finally { clearTimeout(timeout); }
      const data = await response.json();
      if (!response.ok || typeof data.csrf_token !== 'string') throw new Error('token');
      csrfToken = data.csrf_token;
      return csrfToken;
    })();
    try { return await tokenRequest; } finally { tokenRequest = null; }
  };
  if (/^https?:$/.test(location.protocol)) {
    // Fetch only when the visitor begins the form, keeping initial loading lean.
    form.addEventListener('focusin', () => { getToken().catch(() => {}); }, { once: true });
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    form.classList.add('was-validated');
    if (!form.checkValidity()) {
      announce('Please check the highlighted fields before sending.', 'error');
      const firstInvalid = $(':invalid', form);
      if (firstInvalid) firstInvalid.focus();
      return;
    }
    if (location.protocol === 'file:') {
      announce('Enquiries can be sent when this website is opened through its web hosting.', 'error');
      return;
    }
    sending = true;
    submit.disabled = true;
    $('.button-label', submit).textContent = 'Sending…';
    $('.spinner-border', submit).classList.remove('d-none');
    announce('Sending your enquiry…');
    try {
      const token = await getToken();
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.csrf_token = token;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      let response;
      try {
        response = await fetch(settings.contactEndpoint, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
      } finally { clearTimeout(timeout); }
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        if (response.status === 403) csrfToken = '';
        throw new Error(result.message || 'We couldn’t send your enquiry. Please try again later.');
      }
      announce(result.message, 'success');
      form.reset();
      form.classList.remove('was-validated');
      csrfToken = '';
    } catch (error) {
      const fallback = 'We couldn’t send your enquiry at the moment. Please try again later.';
      announce(error.name === 'AbortError' || error.message === 'token' || error instanceof SyntaxError || error instanceof TypeError ? fallback : error.message, 'error');
    } finally {
      sending = false;
      submit.disabled = false;
      $('.button-label', submit).textContent = 'Send enquiry';
      $('.spinner-border', submit).classList.add('d-none');
    }
  });
})();
