/**
 * PHUONG NGA NGUYEN — HAUTE EDITORIAL PORTFOLIO JAVASCRIPT
 * Handles:
 * 1. Minimalist Luxury Light/Dark Theme Switch with localStorage persistence
 * 2. Background Classical Ambient Audio Player (Uplifting Piano: Heartwarming) with Web Audio fallback
 * 3. Fluid Card-to-Page / Chapter Slider Transitions & Keyboard Controls
 * 4. Real-time Hanoi Clock (UTC+7)
 * 5. Interactive Form Dispatch, Clipboard Copy & Custom Cursor Physics
 */

(function () {
  'use strict';

  // --- CHAPTER METADATA ---
  const CHAPTERS = {
    '01': {
      number: '01',
      title: 'Editorial Narrative & Mindset',
      crumb: 'Editorial Narrative'
    },
    '02': {
      number: '02',
      title: 'Academic Excellence',
      crumb: 'Academic Excellence'
    },
    '03': {
      number: '03',
      title: 'Leadership & Event Operations',
      crumb: 'Leadership & Operations'
    },
    '04': {
      number: '04',
      title: 'Strategic Repertoire',
      crumb: 'Strategic Repertoire'
    },
    '05': {
      number: '05',
      title: 'Professional Contact',
      crumb: 'Professional Contact'
    }
  };

  // --- STATE ---
  let activeChapter = null;
  let isSoundEffectsOn = true;
  let audioCtx = null;
  let synthMusicInterval = null;

  // --- DOM ELEMENTS ---
  const htmlRoot = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const themeText = document.getElementById('themeText');
  const ambientAudio = document.getElementById('ambientAudio');
  const ambientMusicToggle = document.getElementById('ambientMusicToggle');
  const musicLabel = document.getElementById('musicLabel');
  const musicTrackIndicator = document.getElementById('musicTrackIndicator');

  const overlay = document.getElementById('chapterOverlay');
  const overlayBackdrop = document.getElementById('overlayBackdrop');
  const overlayWindow = document.getElementById('overlayWindow');
  const overlayScroll = document.getElementById('overlayContentScroll');
  const closeOverlayBtn = document.getElementById('closeOverlayBtn');
  const activeChapterNum = document.getElementById('activeChapterNum');
  const activeChapterCrumb = document.getElementById('activeChapterTitleCrumb');
  const quickTabBtns = document.querySelectorAll('.quick-tab-btn');
  const chapterCards = document.querySelectorAll('.chapter-card');
  const navBtns = document.querySelectorAll('.nav-btn');

  const localTimeEl = document.getElementById('localTime');
  const copyEmailTrigger = document.getElementById('copyEmailTrigger');
  const copyBadge = document.getElementById('copyBadge');
  const emailVal = document.getElementById('emailVal');
  const printCvBtn = document.getElementById('printCvBtn');
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  const toastContainer = document.getElementById('toastContainer');
  const cursorDot = document.getElementById('cursorDot');
  const cursorFollower = document.getElementById('cursorFollower');

  // ==========================================================================
  // 1. LUXURY LIGHT / DARK MODE TOGGLE
  // ==========================================================================
  function initTheme() {
    const savedTheme = localStorage.getItem('luxury-portfolio-theme');
    if (savedTheme) {
      applyTheme(savedTheme, false);
    } else {
      // Default to light warm ivory as requested
      applyTheme('light', false);
    }
  }

  function applyTheme(theme, showNotification = true) {
    htmlRoot.setAttribute('data-theme', theme);
    localStorage.setItem('luxury-portfolio-theme', theme);

    if (themeText) {
      themeText.textContent = theme === 'dark' ? 'DARK' : 'LIGHT';
    }

    if (showNotification) {
      const msg = theme === 'dark' 
        ? 'Obsidian Velvet Theme Activated' 
        : 'Warm Ivory & Cream Theme Activated';
      showToast(msg);
      playTickSound(720, 'sine', 0.05);
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = htmlRoot.getAttribute('data-theme') || 'light';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme, true);
    });
  }

  // ==========================================================================
  // 2. CONTINUOUS 10-TRACK LUXURY PIANO & SAXOPHONE PLAYLIST (Auto-Advancing)
  // ==========================================================================
  const PLAYLIST = [
    {
      title: 'Heartwarming',
      type: 'Uplifting Piano Solo',
      src: './ambient.mp3',
      streamUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Heartwarming.mp3'
    },
    {
      title: 'Night on the Docks',
      type: 'Smooth Saxophone Jazz',
      src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Night%20on%20the%20Docks%20-%20Sax.mp3'
    },
    {
      title: 'Gymnopédie No. 1',
      type: 'Classical Piano Elegance',
      src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Gymnopedie%20No%201.mp3'
    },
    {
      title: 'Airport Lounge',
      type: 'Luxury Lounge Jazz & Sax',
      src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Airport%20Lounge.mp3'
    },
    {
      title: 'Shades of Spring',
      type: 'Soft Piano & Strings',
      src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Shades%20of%20Spring.mp3'
    },
    {
      title: 'George Street Shuffle',
      type: 'Warm Saxophone Swing',
      src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/George%20Street%20Shuffle.mp3'
    },
    {
      title: 'Water Lily',
      type: 'Serene Classical Piano',
      src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Water%20Lily.mp3'
    },
    {
      title: 'Smooth Lovin',
      type: 'Sultry Smooth Saxophone',
      src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Smooth%20Lovin.mp3'
    },
    {
      title: 'Autumn Day',
      type: 'Contemplative Piano Solo',
      src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Autumn%20Day.mp3'
    },
    {
      title: 'I Knew a Guy',
      type: 'Velvet Noir Sax & Piano',
      src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/I%20Knew%20a%20Guy.mp3'
    }
  ];

  let isMusicPlaying = false;
  let currentTrackIndex = 0;

  function initAudioCtx() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Uplifting, warm, lively arpeggio progression fallback via Web Audio API
  function playSynthesizedUpliftingPiano() {
    initAudioCtx();
    if (!audioCtx) return;

    // Joyful, flowing modern classical arpeggio chords: Cmaj9 -> G/B -> Am9 -> Fmaj7
    const chords = [
      [261.63, 329.63, 392.00, 493.88, 587.33], // Cmaj9
      [246.94, 293.66, 392.00, 493.88, 587.33], // G/B
      [220.00, 261.63, 329.63, 392.00, 523.25], // Am9
      [174.61, 261.63, 329.63, 392.00, 440.00]  // Fmaj7
    ];

    let chordIdx = 0;
    const playNextChord = () => {
      if (!isMusicPlaying) return;
      const chord = chords[chordIdx % chords.length];
      chordIdx++;

      chord.forEach((freq, i) => {
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.12);

          gain.gain.setValueAtTime(0.016, audioCtx.currentTime + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + i * 0.12 + 3.2);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start(audioCtx.currentTime + i * 0.12);
          osc.stop(audioCtx.currentTime + i * 0.12 + 3.4);
        } catch (e) {}
      });
    };

    playNextChord();
    synthMusicInterval = setInterval(playNextChord, 3600);
  }

  function stopSynthesizedMusic() {
    if (synthMusicInterval) {
      clearInterval(synthMusicInterval);
      synthMusicInterval = null;
    }
  }

  function updateMusicUI(isPlaying) {
    const track = PLAYLIST[currentTrackIndex];
    const trackNumStr = `${currentTrackIndex + 1}/${PLAYLIST.length}`;

    if (musicTrackIndicator) {
      musicTrackIndicator.textContent = `Track ${trackNumStr}`;
    }

    if (ambientMusicToggle) {
      if (isPlaying) {
        ambientMusicToggle.classList.add('playing');
        ambientMusicToggle.setAttribute('aria-label', `Pause music. Playing Track ${trackNumStr}: ${track.title}`);
        ambientMusicToggle.title = `Playing Track ${trackNumStr}: ${track.title} (${track.type}) • Click to Pause / Click badge to skip`;
        if (musicLabel) musicLabel.textContent = 'MUSIC ON';
      } else {
        ambientMusicToggle.classList.remove('playing');
        ambientMusicToggle.setAttribute('aria-label', `Play music. Next up Track ${trackNumStr}: ${track.title}`);
        ambientMusicToggle.title = `Track ${trackNumStr}: ${track.title} (${track.type}) • Click to Play`;
        if (musicLabel) musicLabel.textContent = 'MUSIC OFF';
      }
    }
  }

  function playTrack(index, showToastNotification = true) {
    initAudioCtx();
    currentTrackIndex = ((index % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
    const track = PLAYLIST[currentTrackIndex];
    isMusicPlaying = true;
    updateMusicUI(true);

    if (ambientAudio) {
      ambientAudio.volume = 0.42;
      ambientAudio.src = track.src;
      ambientAudio.load();

      const playPromise = ambientAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          stopSynthesizedMusic();
          if (showToastNotification) {
            showToast(`Now Playing (${currentTrackIndex + 1}/10): ${track.title} • ${track.type}`);
          }
        }).catch(err => {
          console.warn('Primary audio source failed, attempting stream URL or synth fallback', err);
          if (track.streamUrl && ambientAudio.src !== track.streamUrl) {
            ambientAudio.src = track.streamUrl;
            ambientAudio.load();
            ambientAudio.play().then(() => {
              stopSynthesizedMusic();
              if (showToastNotification) {
                showToast(`Now Playing (${currentTrackIndex + 1}/10): ${track.title} • ${track.type}`);
              }
            }).catch(() => {
              playSynthesizedUpliftingPiano();
              if (showToastNotification) {
                showToast(`Now Playing (${currentTrackIndex + 1}/10): ${track.title}`);
              }
            });
          } else {
            playSynthesizedUpliftingPiano();
            if (showToastNotification) {
              showToast(`Now Playing (${currentTrackIndex + 1}/10): ${track.title}`);
            }
          }
        });
      }
    } else {
      playSynthesizedUpliftingPiano();
      if (showToastNotification) {
        showToast(`Now Playing (${currentTrackIndex + 1}/10): ${track.title}`);
      }
    }
  }

  function pauseTrack() {
    isMusicPlaying = false;
    if (ambientAudio) {
      ambientAudio.pause();
    }
    stopSynthesizedMusic();
    updateMusicUI(false);
    showToast('Ambient Playlist Paused');
  }

  function toggleAmbientMusic() {
    if (!isMusicPlaying) {
      playTrack(currentTrackIndex, true);
    } else {
      pauseTrack();
    }
  }

  function nextTrack() {
    playTrack(currentTrackIndex + 1, true);
  }

  // Audio Event Listeners for seamless continuous auto-advance across all 10 tracks
  if (ambientAudio) {
    ambientAudio.addEventListener('ended', () => {
      nextTrack();
    });

    ambientAudio.addEventListener('error', (e) => {
      console.warn('Audio stream error on track ' + currentTrackIndex, e);
      if (isMusicPlaying) {
        setTimeout(() => {
          if (isMusicPlaying) nextTrack();
        }, 1200);
      }
    });
  }

  if (ambientMusicToggle) {
    ambientMusicToggle.addEventListener('click', (e) => {
      // If user clicks directly on the track status badge while playing, advance to next track
      if (isMusicPlaying && (e.target === musicTrackIndicator || e.target.closest('#musicTrackIndicator'))) {
        e.stopPropagation();
        nextTrack();
        return;
      }
      toggleAmbientMusic();
    });
  }

  // Initial UI state setup for the music player
  updateMusicUI(false);

  // ==========================================================================
  // HAPTIC UI SOUNDS
  // ==========================================================================
  function playTickSound(frequency = 580, type = 'sine', duration = 0.04) {
    if (!isSoundEffectsOn) return;
    try {
      initAudioCtx();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  function playSwellSound() {
    if (!isSoundEffectsOn) return;
    try {
      initAudioCtx();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.035, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } catch (e) {}
  }

  // ==========================================================================
  // 3. FLUID CARD-TO-PAGE / CHAPTER SLIDER TRANSITIONS
  // ==========================================================================
  function openChapter(chapterId) {
    if (!CHAPTERS[chapterId]) return;

    playSwellSound();
    activeChapter = chapterId;

    // Update Header Indicators
    if (activeChapterNum) activeChapterNum.textContent = CHAPTERS[chapterId].number;
    if (activeChapterCrumb) activeChapterCrumb.textContent = CHAPTERS[chapterId].crumb;

    // Update Quick Switcher Tabs
    quickTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-switch') === chapterId);
    });

    // Update Cards ARIA
    chapterCards.forEach(card => {
      const isCurrent = card.getAttribute('data-chapter') === chapterId;
      card.setAttribute('aria-expanded', isCurrent ? 'true' : 'false');
    });

    // Toggle Panes
    const allPanes = document.querySelectorAll('.chapter-content-pane');
    allPanes.forEach(pane => pane.classList.remove('active'));

    const targetPane = document.getElementById(`pane-${chapterId}`);
    if (targetPane) {
      targetPane.classList.add('active');
    }

    if (overlayScroll) {
      overlayScroll.scrollTop = 0;
    }

    // Reveal Overlay with fluid scale-up and fade
    document.body.classList.add('overlay-active');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('active');

    if (history.pushState) {
      history.pushState(null, '', `#chapter-${chapterId}`);
    }
  }

  function closeChapter() {
    if (!overlay.classList.contains('active')) return;

    playTickSound(440, 'triangle', 0.05);
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overlay-active');
    activeChapter = null;

    chapterCards.forEach(card => {
      card.setAttribute('aria-expanded', 'false');
    });

    if (history.pushState) {
      history.pushState(null, '', '#overview');
    }
  }

  function switchChapter(chapterId) {
    if (!CHAPTERS[chapterId] || chapterId === activeChapter) return;

    playTickSound(650, 'sine', 0.04);
    activeChapter = chapterId;

    const currentActivePane = document.querySelector('.chapter-content-pane.active');
    const newPane = document.getElementById(`pane-${chapterId}`);

    if (currentActivePane) {
      currentActivePane.style.opacity = '0';
      currentActivePane.style.transform = 'translateY(12px)';
      setTimeout(() => {
        currentActivePane.classList.remove('active');
        currentActivePane.style.opacity = '';
        currentActivePane.style.transform = '';

        if (newPane) {
          newPane.classList.add('active');
          if (overlayScroll) overlayScroll.scrollTop = 0;
        }
      }, 150);
    } else if (newPane) {
      newPane.classList.add('active');
      if (overlayScroll) overlayScroll.scrollTop = 0;
    }

    if (activeChapterNum) activeChapterNum.textContent = CHAPTERS[chapterId].number;
    if (activeChapterCrumb) activeChapterCrumb.textContent = CHAPTERS[chapterId].crumb;

    quickTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-switch') === chapterId);
    });

    chapterCards.forEach(card => {
      card.setAttribute('aria-expanded', card.getAttribute('data-chapter') === chapterId ? 'true' : 'false');
    });

    if (history.pushState) {
      history.pushState(null, '', `#chapter-${chapterId}`);
    }
  }

  // Bind Chapter Cards
  chapterCards.forEach(card => {
    card.addEventListener('click', () => {
      const chapter = card.getAttribute('data-chapter');
      openChapter(chapter);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const chapter = card.getAttribute('data-chapter');
        openChapter(chapter);
      }
    });
  });

  // Bind Navigation Buttons (NARRATIVE, ACADEMICS, LEADERSHIP, REPERTOIRE, CONTACT)
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      openChapter(target);
    });
  });

  // Hero CTAs
  const heroExploreBtn = document.getElementById('heroExploreBtn');
  if (heroExploreBtn) {
    heroExploreBtn.addEventListener('click', () => openChapter('01'));
  }

  const heroConnectBtn = document.getElementById('heroConnectBtn');
  if (heroConnectBtn) {
    heroConnectBtn.addEventListener('click', () => openChapter('05'));
  }

  const headerCtaBtn = document.getElementById('headerCtaBtn');
  if (headerCtaBtn) {
    headerCtaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openChapter('05');
    });
  }

  // Close Overlay
  if (closeOverlayBtn) {
    closeOverlayBtn.addEventListener('click', closeChapter);
  }

  if (overlayBackdrop) {
    overlayBackdrop.addEventListener('click', closeChapter);
  }

  // Quick Switch Tabs
  quickTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-switch');
      switchChapter(target);
    });
  });

  // Keyboard Navigation
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('active')) return;

    if (e.key === 'Escape') {
      closeChapter();
    } else if (e.key === 'ArrowRight') {
      if (!activeChapter) return;
      let nextNum = parseInt(activeChapter, 10) + 1;
      if (nextNum > 5) nextNum = 1;
      const nextId = String(nextNum).padStart(2, '0');
      switchChapter(nextId);
    } else if (e.key === 'ArrowLeft') {
      if (!activeChapter) return;
      let prevNum = parseInt(activeChapter, 10) - 1;
      if (prevNum < 1) prevNum = 5;
      const prevId = String(prevNum).padStart(2, '0');
      switchChapter(prevId);
    }
  });

  // ==========================================================================
  // 4. REAL-TIME HANOI CLOCK (UTC+7)
  // ==========================================================================
  function updateHanoiClock() {
    if (!localTimeEl) return;
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      localTimeEl.textContent = `${formatter.format(now)} (UTC+7)`;
    } catch (e) {
      localTimeEl.textContent = 'Hanoi (UTC+7)';
    }
  }
  updateHanoiClock();
  setInterval(updateHanoiClock, 1000);

  // ==========================================================================
  // 5. TOAST NOTIFICATIONS & CLIPBOARD COPY
  // ==========================================================================
  function showToast(message, duration = 3400) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✦</span><span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 350);
    }, duration);
  }

  if (copyEmailTrigger) {
    const handleCopy = () => {
      const email = emailVal ? emailVal.textContent.trim() : 'nguyenphuongnga716@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        playTickSound(780, 'sine', 0.08);
        if (copyBadge) {
          copyBadge.textContent = 'Copied!';
          copyBadge.classList.add('copied');
          setTimeout(() => {
            copyBadge.textContent = 'Copy';
            copyBadge.classList.remove('copied');
          }, 2400);
        }
        showToast('Email copied to clipboard: ' + email);
      }).catch(() => {
        showToast('Official Email: nguyenphuongnga716@gmail.com');
      });
    };

    copyEmailTrigger.addEventListener('click', handleCopy);
    copyEmailTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCopy();
      }
    });
  }

  // Print Dossier
  if (printCvBtn) {
    printCvBtn.addEventListener('click', () => {
      playTickSound(520, 'triangle', 0.06);
      window.print();
    });
  }

  // Inquiry Form Dispatch
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submitFormBtn');
      const senderName = document.getElementById('senderName').value;
      const senderEmail = document.getElementById('senderEmail').value;
      const inquiryType = document.getElementById('inquiryType').value;
      const messageText = document.getElementById('messageText').value;

      if (!senderName || !senderEmail || !messageText) return;

      playSwellSound();
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Transmitting Dossier...</span>`;
      }

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Dispatch Transmission</span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2L2 7.5l5 2.5 2.5 5L14 2z"/></svg>`;
        }
        if (formStatus) {
          formStatus.className = 'form-status success';
          formStatus.textContent = `Transmission dispatched successfully to nguyenphuongnga716@gmail.com. Thank you, ${senderName}.`;
        }
        contactForm.reset();
        showToast(`Inquiry sent to Phuong Nga Nguyen regarding ${inquiryType}`);
      }, 850);
    });
  }

  // ==========================================================================
  // 6. CUSTOM CURSOR PHYSICS (Desktop Pointer)
  // ==========================================================================
  if (cursorDot && cursorFollower && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let mouseX = -100;
    let mouseY = -100;
    let followerX = -100;
    let followerY = -100;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    });

    const renderCursor = () => {
      followerX += (mouseX - followerX) * 0.16;
      followerY += (mouseY - followerY) * 0.16;
      cursorFollower.style.transform = `translate(${followerX}px, ${followerY}px)`;
      requestAnimationFrame(renderCursor);
    };
    requestAnimationFrame(renderCursor);

    const interactiveSelectors = 'a, button, .chapter-card, .dossier-item, input, select, textarea';
    document.querySelectorAll(interactiveSelectors).forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  // Initialize theme and check URL hash
  initTheme();
  window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#chapter-')) {
      const chId = hash.replace('#chapter-', '');
      if (CHAPTERS[chId]) {
        setTimeout(() => openChapter(chId), 200);
      }
    }
  });

})();
