(() => {
  // Expanded healing frequencies (Brainwave, Earth, Solfeggio & Chakra) + Extended piano range
  const FREQUENCIES = [0.1, 3, 7.83, 8, 12, 40, 62, 136, 174, 256, 285, 288, 320, 341, 384, 396, 417, 426, 480, 528, 639, 693, 741, 852, 963, 1056, 1200, 1500, 1800, 2100, 2500, 3000, 3500, 4000];
  let SORTED_FREQUENCIES = [...FREQUENCIES].sort((a, b) => a - b);
  const MAX_FREQUENCY_HZ = 4200; // Match piano's top key range (C8 ~4186 Hz)
  
  // Proper Solfeggio frequency colors based on sound healing and chakra associations
  const GALAXY_COLORS = {
    0.1: {
      primary: '#0b132b', secondary: '#1c2541', tertiary: '#3a506b',
      glow: '#5bc0eb', name: 'Subdelta Calm'
    },
    136: {
      primary: '#8B4513', secondary: '#CD853F', tertiary: '#DEB887',
      glow: '#FFD59E', name: 'Cosmic OM'
    },
    174: { 
      primary: '#8B0000', secondary: '#DC143C', tertiary: '#CD5C5C', 
      glow: '#FF6B6B', name: 'Foundation Grounding'
    },
    285: { 
      primary: '#FF4500', secondary: '#FF6347', tertiary: '#FF7F50', 
      glow: '#FFA07A', name: 'Quantum Cognition'
    },
    396: { 
      primary: '#C41E3A', secondary: '#FF1744', tertiary: '#FF5722', 
      glow: '#FF8A65', name: 'Liberation Root'
    },
    417: { 
      primary: '#FF8C00', secondary: '#FFA500', tertiary: '#FFB347', 
      glow: '#FFCC80', name: 'Resonant Change'
    },
    528: { 
      primary: '#228B22', secondary: '#32CD32', tertiary: '#90EE90', 
      glow: '#98FB98', name: 'Love Frequency'
    },
    639: { 
      primary: '#4169E1', secondary: '#1E90FF', tertiary: '#87CEEB', 
      glow: '#87CEFA', name: 'Connection Harmony'
    },
    741: { 
      primary: '#4B0082', secondary: '#6A5ACD', tertiary: '#9370DB', 
      glow: '#DDA0DD', name: 'Intuitive Awakening'
    },
    852: { 
      primary: '#8A2BE2', secondary: '#9932CC', tertiary: '#BA55D3', 
      glow: '#DA70D6', name: 'Spiritual Order'
    },
    963: { 
      primary: '#FFD700', secondary: '#FFFF00', tertiary: '#FFFFE0', 
      glow: '#FFFACD', name: 'Divine Connection'
    }
  };

  const COLOR_ANCHORS = Object.keys(GALAXY_COLORS).map(Number).sort((a,b)=>a-b);

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  function hexToRgba(hex, alpha) {
    const rgb = hexToRgb(hex);
    return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : `rgba(50, 205, 50, ${alpha})`;
  }

  function interpolateColor(color1, color2, ratio) {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return color1;
    
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  function getInterpolatedColors(frequency) {
    if (!COLOR_ANCHORS.length) return null;
    let lowerKey = COLOR_ANCHORS[0];
    let upperKey = COLOR_ANCHORS[COLOR_ANCHORS.length - 1];
    
    if (frequency <= lowerKey) return GALAXY_COLORS[lowerKey];
    if (frequency >= upperKey) return GALAXY_COLORS[upperKey];
    
    for (let i = 0; i < COLOR_ANCHORS.length - 1; i++) {
      const a = COLOR_ANCHORS[i];
      const b = COLOR_ANCHORS[i+1];
      if (frequency >= a && frequency <= b) {
        lowerKey = a;
        upperKey = b;
        break;
      }
    }
    const lowerColors = GALAXY_COLORS[lowerKey];
    const upperColors = GALAXY_COLORS[upperKey];
    const ratio = (frequency - lowerKey) / (upperKey - lowerKey);
    return {
      primary: interpolateColor(lowerColors.primary, upperColors.primary, ratio),
      secondary: interpolateColor(lowerColors.secondary, upperColors.secondary, ratio),
      tertiary: interpolateColor(lowerColors.tertiary, upperColors.tertiary, ratio),
      glow: interpolateColor(lowerColors.glow, upperColors.glow, ratio),
      name: ratio < 0.5 ? lowerColors.name : upperColors.name
    };
  }

  const KEYBOARD_STEP_DEFAULT = 0.5;
  const KEYBOARD_STEP_FINE = 0.1;
  const KEYBOARD_STEP_COARSE = 1;
  const SCROLL_BASE_STEP = 0.25;
  const SCROLL_SCALE = 0.0025;

  function createWheel(root, initialTopHz = SORTED_FREQUENCIES[0] || 174) {
    root.innerHTML = `
      <div class="rotor"></div>
      <div class="pointer"></div>
      <div class="inner-circle">
        <div class="inner-pointer"></div>
      </div>
      <div class="labels"></div>
      <div class="hub">
        <div class="hz">—</div>
        <div class="sub">Hz</div>
        <div class="galaxy-name">—</div>
      </div>
    `;

    root.tabIndex = 0;
    root.setAttribute('role', 'slider');
    root.setAttribute('aria-live', 'off');
    root.setAttribute('aria-valuemin', '0');
    root.setAttribute('aria-valuemax', String(MAX_FREQUENCY_HZ));

    const rotor  = root.querySelector('.rotor');
    const pointer = root.querySelector('.pointer');
    const innerCircle = root.querySelector('.inner-circle');
    const innerPointer = root.querySelector('.inner-pointer');
    const labels = root.querySelector('.labels');
    const hubHz  = root.querySelector('.hub .hz');
    const galaxyName = root.querySelector('.hub .galaxy-name');

    const focusWheel = () => {
      if (document.activeElement !== root) {
        root.focus({ preventScroll: true });
      }
    };
    root.addEventListener('pointerdown', focusWheel);
    root.addEventListener('pointerenter', focusWheel);

    // iOS Safari: prevent text selection/copy UI while dragging, but allow label taps
    root.addEventListener('touchstart', (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      // Allow taps on frequency labels to generate click events
      if (t.closest('.labels')) return;
      // Prevent default only for drag surfaces
      if (t.closest('.pointer') || t.closest('.inner-pointer') || t.closest('.rotor') || t.closest('.inner-circle')) {
        e.preventDefault();
      }
    }, { passive: false });
    root.addEventListener('selectstart', (e) => {
      e.preventDefault();
    });
    root.addEventListener('gesturestart', (e) => {
      e.preventDefault();
    });
    root.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Format frequency for display (e.g., 1200 -> "1.2k")
    function formatFrequencyLabel(freq) {
      if (freq >= 1000) {
        const kValue = freq / 1000;
        // Remove trailing zeros after decimal point
        return kValue % 1 === 0 ? `${kValue}k` : `${kValue.toFixed(1)}k`;
      }
      return String(freq);
    }

    // place label positions around the circle with sorted frequencies (lowest at 12 o'clock)
    function layoutLabels() {
      labels.innerHTML = '';
      const b = root.getBoundingClientRect();
      const r = b.width/2 - 28;
      // keep the pointer pivot aligned with the wheel radius across screen sizes
      pointer.style.transformOrigin = `50% calc(50% + ${b.width/2}px)`;
      // Set inner pointer pivot to inner circle radius
      innerPointer.style.transformOrigin = `50% calc(50% + ${b.width * 0.2}px)`;
      for (let i = 0; i < SORTED_FREQUENCIES.length; i++) {
        const angle = -90 + (360 / SORTED_FREQUENCIES.length) * i; // Start at 12 o'clock (-90°)
        const rad = angle * Math.PI / 180;
        const x = b.width/2 + r * Math.cos(rad);
        const y = b.height/2 + r * Math.sin(rad);
        const s = document.createElement('span');
        s.style.left = x + 'px';
        s.style.top = y + 'px';
        s.dataset.frequency = SORTED_FREQUENCIES[i];
        s.textContent = formatFrequencyLabel(SORTED_FREQUENCIES[i]);
        labels.appendChild(s);
      }
    }
    layoutLabels();
    // Make labels clickable to jump directly
    labels.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const val = Number(target.dataset.frequency);
      if (!Number.isFinite(val)) return;
      
      // Set continuous frequency to the clicked label frequency
      continuousFrequency = val;
      
      // Find frequency index in array for visual positioning
      const idx = SORTED_FREQUENCIES.indexOf(val);
      if (idx >= 0) {
        currentFrequencyIndex = idx;
        pointerAngleVisual = idx * step;
      }
      
      // Reset fine tune
      innerPointerRotation = 0;
      decimalOffset = 0;
      applyRotation();
      onchange?.(currentTopHz());
    });
    addEventListener('resize', layoutLabels, {passive:true});

    // pointer state - continuous frequency control
    let innerPointerRotation = 0; // degrees for fine-tuning
    let currentFrequencyIndex = 0; // index in SORTED_FREQUENCIES array (for label reference)
    let decimalOffset = 0; // decimal adjustment for fine-tuning
    let continuousFrequency = 0; // continuous frequency value for smooth dragging
    const step = 360 / SORTED_FREQUENCIES.length; // degrees per frequency step
    let pointerAngleVisual = 0; // visual angle for main pointer
    const DEGREES_PER_HZ = 2; // 2 degrees = 1 Hz for smooth continuous control
    
    // Set initial frequency
    const initIdx = SORTED_FREQUENCIES.indexOf(initialTopHz);
    if (initIdx >= 0) {
      currentFrequencyIndex = initIdx;
      continuousFrequency = initialTopHz;
      pointerAngleVisual = initIdx * step;
    } else {
      continuousFrequency = initialTopHz;
    }
    applyRotation();

    // drag to rotate pointer - ONLY when touching the pointer itself
    let dragging = false, lastAngle = 0;
    let pointerActiveId = null;
    const center = () => {
      const b = root.getBoundingClientRect();
      return {x: b.left + b.width/2, y: b.top + b.height/2};
    };

    // Helper function to normalize angle differences to prevent jumps
    const normalizeAngleDiff = (diff) => {
      while (diff > 180) diff -= 360;
      while (diff < -180) diff += 360;
      return diff;
    };

    // Only allow dragging when pointer is touched
    pointer.addEventListener('pointerdown', (e) => {
      if (typeof e.button === 'number' && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      pointerActiveId = e.pointerId;
      const c = center();
      lastAngle = Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180/Math.PI;
      pointer.setPointerCapture?.(pointerActiveId);
    });
    
    const releasePointerCapture = (target, pointerId) => {
      if (pointerId === null || pointerId === undefined) return;
      try {
        target?.releasePointerCapture?.(pointerId);
      } catch {
        // ignore
      }
    };
    
    // Inner circle drag logic for decimal adjustments
    let innerDragging = false, lastInnerAngle = 0;
    let innerDragPointerId = null;
    let innerDragTarget = null;
    
    const startInnerDrag = (e, target) => {
      if (innerDragging) return;
      if (typeof e.button === 'number' && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      innerDragging = true;
      innerDragPointerId = e.pointerId;
      innerDragTarget = target;
      const c = center();
      lastInnerAngle = Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180/Math.PI;
      target?.setPointerCapture?.(innerDragPointerId);
    };
    
    innerPointer.addEventListener('pointerdown', (e) => startInnerDrag(e, innerPointer));
    innerCircle.addEventListener('pointerdown', (e) => {
      startInnerDrag(e, innerCircle);
    });
    
    const endDrag = (e) => {
      if (e?.pointerId !== undefined && pointerActiveId === e.pointerId) {
        releasePointerCapture(pointer, pointerActiveId);
        pointerActiveId = null;
      }
      if (e?.pointerId !== undefined && innerDragPointerId === e.pointerId && innerDragTarget) {
        releasePointerCapture(innerDragTarget, innerDragPointerId);
        innerDragPointerId = null;
        innerDragTarget = null;
      }
      dragging = false;
      innerDragging = false;
    };
    
    addEventListener('pointerup', endDrag);
    addEventListener('pointercancel', endDrag);
    
    // Combined pointer move handler for both main and inner pointers
    addEventListener('pointermove', (e) => {
      if (dragging && !innerDragging) {
        if (pointerActiveId !== null && e.pointerId !== pointerActiveId) return;
        e.preventDefault();
        const c = center();
        const currentAngle = Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180/Math.PI;
        const angleDiff = normalizeAngleDiff(currentAngle - lastAngle);
        if (Math.abs(angleDiff) < 90) {
          // Only update the visual angle. Frequency derives from angle in applyRotation()
          pointerAngleVisual += angleDiff;
          
          // Prevent going below zero by clamping to 12 o'clock if mapped frequency < 0
          const mapped = mapAngleToFrequency(pointerAngleVisual);
          if (mapped.frequency <= 0) {
            pointerAngleVisual = calculateZeroPositionAngle();
            innerPointerRotation = 0;
            decimalOffset = 0;
          }
          if (mapped.frequency >= MAX_FREQUENCY_HZ) {
            // Cap angle so mapped frequency does not exceed MAX
            // Find angle corresponding to MAX within current sector by solving inverse of mapAngleToFrequency
            // Approximation: keep current sector index but set ratio so frequency == MAX between fA..fB
            const stepAngle = 360 / SORTED_FREQUENCIES.length;
            const angleNorm = ((pointerAngleVisual % 360) + 360) % 360;
            const indexA = Math.floor(angleNorm / stepAngle);
            const indexB = (indexA + 1) % SORTED_FREQUENCIES.length;
            const fA = SORTED_FREQUENCIES[indexA];
            const fB = (indexB === 0 && fA >= 900) ? MAX_FREQUENCY_HZ : SORTED_FREQUENCIES[indexB];
            const denom = (fB - fA);
            let ratio = denom !== 0 ? (MAX_FREQUENCY_HZ - fA) / denom : 0;
            ratio = Math.max(0, Math.min(1, ratio));
            pointerAngleVisual = indexA * stepAngle + ratio * stepAngle;
            decimalOffset = 0;
          }
          
          applyRotation();
          onchange?.(currentTopHz());
        }
        lastAngle = currentAngle;
      } else if (innerDragging && !dragging) {
        if (innerDragPointerId !== null && e.pointerId !== innerDragPointerId) return;
        // Inner pointer logic for decimal adjustments
        e.preventDefault();
        
        const c = center();
        const currentAngle = Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180/Math.PI;
        const angleDiff = normalizeAngleDiff(currentAngle - lastInnerAngle);
        
        if (Math.abs(angleDiff) < 90) {
          // Convert angle difference to decimal frequency change
          // Each full 360° rotation = 0.1 Hz change for fine control (0.001 Hz precision)
          const decimalChange = (angleDiff / 360) * 0.1; // 360° = 0.1 Hz
          let newDecimalOffset = decimalOffset + decimalChange;
          let potentialHz = continuousFrequency + newDecimalOffset;
          // Clamp to max
          if (potentialHz > MAX_FREQUENCY_HZ) {
            newDecimalOffset = MAX_FREQUENCY_HZ - continuousFrequency;
            potentialHz = MAX_FREQUENCY_HZ;
          }
          
          // Only allow movement if it doesn't go below 0 Hz
          if (potentialHz >= 0) {
            // Update inner pointer rotation and decimal offset
            innerPointerRotation += angleDiff;
            decimalOffset = newDecimalOffset;
            
            applyRotation();
            onchange?.(currentTopHz());
          } else {
            // At zero boundary - stop at zero
            decimalOffset = -continuousFrequency;
            innerPointerRotation = 0;
            continuousFrequency = 0;
            pointerAngleVisual = 0;
            
            applyRotation();
            onchange?.(currentTopHz());
          }
        }
        
        lastInnerAngle = currentAngle;
      }
    });

    function calculateZeroPositionAngle() {
      // Calculate the exact visual angle for zero frequency position (12 o'clock)
      // When frequency is 0, we want the pointer at 12 o'clock which is 0 degrees
      return 0;
    }

    // Map a wheel angle to an interpolated frequency between adjacent labels
    function mapAngleToFrequency(angleDegrees) {
      const stepAngle = 360 / SORTED_FREQUENCIES.length;
      const angle = ((angleDegrees % 360) + 360) % 360; // normalize 0..360
      const indexA = Math.floor(angle / stepAngle);
      const indexB = (indexA + 1) % SORTED_FREQUENCIES.length;
      const startAngle = indexA * stepAngle;
      const ratio = (angle - startAngle) / stepAngle; // 0..1 within the sector
      const fA = SORTED_FREQUENCIES[indexA];
      const fB = SORTED_FREQUENCIES[indexB];
      // Special handling for wrap-around sector (last label -> first label):
      // instead of interpolating down from 963 to 0.1, ramp 963 -> MAX_FREQUENCY_HZ.
      let interpolated;
      if (indexB === 0 && fA >= 900) {
        const endCap = MAX_FREQUENCY_HZ;
        interpolated = fA + (endCap - fA) * ratio;
      } else {
        interpolated = fA + (fB - fA) * ratio;
      }
      // Clamp within [0, MAX_FREQUENCY_HZ]
      const freq = Math.min(MAX_FREQUENCY_HZ, Math.max(0, interpolated));
      return { frequency: freq, index: indexA };
    }

    // Inverse mapping: frequency -> wheel angle
    function mapFrequencyToAngle(freqHz) {
      const stepAngle = 360 / SORTED_FREQUENCIES.length;
      const clamped = Math.min(MAX_FREQUENCY_HZ, Math.max(0, Number(freqHz) || 0));
      if (clamped === 0) return calculateZeroPositionAngle();
      for (let indexA = 0; indexA < SORTED_FREQUENCIES.length; indexA++) {
        const indexB = (indexA + 1) % SORTED_FREQUENCIES.length;
        const fA = SORTED_FREQUENCIES[indexA];
        const fB = SORTED_FREQUENCIES[indexB];
        if (indexB === 0 && fA >= 900) {
          const endCap = MAX_FREQUENCY_HZ;
          if (clamped >= fA && clamped <= endCap) {
            const ratio = (clamped - fA) / (endCap - fA || 1);
            return indexA * stepAngle + ratio * stepAngle;
          }
        } else {
          if (clamped >= fA && clamped <= fB) {
            const ratio = (clamped - fA) / (fB - fA || 1);
            return indexA * stepAngle + ratio * stepAngle;
          }
        }
      }
      if (clamped < SORTED_FREQUENCIES[0]) return 0;
      return 359.999;
    }

    function applyRotation(forcedFrequency = null) {
      // Rotate the main pointer based on visual angle
      const visualAngle = ((pointerAngleVisual % 360) + 360) % 360;
      pointer.style.transition = 'none';
      pointer.style.transform = `translateX(-50%) rotate(${visualAngle}deg)`;

      // Derive base frequency from the pointer angle using sector interpolation
      const mapped = mapAngleToFrequency(visualAngle);
      const baseFrequency = forcedFrequency ?? Math.min(MAX_FREQUENCY_HZ, mapped.frequency);
      continuousFrequency = baseFrequency;
      currentFrequencyIndex = mapped.index;
      // Rotate the inner pointer (use visual rotation for display)
      const visualInnerRotation = ((innerPointerRotation % 360) + 360) % 360;
      innerPointer.style.transition = 'none';
      innerPointer.style.transform = `translateX(-50%) rotate(${visualInnerRotation}deg)`;
      // Restore transitions for other properties after a frame
      requestAnimationFrame(() => {
        pointer.style.transition = 'width 0.2s ease, height 0.2s ease, box-shadow 0.2s ease';
        innerPointer.style.transition = 'width 0.2s ease, height 0.2s ease, box-shadow 0.2s ease';
      });
      const currentHz = currentTopHz();
      hubHz.textContent = currentHz.toFixed(3);
      root.setAttribute('aria-valuenow', currentHz.toFixed(3));
      root.setAttribute('aria-valuetext', `${currentHz.toFixed(3)} Hz`);
      
      // Update galaxy colors dynamically - interpolate between frequencies
      const colors = getInterpolatedColors(currentHz);
      if (colors) {
        // Convert hex to rgba for CSS variables
        const primaryRgba = hexToRgba(colors.primary, 0.3);
        const secondaryRgba = hexToRgba(colors.secondary, 0.2);
        const tertiaryRgba = hexToRgba(colors.tertiary, 0.15);
        const glowRgba = hexToRgba(colors.glow, 0.4);
        
        // Update galaxy theme variables
        rotor.style.setProperty('--galaxy-primary', primaryRgba);
        rotor.style.setProperty('--galaxy-secondary', secondaryRgba);
        rotor.style.setProperty('--galaxy-tertiary', tertiaryRgba);
        rotor.style.setProperty('--galaxy-glow', glowRgba);
        
        // Update hub colors
        root.style.setProperty('--galaxy-primary', primaryRgba);
        root.style.setProperty('--galaxy-secondary', secondaryRgba);
        root.style.setProperty('--galaxy-glow', glowRgba);
        
        // Update galaxy name
        galaxyName.textContent = colors.name;
        
        // Update pointer color to match galaxy theme
        const pointerColor = `
          radial-gradient(circle at center, 
            rgba(255, 255, 255, 1) 0%, 
            rgba(255, 255, 255, 0.9) 20%,
            ${hexToRgba(colors.secondary, 0.8)} 40%,
            ${hexToRgba(colors.primary, 0.6)} 70%,
            transparent 100%
          )`;
        pointer.style.background = pointerColor;
        
        // Update pointer glow with galaxy colors
        const primaryRgb = hexToRgb(colors.primary);
        const glowRgb = hexToRgb(colors.glow);
        pointer.style.setProperty('--galaxy-primary', hexToRgba(colors.primary, 0.8));
        pointer.style.setProperty('--galaxy-secondary', hexToRgba(colors.secondary, 0.6));
        pointer.style.setProperty('--galaxy-glow', hexToRgba(colors.glow, 0.8));
      }
    }
    
    function getCurrentBaseFrequency() {
      // Return the continuous frequency from main pointer dragging
      return continuousFrequency;
    }
    
    function currentTopHz() {
      // Get continuous frequency and add decimal fine-tuning from inner pointer
      const totalHz = continuousFrequency + decimalOffset;
      
      // Ensure frequency within [0, MAX_FREQUENCY_HZ]
      return Math.min(MAX_FREQUENCY_HZ, Math.max(0, totalHz));
    }

    function setFrequency(hz) {
      const target = Math.min(MAX_FREQUENCY_HZ, Math.max(0, Number(hz) || 0));
      innerPointerRotation = 0;
      decimalOffset = 0;
      pointerAngleVisual = mapFrequencyToAngle(target);
      applyRotation(target);
      onchange?.(currentTopHz());
    }

    function nudgeFrequency(deltaHz = 0) {
      if (!deltaHz) return;
      setFrequency(currentTopHz() + deltaHz);
    }

    root.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      const baseStep = e.altKey ? KEYBOARD_STEP_FINE : (e.shiftKey ? KEYBOARD_STEP_COARSE : KEYBOARD_STEP_DEFAULT);
      const delta = e.key === 'ArrowUp' ? baseStep : -baseStep;
      nudgeFrequency(delta);
    });

    root.addEventListener('wheel', (e) => {
      if (dragging || innerDragging) return;
      if (!Number.isFinite(e.deltaY) || e.deltaY === 0) return;
      e.preventDefault();
      focusWheel();
      const direction = e.deltaY < 0 ? 1 : -1;
      const magnitude = Math.min(3, Math.abs(e.deltaY) * SCROLL_SCALE);
      nudgeFrequency(direction * (SCROLL_BASE_STEP + magnitude));
    }, { passive: false });

    let onchange = null;
    return {
      getHz: () => currentTopHz(),
      setOnChange: fn => (onchange = fn),
      setHz: setFrequency,
      reset: () => {
        // Reset to lowest frequency in array
        const base = SORTED_FREQUENCIES[0] ?? 0.1;
        currentFrequencyIndex = 0;
        setFrequency(base);
      },
      element: root,
      focus: focusWheel,
      nudge: nudgeFrequency
    };
  }

  // AUDIO
  let audioCtx = null;
  let wheel1 = null, wheel2 = null; // Two audio voices, dynamically assigned to channels
  let monoOsc1 = null, monoOsc2 = null; // Two oscillators for mono mix (left and right wheel frequencies)
  let monoGain = null; // Gain node for mono volume control
  let monoVolume = 0; // 0-1 range, default 0%
  
  function ensureAudio(){
    if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    const make = (pan)=> {
      const osc = audioCtx.createOscillator(); osc.type = 'sine';
      const gain = audioCtx.createGain(); gain.gain.value = 0.25;
      const panner = audioCtx.createStereoPanner(); panner.pan.value = pan;
      osc.connect(gain).connect(panner).connect(audioCtx.destination);
      return {osc,gain,panner,started:false};
    };
    if (!wheel1) wheel1 = make(wheelLPan); // Use wheelLPan for initial pan
    if (!wheel2) wheel2 = make(wheelRPan); // Use wheelRPan for initial pan
    
    // Create mono audio nodes
    if (!monoOsc1) {
      monoOsc1 = audioCtx.createOscillator();
      monoOsc1.type = 'sine';
      monoOsc1.started = false;
      const gain1 = audioCtx.createGain();
      gain1.gain.value = 0.125; // Lower gain for mixing
      monoOsc1.connect(gain1);
      
      monoOsc2 = audioCtx.createOscillator();
      monoOsc2.type = 'sine';
      monoOsc2.started = false;
      const gain2 = audioCtx.createGain();
      gain2.gain.value = 0.125; // Lower gain for mixing
      monoOsc2.connect(gain2);
      
      // Mix both oscillators into a single gain node for volume control
      monoGain = audioCtx.createGain();
      monoGain.gain.value = monoVolume;
      
      gain1.connect(monoGain);
      gain2.connect(monoGain);
      monoGain.connect(audioCtx.destination);
      
      monoOsc1._gain = gain1;
      monoOsc2._gain = gain2;
    }
  }
  function startAudio(fadeIn = false){
    ensureAudio();
    const t = audioCtx.currentTime + 0.01;
    const fadeInDuration = 0.08; // 80ms fade-in to prevent click
    
    // If fade-in requested, start with zero gain
    if (fadeIn && wheel1?.gain && wheel2?.gain) {
      try {
        wheel1.gain.gain.setValueAtTime(0, t);
        wheel2.gain.gain.linearRampToValueAtTime(0.25, t + fadeInDuration);
        wheel1.gain.gain.linearRampToValueAtTime(0.25, t + fadeInDuration);
      } catch(e) {}
    }
    
    if (!wheel1.started){ wheel1.osc.start(t); wheel1.started=true; }
    if (!wheel2.started){ wheel2.osc.start(t); wheel2.started=true; }
    if (!monoOsc1.started){ monoOsc1.start(t); monoOsc1.started=true; }
    if (!monoOsc2.started){ monoOsc2.start(t); monoOsc2.started=true; }
    updateOscillators();
    updateMonoOscillators();
  }
  
  // Fade in audio smoothly (for use when audio is already running)
  function fadeInAudio(duration = 0.08) {
    if (!audioCtx || !wheel1?.gain || !wheel2?.gain) return;
    
    const now = audioCtx.currentTime;
    const fadeEnd = now + duration;
    
    try {
      // First set current value, then ramp to target
      wheel1.gain.gain.setValueAtTime(0, now);
      wheel2.gain.gain.setValueAtTime(0, now);
      wheel1.gain.gain.linearRampToValueAtTime(0.25, fadeEnd);
      wheel2.gain.gain.linearRampToValueAtTime(0.25, fadeEnd);
    } catch(e) {}
  }
  function stopAudio(){
    if (!audioCtx) return;
    if (wheel1?.started){ try{wheel1.osc.stop();}catch{} }
    if (wheel2?.started){ try{wheel2.osc.stop();}catch{} }
    if (monoOsc1?.started){ try{monoOsc1.stop();}catch{} }
    if (monoOsc2?.started){ try{monoOsc2.stop();}catch{} }
    wheel1 = wheel2 = null;
    monoOsc1 = monoOsc2 = null;
    monoGain = null;
    stopHarmonicOscillators();
    setTransportActive('stop');
  }
  
  // Fade out audio smoothly over specified duration (in seconds)
  function fadeOutAudio(duration = 3) {
    return new Promise((resolve) => {
      if (!audioCtx) {
        resolve();
        return;
      }
      
      const now = audioCtx.currentTime;
      const fadeEnd = now + duration;
      
      // Fade out wheel gains
      if (wheel1?.gain) {
        try {
          wheel1.gain.gain.setValueAtTime(wheel1.gain.gain.value, now);
          wheel1.gain.gain.linearRampToValueAtTime(0, fadeEnd);
        } catch(e) {}
      }
      if (wheel2?.gain) {
        try {
          wheel2.gain.gain.setValueAtTime(wheel2.gain.gain.value, now);
          wheel2.gain.gain.linearRampToValueAtTime(0, fadeEnd);
        } catch(e) {}
      }
      
      // Fade out mono gain
      if (monoGain) {
        try {
          monoGain.gain.setValueAtTime(monoGain.gain.value, now);
          monoGain.gain.linearRampToValueAtTime(0, fadeEnd);
        } catch(e) {}
      }
      
      // Wait for fade to complete, then stop oscillators
      setTimeout(() => {
        stopAudio();
        resolve();
      }, duration * 1000 + 100);
    });
  }
  function setFreq(osc, hz){
    if (!osc) return;
    const now = audioCtx.currentTime;
    try { osc.frequency.setTargetAtTime(hz, now, 0.015); } catch { osc.frequency.value = hz; }
  }

  // Build wheels - start with lowest frequency at 12 o'clock
  let wheelL = createWheel(document.getElementById('wheelL'), SORTED_FREQUENCIES[0]);
  let wheelR = createWheel(document.getElementById('wheelR'), SORTED_FREQUENCIES[0]);
  
  // Track pan position for each wheel (-1 = left, 0 = center, +1 = right)
  let wheelLPan = -1;  // Default: left wheel panned left
  let wheelRPan = 1;   // Default: right wheel panned right
  
  // Track mute state for each wheel
  let wheelLMuted = false;
  let wheelRMuted = false;
  
  // Track overtone state (declared early for use in mute functions)
  let showOvertoneHighlights = false;
  let wheelMuteStatesBeforeOvertones = { left: false, right: false };
  let currentOvertonesFundamental = 0; // Moved here to avoid TDZ issues
  
  // Binaural handling for sub-audible selections
  const BINAURAL_MIN_AUDIBLE_HZ = 20;
  // Use a low carrier at the audibility threshold to avoid high-pitched region for sub-audible beats
  const BINAURAL_CARRIER_HZ = 20;
  
  function updateOscillators(){
    if (!audioCtx || !wheel1 || !wheel2) return;
    
    let l = wheelL.getHz();
    let r = wheelR.getHz();
    
    // Set frequencies - each wheel has its own oscillator
    // If muted, frequency is still set but gain will be 0
    setFreq(wheel1.osc, wheelLMuted ? 0.1 : l);
    setFreq(wheel2.osc, wheelRMuted ? 0.1 : r);
    
    // Update stereo panning for each wheel
    const now = audioCtx.currentTime;
    if (wheel1.panner) {
      try {
        wheel1.panner.pan.setTargetAtTime(wheelLMuted ? 0 : wheelLPan, now, 0.015);
      } catch {
        wheel1.panner.pan.value = wheelLMuted ? 0 : wheelLPan;
      }
    }
    if (wheel2.panner) {
      try {
        wheel2.panner.pan.setTargetAtTime(wheelRMuted ? 0 : wheelRPan, now, 0.015);
      } catch {
        wheel2.panner.pan.value = wheelRMuted ? 0 : wheelRPan;
      }
    }
    
    // Update gain - mute by setting gain to 0
    if (wheel1.gain) {
      try {
        wheel1.gain.gain.setTargetAtTime(wheelLMuted ? 0 : 0.25, now, 0.015);
      } catch {
        wheel1.gain.gain.value = wheelLMuted ? 0 : 0.25;
      }
    }
    if (wheel2.gain) {
      try {
        wheel2.gain.gain.setTargetAtTime(wheelRMuted ? 0 : 0.25, now, 0.015);
      } catch {
        wheel2.gain.gain.value = wheelRMuted ? 0 : 0.25;
      }
    }
    
    // Update mono oscillators
    updateMonoOscillators();
  }
  
  function updateMonoOscillators(){
    if (!audioCtx || !monoOsc1 || !monoOsc2) return;
    
    let l = wheelL.getHz();
    let r = wheelR.getHz();
    
    // Set frequencies directly from wheels (mono mix always uses both frequencies)
    setFreq(monoOsc1, l);
    setFreq(monoOsc2, r);
  }
  
  const scheduleOscillatorSync = (() => {
    let scheduled = false;
    const enqueue = window.requestAnimationFrame 
      ? window.requestAnimationFrame.bind(window)
      : (cb) => setTimeout(cb, 16);
    return () => {
      if (scheduled) return;
      scheduled = true;
      enqueue(() => {
        scheduled = false;
        updateOscillators();
        updateKeyboardHighlights();
        updateLiveInfo();
      });
    };
  })();
  
  // Presets
  // Harmonic interval presets based on OM frequency (136.10 Hz) as C
  // Ordered by the overtone series - consecutive harmonic ratios first, then compound intervals
  // Ratio n:m means interval from nth to mth harmonic, frequency ratio = m/n
  const OM_BASE = 136.10; // This is our "C"
  const PRESETS = [
    // 1:1 - Unison (same frequency)
    { name: 'Unison (1:1)', left: OM_BASE, right: OM_BASE },
    
    // 1:2 - Octave (1st to 2nd harmonic)
    { name: 'Octave (1:2)', left: OM_BASE, right: OM_BASE * 2 },
    
    // 2:3 - Perfect Fifth (2nd to 3rd harmonic)
    { name: 'Fifth (2:3)', left: OM_BASE, right: OM_BASE * 3/2 },
    
    // 3:4 - Perfect Fourth (3rd to 4th harmonic)
    { name: 'Fourth (3:4)', left: OM_BASE, right: OM_BASE * 4/3 },
    
    // 3:5 - Major Sixth (3rd to 5th harmonic)
    { name: 'Major Sixth (3:5)', left: OM_BASE, right: OM_BASE * 5/3 },
    
    // 4:5 - Major Third (4th to 5th harmonic)
    { name: 'Major Third (4:5)', left: OM_BASE, right: OM_BASE * 5/4 },
    
    // 5:6 - Minor Third (5th to 6th harmonic)
    { name: 'Minor Third (5:6)', left: OM_BASE, right: OM_BASE * 6/5 },
    
    // 5:8 - Minor Sixth (5th to 8th harmonic)
    { name: 'Minor Sixth (5:8)', left: OM_BASE, right: OM_BASE * 8/5 },
    
    // 5:9 - Minor Seventh (5th to 9th harmonic)
    { name: 'Minor Seventh (5:9)', left: OM_BASE, right: OM_BASE * 9/5 },
    
    // 8:9 - Major Second (8th to 9th harmonic)
    { name: 'Major Second (8:9)', left: OM_BASE, right: OM_BASE * 9/8 },
    
    // 8:15 - Major Seventh (8th to 15th harmonic)
    { name: 'Major Seventh (8:15)', left: OM_BASE, right: OM_BASE * 15/8 },
    
    // 15:16 - Minor Second (15th to 16th harmonic)
    { name: 'Minor Second (15:16)', left: OM_BASE, right: OM_BASE * 16/15 },
    
    // 32:45 - Tritone (complex ratio, high in harmonic series)
    { name: 'Tritone (32:45)', left: OM_BASE, right: OM_BASE * 45/32 }
  ];

  const KEYBOARD_NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const KEYBOARD_KEY_COUNT = 88;
  const KEYBOARD_START_MIDI = 21; // A0
  const KEYBOARD_WHITE_TOTAL = 52;
  const BLACK_KEY_POSITION_OFFSET = 0.62;
  const pianoKeyboardEl = document.getElementById('pianoKeyboard');
  const keyboardTargetsState = { left: true, right: true }; // Always target both wheels
  let pianoKeys = [];
  const pianoHighlightState = { left: null, right: null };

  // Frequency labels layer for showing cent deviation above active keys
  let freqLabelsLayer = null;
  const freqLabelMap = new Map(); // key element -> label element
  
  function buildPianoKeyboard() {
    if (!pianoKeyboardEl) return;
    
    // Create frequency labels layer above the keyboard
    freqLabelsLayer = document.createElement('div');
    freqLabelsLayer.className = 'piano-freq-labels';
    
    const inner = document.createElement('div');
    inner.className = 'piano-keyboard-inner';
    const whiteLayer = document.createElement('div');
    whiteLayer.className = 'piano-white-keys';
    const blackLayer = document.createElement('div');
    blackLayer.className = 'piano-black-keys';
    inner.append(whiteLayer, blackLayer);

    const keys = [];
    let whiteIndex = -1;
    for (let i = 0; i < KEYBOARD_KEY_COUNT; i++) {
      const midi = KEYBOARD_START_MIDI + i;
      const noteIndex = midi % 12;
      const noteName = KEYBOARD_NOTE_NAMES[noteIndex];
      const octave = Math.floor(midi / 12) - 1;
      const fullName = `${noteName}${octave}`;
      const frequency = 440 * Math.pow(2, (midi - 69) / 12);
      const isSharp = noteName.includes('#');

      const keyEl = document.createElement('div');
      keyEl.className = `piano-key ${isSharp ? 'black-key' : 'white-key'}`;
      keyEl.dataset.note = fullName;
      keyEl.dataset.frequency = String(frequency);
      keyEl.setAttribute('aria-label', `${fullName} (${frequency.toFixed(2)} Hz)`);
      keyEl.tabIndex = 0;
      keyEl.setAttribute('role', 'button');

      const label = document.createElement('span');
      label.className = 'key-label';
      label.textContent = fullName;
      const glowBottom = document.createElement('span');
      glowBottom.className = 'key-glow-bottom';
      const glowTop = document.createElement('span');
      glowTop.className = 'key-glow-top';
      keyEl.append(glowTop, glowBottom, label);

      if (isSharp) {
        const baseIndex = Math.max(0, whiteIndex);
        const baseOffset = whiteIndex * 100 / KEYBOARD_WHITE_TOTAL;
        const offset = (BLACK_KEY_POSITION_OFFSET / KEYBOARD_WHITE_TOTAL) * 100;
        keyEl.style.left = `calc(${baseOffset}% + ${offset}%)`;
        blackLayer.appendChild(keyEl);
      } else {
        whiteIndex++;
        whiteLayer.appendChild(keyEl);
      }

      keys.push({ element: keyEl, frequency, note: fullName, midi, isSharp, label, noteIndex, octave });
    }

    pianoKeyboardEl.innerHTML = '';
    pianoKeyboardEl.appendChild(freqLabelsLayer);
    pianoKeyboardEl.appendChild(inner);
    pianoKeys = keys.map((key, idx) => ({
      ...key,
      nextFrequency: keys[idx + 1]?.frequency ?? key.frequency
    }));
    
    // Clear label map when rebuilding keyboard
    freqLabelMap.clear();
  }
  
  function getKeySpanForFrequency(freq) {
    if (!Number.isFinite(freq) || !pianoKeys.length) return null;
    if (freq <= pianoKeys[0].frequency) {
      const span = Math.max(1e-6, (pianoKeys[0].nextFrequency ?? pianoKeys[0].frequency + 1) - pianoKeys[0].frequency);
      const ratio = Math.max(0, Math.min(1, (freq - pianoKeys[0].frequency) / span));
      return { key: pianoKeys[0], ratio };
    }
    for (let i = 0; i < pianoKeys.length; i++) {
      const current = pianoKeys[i];
      const nextKey = pianoKeys[i + 1];
      if (!nextKey || freq < nextKey.frequency) {
        const span = Math.max(1e-6, (nextKey?.frequency ?? (current.frequency + 1)) - current.frequency);
        const ratio = Math.max(0, Math.min(1, (freq - current.frequency) / span));
        return { key: current, ratio };
      }
    }
    return { key: pianoKeys[pianoKeys.length - 1], ratio: 1 };
  }

  function clearKeyHighlight(side) {
    const prev = pianoHighlightState[side];
    if (prev?.element) {
      prev.element.classList.remove(`is-${side}`);
      prev.element.style.removeProperty(`--${side}-highlight`);
      prev.element.style.removeProperty(`--${side}-fill`);
    }
    pianoHighlightState[side] = null;
  }

  function applyKeyHighlight(side, freq) {
    if (!pianoKeys.length) return;
    const span = getKeySpanForFrequency(freq);
    if (!span?.key?.element) {
      clearKeyHighlight(side);
      return;
    }
    const { key: targetKey, ratio } = span;
    const colors = getInterpolatedColors(freq);
    const highlight = colors?.glow || colors?.primary || (side === 'left' ? '#22c55e' : '#60a5fa');
    if (pianoHighlightState[side]?.element !== targetKey.element) {
      clearKeyHighlight(side);
    }
    targetKey.element.classList.add(`is-${side}`);
    targetKey.element.style.setProperty(`--${side}-highlight`, highlight);
    targetKey.element.style.setProperty(`--${side}-fill`, ratio.toFixed(3));
    pianoHighlightState[side] = { element: targetKey.element };
  }

  function updateKeyboardHighlights() {
    if (!pianoKeyboardEl || !pianoKeys.length || !wheelL || !wheelR) return;
    applyKeyHighlight('left', wheelL.getHz());
    applyKeyHighlight('right', wheelR.getHz());
    
    // Update frequency labels if not in overtone mode
    if (!showOvertoneHighlights) {
      updateFreqLabels();
    }
  }
  
  // Update piano keyboard labels based on current note system
  function updatePianoKeyLabels() {
    if (!pianoKeys.length) return;
    const noteNames = NOTE_NAMES[noteSystem];
    
    pianoKeys.forEach(key => {
      if (key.label && key.noteIndex !== undefined && key.octave !== undefined) {
        const noteName = noteNames[key.noteIndex];
        const fullName = `${noteName}${key.octave}`;
        key.label.textContent = fullName;
        key.element.setAttribute('aria-label', `${fullName} (${key.frequency.toFixed(2)} Hz)`);
      }
    });
  }

  // Note system state
  let noteSystem = 'alphabetical'; // 'alphabetical' or 'solfege'
  
  // Note name mappings
  const NOTE_NAMES = {
    alphabetical: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    solfege: ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si']
  };
  
  // Convert frequency to piano note name with cents deviation and Hz offset
  // Always shows positive cents (deviation from note at or below the frequency)
  function frequencyToNote(frequency) {
    if (!Number.isFinite(frequency) || frequency <= 0) return { note: '—', cents: 0, hzOffset: 0 };
    
    // Check if frequency is below human hearing range (15 Hz)
    if (frequency < 15) return { note: 'BELOW_HEARING', cents: 0, hzOffset: 0 };
    
    // A4 = 440 Hz, MIDI note 69
    const A4 = 440;
    const A4_MIDI = 69;
    
    // Calculate the MIDI note number (can be fractional)
    const noteNumber = 12 * Math.log2(frequency / A4) + A4_MIDI;
    
    // Floor to get the note at or below the frequency (always positive cents)
    const baseMidi = Math.floor(noteNumber);
    
    // Calculate cents deviation from the base note (always 0 to +99 cents)
    const cents = Math.round((noteNumber - baseMidi) * 100);
    
    // Calculate base frequency and Hz offset
    const baseFreq = A4 * Math.pow(2, (baseMidi - A4_MIDI) / 12);
    const hzOffset = frequency - baseFreq;
    
    // Get note name based on current system
    const noteNames = NOTE_NAMES[noteSystem];
    const noteIndex = ((baseMidi % 12) + 12) % 12; // Handle negative modulo
    const octave = Math.floor(baseMidi / 12) - 1;
    const noteName = noteNames[noteIndex] + octave;
    
    return { note: noteName, cents, hzOffset };
  }

  // Update live information display
  function updateLiveInfo() {
    const leftWheelNoteEl = document.getElementById('leftWheelNote');
    const rightWheelNoteEl = document.getElementById('rightWheelNote');
    const leftWheelOffsetEl = document.getElementById('leftWheelOffset');
    const rightWheelOffsetEl = document.getElementById('rightWheelOffset');
    const leftWheelFreqEl = document.getElementById('leftWheelFreq');
    const rightWheelFreqEl = document.getElementById('rightWheelFreq');
    const frequencyDiffEl = document.getElementById('frequencyDiff');
    
    if (!leftWheelNoteEl || !rightWheelNoteEl || !leftWheelOffsetEl || !rightWheelOffsetEl || !leftWheelFreqEl || !rightWheelFreqEl || !frequencyDiffEl) return;
    if (!wheelL || !wheelR) return;
    
    const leftFreq = wheelL.getHz();
    const rightFreq = wheelR.getHz();
    
    // Get note names with Hz offset
    const leftNote = frequencyToNote(leftFreq);
    const rightNote = frequencyToNote(rightFreq);
    
    // Format Hz offset display
    const formatHzOffset = (noteData) => {
      if (noteData.note === '—' || noteData.note === 'BELOW_HEARING') return '—';
      if (noteData.hzOffset === 0) return '+0.0Hz';
      return noteData.hzOffset > 0 ? `+${noteData.hzOffset.toFixed(1)}Hz` : `${noteData.hzOffset.toFixed(1)}Hz`;
    };
    
    // Update note names (just the note, no offset)
    leftWheelNoteEl.textContent = leftNote.note === 'BELOW_HEARING' ? '🔇' : leftNote.note;
    rightWheelNoteEl.textContent = rightNote.note === 'BELOW_HEARING' ? '🔇' : rightNote.note;
    
    // Update Hz offsets
    leftWheelOffsetEl.textContent = formatHzOffset(leftNote);
    rightWheelOffsetEl.textContent = formatHzOffset(rightNote);
    
    // Add/remove below-hearing class for styling
    if (leftNote.note === 'BELOW_HEARING') {
      leftWheelNoteEl.classList.add('below-hearing');
    } else {
      leftWheelNoteEl.classList.remove('below-hearing');
    }
    
    if (rightNote.note === 'BELOW_HEARING') {
      rightWheelNoteEl.classList.add('below-hearing');
    } else {
      rightWheelNoteEl.classList.remove('below-hearing');
    }
    
    // Update frequencies
    leftWheelFreqEl.textContent = `${leftFreq.toFixed(3)} Hz`;
    rightWheelFreqEl.textContent = `${rightFreq.toFixed(3)} Hz`;
    
    // Calculate frequency difference
    const diff = Math.abs(rightFreq - leftFreq);
    frequencyDiffEl.textContent = `${diff.toFixed(3)} Hz`;
    
    // Update spectrogram
    updateSpectrogram(leftFreq, rightFreq);
  }

  // ===== OSCILLOSCOPE WAVEFORM VISUALIZATION =====
  const spectrogramCanvas = document.getElementById('spectrogramCanvas');
  const spectrogramCtx = spectrogramCanvas?.getContext('2d');
  const spectrogramWrapper = document.getElementById('spectrogramWrapper');
  
  // Oscilloscope state
  let spectrogramEnabled = true; // Always visible
  let spectrogramAnimationId = null;
  let isAudioPlaying = false;
  let wavePhaseLeft = 0;
  let wavePhaseRight = 0;
  let lastFrameTime = 0;
  const SPECTROGRAM_HEIGHT = 60;
  
  // Resize canvas with proper DPR handling
  function resizeSpectrogramCanvas() {
    if (!spectrogramCanvas) return;
    const rect = spectrogramCanvas.parentElement?.getBoundingClientRect();
    if (rect && rect.width > 0) {
      const dpr = window.devicePixelRatio || 1;
      const width = Math.floor(rect.width);
      spectrogramCanvas.width = width * dpr;
      spectrogramCanvas.height = SPECTROGRAM_HEIGHT * dpr;
      spectrogramCanvas.style.width = width + 'px';
      spectrogramCanvas.style.height = SPECTROGRAM_HEIGHT + 'px';
      if (spectrogramCtx) {
        spectrogramCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Re-render current state after resize
        if (isAudioPlaying) {
          const leftFreq = wheelL?.getHz() ?? 0;
          const rightFreq = wheelR?.getHz() ?? 0;
          renderOscilloscope(leftFreq, rightFreq);
        } else {
          renderIdleWaveform();
        }
      }
    }
  }
  
  // Render idle/empty waveform (flat lines when no audio)
  function renderIdleWaveform() {
    if (!spectrogramCanvas || !spectrogramCtx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const width = spectrogramCanvas.width / dpr;
    const height = spectrogramCanvas.height / dpr;
    
    if (width <= 0 || height <= 0) return;
    
    const isDark = document.body.dataset.theme === 'dark';
    const centerY = height / 2;
    
    // Clear canvas
    spectrogramCtx.clearRect(0, 0, width, height);
    
    // Background with subtle gradient
    const bgGrad = spectrogramCtx.createLinearGradient(0, 0, 0, height);
    if (isDark) {
      bgGrad.addColorStop(0, '#0d1117');
      bgGrad.addColorStop(0.5, '#0a0e14');
      bgGrad.addColorStop(1, '#0d1117');
    } else {
      bgGrad.addColorStop(0, '#f8fafc');
      bgGrad.addColorStop(0.5, '#f1f5f9');
      bgGrad.addColorStop(1, '#f8fafc');
    }
    spectrogramCtx.fillStyle = bgGrad;
    spectrogramCtx.fillRect(0, 0, width, height);
    
    // Center line (dashed)
    spectrogramCtx.strokeStyle = isDark ? 'rgba(100, 120, 150, 0.2)' : 'rgba(100, 120, 150, 0.15)';
    spectrogramCtx.lineWidth = 1;
    spectrogramCtx.setLineDash([4, 4]);
    spectrogramCtx.beginPath();
    spectrogramCtx.moveTo(0, centerY);
    spectrogramCtx.lineTo(width, centerY);
    spectrogramCtx.stroke();
    spectrogramCtx.setLineDash([]);
  }
  
  setTimeout(() => {
    resizeSpectrogramCanvas();
    // Render initial empty state (flat lines, no animation)
    if (spectrogramCtx) {
      renderIdleWaveform();
    }
  }, 100);
  window.addEventListener('resize', resizeSpectrogramCanvas);
  
  // Start continuous waveform animation
  function startSpectrogramAnimation() {
    if (spectrogramAnimationId) return;
    lastFrameTime = performance.now();
    
    function animate(timestamp) {
      if (!spectrogramEnabled || !isAudioPlaying) {
        spectrogramAnimationId = null;
        return;
      }
      
      // Calculate delta time for smooth animation
      const deltaTime = (timestamp - lastFrameTime) / 1000; // Convert to seconds
      lastFrameTime = timestamp;
      
      // Get current frequencies
      const leftFreq = wheelL?.getHz() ?? 100;
      const rightFreq = wheelR?.getHz() ?? 100;
      
      // Update wave phases based on actual frequencies
      // Scale frequency for visible oscillation (divide to slow down high frequencies)
      const leftDisplayFreq = Math.min(leftFreq, 500) * 0.15;
      const rightDisplayFreq = Math.min(rightFreq, 500) * 0.15;
      
      wavePhaseLeft += deltaTime * leftDisplayFreq * Math.PI * 2;
      wavePhaseRight += deltaTime * rightDisplayFreq * Math.PI * 2;
      
      // Keep phases within reasonable bounds
      if (wavePhaseLeft > Math.PI * 200) wavePhaseLeft -= Math.PI * 200;
      if (wavePhaseRight > Math.PI * 200) wavePhaseRight -= Math.PI * 200;
      
      // Render waveform
      renderOscilloscope(leftFreq, rightFreq);
      
      spectrogramAnimationId = requestAnimationFrame(animate);
    }
    
    spectrogramAnimationId = requestAnimationFrame(animate);
  }
  
  function stopSpectrogramAnimation() {
    if (spectrogramAnimationId) {
      cancelAnimationFrame(spectrogramAnimationId);
      spectrogramAnimationId = null;
    }
  }
  
  function renderOscilloscope(leftFreq, rightFreq) {
    if (!spectrogramCanvas || !spectrogramCtx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const width = spectrogramCanvas.width / dpr;
    const height = spectrogramCanvas.height / dpr;
    
    if (width <= 0 || height <= 0) return;
    
    const isDark = document.body.dataset.theme === 'dark';
    const centerY = height / 2;
    const amplitude = height * 0.35;
    
    // Calculate display frequencies for wave cycles
    const leftDisplayFreq = Math.min(leftFreq, 500) * 0.15;
    const rightDisplayFreq = Math.min(rightFreq, 500) * 0.15;
    
    // Number of wave cycles to show
    const leftCycles = Math.max(2, Math.min(8, leftDisplayFreq / 5));
    const rightCycles = Math.max(2, Math.min(8, rightDisplayFreq / 5));
    
    // Clear canvas
    spectrogramCtx.clearRect(0, 0, width, height);
    
    // Background with subtle gradient
    const bgGrad = spectrogramCtx.createLinearGradient(0, 0, 0, height);
    if (isDark) {
      bgGrad.addColorStop(0, '#0d1117');
      bgGrad.addColorStop(0.5, '#0a0e14');
      bgGrad.addColorStop(1, '#0d1117');
    } else {
      bgGrad.addColorStop(0, '#f8fafc');
      bgGrad.addColorStop(0.5, '#f1f5f9');
      bgGrad.addColorStop(1, '#f8fafc');
    }
    spectrogramCtx.fillStyle = bgGrad;
    spectrogramCtx.fillRect(0, 0, width, height);
    
    // Center line
    spectrogramCtx.strokeStyle = isDark ? 'rgba(100, 120, 150, 0.2)' : 'rgba(100, 120, 150, 0.15)';
    spectrogramCtx.lineWidth = 1;
    spectrogramCtx.setLineDash([4, 4]);
    spectrogramCtx.beginPath();
    spectrogramCtx.moveTo(0, centerY);
    spectrogramCtx.lineTo(width, centerY);
    spectrogramCtx.stroke();
    spectrogramCtx.setLineDash([]);
    
    // Draw combined/binaural waveform (subtle, in background)
    const beatFreq = Math.abs(leftFreq - rightFreq);
    if (beatFreq > 0 && beatFreq < 50) {
      spectrogramCtx.beginPath();
      spectrogramCtx.strokeStyle = isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)';
      spectrogramCtx.lineWidth = 8;
      
      const beatDisplayFreq = beatFreq * 0.5;
      for (let x = 0; x <= width; x++) {
        const t = x / width;
        const beatPhase = (wavePhaseLeft + wavePhaseRight) / 2 + t * beatDisplayFreq * Math.PI * 2;
        const y = centerY + Math.sin(beatPhase) * amplitude * 0.8;
        if (x === 0) {
          spectrogramCtx.moveTo(x, y);
        } else {
          spectrogramCtx.lineTo(x, y);
        }
      }
      spectrogramCtx.stroke();
    }
    
    // Draw left channel waveform (orange/amber)
    spectrogramCtx.beginPath();
    const leftGrad = spectrogramCtx.createLinearGradient(0, centerY - amplitude, 0, centerY + amplitude);
    leftGrad.addColorStop(0, '#f97316');
    leftGrad.addColorStop(0.5, '#fb923c');
    leftGrad.addColorStop(1, '#f97316');
    spectrogramCtx.strokeStyle = leftGrad;
    spectrogramCtx.lineWidth = 2;
    spectrogramCtx.lineCap = 'round';
    spectrogramCtx.lineJoin = 'round';
    
    for (let x = 0; x <= width; x++) {
      const t = x / width;
      const phase = wavePhaseLeft + t * leftCycles * Math.PI * 2;
      const y = centerY + Math.sin(phase) * amplitude * 0.7;
      if (x === 0) {
        spectrogramCtx.moveTo(x, y);
      } else {
        spectrogramCtx.lineTo(x, y);
      }
    }
    spectrogramCtx.stroke();
    
    // Left glow effect
    spectrogramCtx.strokeStyle = isDark ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.2)';
    spectrogramCtx.lineWidth = 4;
    spectrogramCtx.beginPath();
    for (let x = 0; x <= width; x++) {
      const t = x / width;
      const phase = wavePhaseLeft + t * leftCycles * Math.PI * 2;
      const y = centerY + Math.sin(phase) * amplitude * 0.7;
      if (x === 0) {
        spectrogramCtx.moveTo(x, y);
      } else {
        spectrogramCtx.lineTo(x, y);
      }
    }
    spectrogramCtx.stroke();
    
    // Draw right channel waveform (cyan/blue)
    spectrogramCtx.beginPath();
    const rightGrad = spectrogramCtx.createLinearGradient(0, centerY - amplitude, 0, centerY + amplitude);
    rightGrad.addColorStop(0, '#06b6d4');
    rightGrad.addColorStop(0.5, '#22d3ee');
    rightGrad.addColorStop(1, '#06b6d4');
    spectrogramCtx.strokeStyle = rightGrad;
    spectrogramCtx.lineWidth = 2;
    
    for (let x = 0; x <= width; x++) {
      const t = x / width;
      const phase = wavePhaseRight + t * rightCycles * Math.PI * 2;
      const y = centerY + Math.sin(phase) * amplitude * 0.7;
      if (x === 0) {
        spectrogramCtx.moveTo(x, y);
      } else {
        spectrogramCtx.lineTo(x, y);
      }
    }
    spectrogramCtx.stroke();
    
    // Right glow effect
    spectrogramCtx.strokeStyle = isDark ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.2)';
    spectrogramCtx.lineWidth = 4;
    spectrogramCtx.beginPath();
    for (let x = 0; x <= width; x++) {
      const t = x / width;
      const phase = wavePhaseRight + t * rightCycles * Math.PI * 2;
      const y = centerY + Math.sin(phase) * amplitude * 0.7;
      if (x === 0) {
        spectrogramCtx.moveTo(x, y);
      } else {
        spectrogramCtx.lineTo(x, y);
      }
    }
    spectrogramCtx.stroke();
  }
  
  // Called by updateLiveInfo - ensures animation if playing
  function updateSpectrogram(leftFreq, rightFreq) {
    if (!spectrogramEnabled || !isAudioPlaying) return;
    if (!spectrogramAnimationId) {
      startSpectrogramAnimation();
    }
  }
  
  // Functions to control visualization based on audio state
  function onAudioStart() {
    isAudioPlaying = true;
    if (spectrogramEnabled) {
      startSpectrogramAnimation();
    }
  }
  
  function onAudioStop() {
    isAudioPlaying = false;
    stopSpectrogramAnimation();
    // Render idle waveform when stopped
    renderIdleWaveform();
  }
  
  function onAudioPause() {
    // Stop animating but keep last frame visible
    stopSpectrogramAnimation();
  }
  
  function onAudioResume() {
    isAudioPlaying = true;
    if (spectrogramEnabled) {
      startSpectrogramAnimation();
    }
  }

  function triggerPianoFrequency(keyEl) {
    if (!keyEl) return false;
    const freq = Number(keyEl.dataset.frequency);
    if (!Number.isFinite(freq)) return false;
    let applied = false;
    const ensurePlaying = () => {
      ensureAudio();
      if (audioCtx?.state === 'suspended') {
        audioCtx.resume().catch(()=>{});
      }
      startAudio();
      setTransportActive('play');
    };
    
    // Set flag to prevent wheel onChange from triggering auto-play again
    isProgrammaticChange = true;
    
    if (keyboardTargetsState.left) {
      wheelL.setHz(freq);
      wheelL.focus?.();
      applied = true;
    }
    if (keyboardTargetsState.right) {
      wheelR.setHz(freq);
      wheelR.focus?.();
      applied = true;
    }
    if (applied) {
      // Reset pitch bend and fine tune to default position
      pitchBendOffset = 0;
      fineTuneOffset = 0;
      fineTuneRotation = 0;
      if (typeof pitchBendScrollPos !== 'undefined') pitchBendScrollPos = 0;
      if (typeof updatePitchBendDisplay === 'function') updatePitchBendDisplay();
      if (typeof updatePitchBendScrollPosition === 'function') updatePitchBendScrollPosition();
      if (typeof updateFineTuneDisplay === 'function') updateFineTuneDisplay();
      
      ensurePlaying();
      scheduleOscillatorSync();
      keyEl.classList.add('is-triggered');
      setTimeout(() => keyEl.classList.remove('is-triggered'), 160);
      
      // Update overtones to show harmonics of this piano key
      // Defer slightly to avoid conflicts with click animation
      setTimeout(() => {
        setOvertonesFundamental(freq, keyEl);
      }, 20);
    }
    
    // Reset flag after a short delay
    setTimeout(() => { isProgrammaticChange = false; }, 100);
    
    return applied;
  }

  function handlePianoPointerDown(e) {
    const keyEl = e.target.closest('.piano-key');
    if (!keyEl || !pianoKeyboardEl?.contains(keyEl)) return;
    e.preventDefault();
    triggerPianoFrequency(keyEl);
  }

  function handlePianoKeydown(e) {
    const keyEl = e.target.closest('.piano-key');
    if (!keyEl || !pianoKeyboardEl?.contains(keyEl)) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerPianoFrequency(keyEl);
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const baseStep = e.altKey ? KEYBOARD_STEP_FINE : (e.shiftKey ? KEYBOARD_STEP_COARSE : KEYBOARD_STEP_DEFAULT);
      const delta = e.key === 'ArrowUp' ? baseStep : -baseStep;
      nudgeSelectedWheels(delta);
    }
  }

  function getActiveTargetWheels() {
    const targets = [];
    if (keyboardTargetsState.left) targets.push(wheelL);
    if (keyboardTargetsState.right) targets.push(wheelR);
    return targets;
  }

  function nudgeSelectedWheels(deltaHz) {
    if (!deltaHz) return;
    let applied = false;
    getActiveTargetWheels().forEach(w => {
      if (w?.nudge) {
        w.nudge(deltaHz);
        applied = true;
      }
    });
    if (applied) scheduleOscillatorSync();
  }

  const presetSelect = document.getElementById('presetSelect');
  let isApplyingPreset = false;
  let isProgrammaticChange = false; // Track programmatic changes (piano keys, reset)
  
  presetSelect?.addEventListener('change', () => {
    const presetIndex = parseInt(presetSelect.value);
    if (!isNaN(presetIndex) && presetIndex >= 0 && presetIndex < PRESETS.length) {
      const preset = PRESETS[presetIndex];
      isApplyingPreset = true;
      isProgrammaticChange = true;
      wheelL.setHz(preset.left);
      wheelR.setHz(preset.right);
      
      // Clear binaural preset selection
      const binauralPresetSelect = document.getElementById('binauralPresetSelect');
      if (binauralPresetSelect) binauralPresetSelect.value = '';
      
      // Start playing audio automatically (like piano keys)
      ensureAudio();
      if (audioCtx?.state === 'suspended') {
        audioCtx.resume().catch(()=>{});
      }
      startAudio();
      setTransportActive('play');
      
      scheduleOscillatorSync();
      // Reset flags after a short delay to allow wheel changes to complete
      setTimeout(() => { 
        isApplyingPreset = false;
        isProgrammaticChange = false;
      }, 100);
    }
  });

  // Binaural Beats Presets - using lower fundamental frequencies for better sound experience
  const binauralPresetSelect = document.getElementById('binauralPresetSelect');
  const BINAURAL_PRESETS = {
    'delta1': { left: 80, right: 81, name: 'Deep Sleep' },
    'delta2': { left: 90, right: 92, name: 'Sleep' },
    'delta3': { left: 100, right: 103, name: 'Lucid Dreams' },
    'theta5': { left: 110, right: 115, name: 'Deep Meditation' },
    'theta6': { left: 120, right: 126, name: 'Meditation' },
    'theta7': { left: 130, right: 137, name: 'Creativity' },
    'alpha8': { left: 140, right: 148, name: 'Light Relaxation' },
    'alpha10': { left: 150, right: 160, name: 'Calm Focus' },
    'alpha12': { left: 160, right: 172, name: 'Relaxed Alert' },
    'beta15': { left: 170, right: 185, name: 'Mental Clarity' },
    'beta18': { left: 180, right: 198, name: 'Focus' },
    'beta20': { left: 190, right: 210, name: 'Concentration' },
    'beta25': { left: 200, right: 225, name: 'High Alert' },
    'gamma40': { left: 210, right: 250, name: 'Peak Performance' }
  };
  
  binauralPresetSelect?.addEventListener('change', () => {
    const presetKey = binauralPresetSelect.value;
    if (presetKey && BINAURAL_PRESETS[presetKey]) {
      const preset = BINAURAL_PRESETS[presetKey];
      isApplyingPreset = true;
      isProgrammaticChange = true;
      wheelL.setHz(preset.left);
      wheelR.setHz(preset.right);
      
      // Clear musical preset selection
      if (presetSelect) presetSelect.value = '';
      
      // Start playing audio automatically
      ensureAudio();
      if (audioCtx?.state === 'suspended') {
        audioCtx.resume().catch(()=>{});
      }
      startAudio();
      setTransportActive('play');
      
      scheduleOscillatorSync();
      // Reset flags after a short delay to allow wheel changes to complete
      setTimeout(() => { 
        isApplyingPreset = false;
        isProgrammaticChange = false;
      }, 100);
    }
  });

  wheelL.setOnChange(() => { 
    if (!isApplyingPreset) {
      if (presetSelect) presetSelect.value = '';
      if (binauralPresetSelect) binauralPresetSelect.value = '';
    }
    
    // Auto-play when user interacts directly with wheels
    if (!isProgrammaticChange) {
      ensureAudio();
      if (audioCtx?.state === 'suspended') {
        audioCtx.resume().catch(()=>{});
      }
      startAudio();
      setTransportActive('play');
    }
    
    scheduleOscillatorSync();
  });
  wheelR.setOnChange(() => { 
    if (!isApplyingPreset) {
      if (presetSelect) presetSelect.value = '';
      if (binauralPresetSelect) binauralPresetSelect.value = '';
    }
    
    // Auto-play when user interacts directly with wheels
    if (!isProgrammaticChange) {
      ensureAudio();
      if (audioCtx?.state === 'suspended') {
        audioCtx.resume().catch(()=>{});
      }
      startAudio();
      setTransportActive('play');
    }
    
    scheduleOscillatorSync();
  });

  // Pan control functionality
  function setPan(wheelId, panValue) {
    // panValue is -100 to +100, convert to -1 to +1
    const pan = panValue / 100;
    
    if (wheelId === 'wheelL') {
      wheelLPan = pan;
    } else if (wheelId === 'wheelR') {
      wheelRPan = pan;
    }
    updateOscillators();
    updatePanValues();
  }

  function updatePanValues() {
    // Update pan value displays
    const wheelLValue = document.querySelector('[data-wheel="wheelL"].pan-value');
    const wheelRValue = document.querySelector('[data-wheel="wheelR"].pan-value');
    
    if (wheelLValue) {
      wheelLValue.textContent = formatPanValue(wheelLPan);
    }
    if (wheelRValue) {
      wheelRValue.textContent = formatPanValue(wheelRPan);
    }
  }
  
  function formatPanValue(pan) {
    if (pan < -0.8) return 'L';
    if (pan > 0.8) return 'R';
    if (Math.abs(pan) < 0.1) return 'C';
    if (pan < 0) return `L${Math.round(Math.abs(pan) * 100)}`;
    return `R${Math.round(pan * 100)}`;
  }

  // Set up pan slider event handlers
  document.querySelectorAll('.pan-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const wheelId = slider.dataset.wheel;
      const panValue = parseInt(e.target.value, 10);
      setPan(wheelId, panValue);
    });
  });

  // Initialize pan value displays
  updatePanValues();

  // Mute functionality
  function toggleMute(wheelId) {
    // Prevent toggling wheel mute while overtones are active
    // (wheels are force-muted when overtones are playing)
    if (showOvertoneHighlights) {
      return;
    }
    
    if (wheelId === 'wheelL') {
      wheelLMuted = !wheelLMuted;
    } else if (wheelId === 'wheelR') {
      wheelRMuted = !wheelRMuted;
    }
    updateOscillators();
    updateMuteButtons();
  }

  function updateMuteButtons() {
    // Update mute button for wheelL
    const wheelLMuteBtn = document.querySelector('[data-wheel="wheelL"].mute-btn');
    if (wheelLMuteBtn) {
      const icon = wheelLMuteBtn.querySelector('.mute-icon');
      const text = wheelLMuteBtn.querySelector('.mute-text');
      
      // Add/remove disabled state when overtones are active
      if (showOvertoneHighlights) {
        wheelLMuteBtn.style.opacity = '0.5';
        wheelLMuteBtn.style.cursor = 'not-allowed';
        wheelLMuteBtn.title = 'Mute controls disabled while Overtones are active';
      } else {
        wheelLMuteBtn.style.opacity = '';
        wheelLMuteBtn.style.cursor = '';
        wheelLMuteBtn.title = '';
      }
      
      if (wheelLMuted) {
        icon.textContent = '🔇';
        text.textContent = 'Unmute';
        wheelLMuteBtn.classList.add('muted');
      } else {
        icon.textContent = '🔊';
        text.textContent = 'Mute';
        wheelLMuteBtn.classList.remove('muted');
      }
    }

    // Update mute button for wheelR
    const wheelRMuteBtn = document.querySelector('[data-wheel="wheelR"].mute-btn');
    if (wheelRMuteBtn) {
      const icon = wheelRMuteBtn.querySelector('.mute-icon');
      const text = wheelRMuteBtn.querySelector('.mute-text');
      
      // Add/remove disabled state when overtones are active
      if (showOvertoneHighlights) {
        wheelRMuteBtn.style.opacity = '0.5';
        wheelRMuteBtn.style.cursor = 'not-allowed';
        wheelRMuteBtn.title = 'Mute controls disabled while Overtones are active';
      } else {
        wheelRMuteBtn.style.opacity = '';
        wheelRMuteBtn.style.cursor = '';
        wheelRMuteBtn.title = '';
      }
      
      if (wheelRMuted) {
        icon.textContent = '🔇';
        text.textContent = 'Unmute';
        wheelRMuteBtn.classList.add('muted');
      } else {
        icon.textContent = '🔊';
        text.textContent = 'Mute';
        wheelRMuteBtn.classList.remove('muted');
      }
    }
  }

  // Set up mute button event handlers
  document.querySelectorAll('.mute-btn').forEach(btn => {
    if (btn.id === 'monoMuteBtn') return; // Handle mono separately
    btn.addEventListener('click', () => {
      const wheelId = btn.dataset.wheel;
      toggleMute(wheelId);
    });
  });

  // Initialize mute button states
  updateMuteButtons();

  // Build piano keyboard visualization
  buildPianoKeyboard();
  updateKeyboardHighlights();
  
  // Initialize live info display
  updateLiveInfo();

  // ===== OVERTONES FUNCTIONALITY =====
  const overtonesDisplay = document.getElementById('overtonesDisplay');
  const overtonesContainer = document.getElementById('overtonesContainer');
  const overtonesReplayBtn = document.getElementById('overtonesReplay');
  // currentOvertonesFundamental is declared earlier to avoid TDZ issues
  let activeOvertoneKey = null; // Track which piano key is active for overtones
  
  // Harmonic audio state
  let harmonicOscillators = []; // Array of 16 oscillator objects
  let harmonicMutedState = Array(16).fill(false); // Track mute state for each harmonic (false = unmuted)
  let harmonicVolumes = Array(16).fill(50); // Track volume for each harmonic (1-100, default 50%)
  let harmonicPans = Array(16).fill(0); // Track pan for each harmonic (-100 to +100, default 0 = center)
  let harmonicsPlaying = false; // Track if harmonics are currently playing
  let harmonicSequenceTimeouts = []; // Track timeouts for sequential harmonic playback
  let harmonicActiveStates = Array(16).fill(false); // Track which harmonics are currently active (unmuted in sequence)
  
  // Filter toggle elements and state
  const harmonicOnlyToggle = document.getElementById('harmonicOnlyToggle');
  const dissonantOnlyToggle = document.getElementById('dissonantOnlyToggle');
  let harmonicFilterMode = 'all'; // 'all', 'harmonic', 'dissonant'
  
  // Define which harmonics are consonant (harmonic) vs dissonant
  // Harmonic indices (0-based): 
  // - Consonant: 0 (Fundamental), 1 (Octave), 2 (Perfect Fifth), 3 (Octave), 4 (Major Third), 
  //              5 (Perfect Fifth), 7 (Octave), 11 (Perfect Fifth), 15 (Octave)
  // - Dissonant: 6 (Flatted Seventh), 8 (Major Second), 10 (Augmented Fourth), 
  //              12 (Minor Sixth), 13 (Flatted Seventh), 14 (Major Seventh)
  // Note: Harmonic 9 (Major Third) is borderline but generally consonant
  const CONSONANT_HARMONICS = [0, 1, 2, 3, 4, 5, 7, 9, 11, 15]; // Fundamental, Octaves, Fifths, Thirds
  const DISSONANT_HARMONICS = [6, 8, 10, 12, 13, 14]; // 7ths, 2nds, Tritone, Minor 6th
  
  // Check if a harmonic should be muted based on filter mode
  function isHarmonicFilteredOut(harmonicIndex) {
    if (harmonicFilterMode === 'all') return false;
    if (harmonicFilterMode === 'harmonic') {
      return !CONSONANT_HARMONICS.includes(harmonicIndex);
    }
    if (harmonicFilterMode === 'dissonant') {
      return !DISSONANT_HARMONICS.includes(harmonicIndex);
    }
    return false;
  }
  
  // Apply harmonic filter - mute/unmute based on current filter mode
  function applyHarmonicFilter() {
    for (let i = 0; i < 16; i++) {
      const shouldBeFilteredOut = isHarmonicFilteredOut(i);
      const wasManuallyMuted = harmonicMutedState[i];
      
      // Update gain based on filter
      const harmonic = harmonicOscillators[i];
      if (harmonic && harmonic.gain && audioCtx && harmonicActiveStates[i]) {
        const shouldBeMuted = shouldBeFilteredOut || wasManuallyMuted;
        const userGain = getHarmonicGain(i);
        const targetGain = shouldBeMuted ? 0 : userGain;
        try {
          harmonic.gain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.03);
        } catch {
          harmonic.gain.gain.value = targetGain;
        }
      }
      
      // Update card visual
      const card = overtonesDisplay?.querySelector(`[data-harmonic="${i + 1}"]`);
      if (card) {
        if (shouldBeFilteredOut) {
          card.classList.add('is-filtered-out');
        } else {
          card.classList.remove('is-filtered-out');
        }
      }
    }
    
    // Update piano key highlights
    updateOvertoneHighlights();
  }
  
  // Toggle filter mode handlers
  if (harmonicOnlyToggle) {
    harmonicOnlyToggle.addEventListener('click', () => {
      if (harmonicFilterMode === 'harmonic') {
        // Turn off filter
        harmonicFilterMode = 'all';
        harmonicOnlyToggle.classList.remove('is-active');
      } else {
        // Turn on harmonic filter, turn off dissonant
        harmonicFilterMode = 'harmonic';
        harmonicOnlyToggle.classList.add('is-active');
        dissonantOnlyToggle?.classList.remove('is-active');
      }
      applyHarmonicFilter();
    });
  }
  
  if (dissonantOnlyToggle) {
    dissonantOnlyToggle.addEventListener('click', () => {
      if (harmonicFilterMode === 'dissonant') {
        // Turn off filter
        harmonicFilterMode = 'all';
        dissonantOnlyToggle.classList.remove('is-active');
      } else {
        // Turn on dissonant filter, turn off harmonic
        harmonicFilterMode = 'dissonant';
        dissonantOnlyToggle.classList.add('is-active');
        harmonicOnlyToggle?.classList.remove('is-active');
      }
      applyHarmonicFilter();
    });
  }
  
  // Replay harmonic sequence function
  function replayHarmonicSequence() {
    if (!showOvertoneHighlights || !currentOvertonesFundamental || currentOvertonesFundamental <= 0) return;
    
    // Add visual feedback to replay button
    if (overtonesReplayBtn) {
      overtonesReplayBtn.classList.add('is-replaying');
      setTimeout(() => {
        overtonesReplayBtn.classList.remove('is-replaying');
      }, 500);
    }
    
    // Clear any pending sequence timeouts
    harmonicSequenceTimeouts.forEach(timeout => clearTimeout(timeout));
    harmonicSequenceTimeouts = [];
    
    // Remove visual playing classes from all cards
    overtonesDisplay?.querySelectorAll('.overtone-card').forEach(card => {
      card.classList.remove('is-playing');
    });
    
    // Reset active states
    harmonicActiveStates = Array(16).fill(false);
    
    // Mute all harmonics first
    harmonicOscillators.forEach(harmonic => {
      if (harmonic && harmonic.gain && audioCtx) {
        try {
          harmonic.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.01);
        } catch {
          harmonic.gain.gain.value = 0;
        }
      }
    });
    
    // Start the sequential playback - skip muted/filtered harmonics
    const sequenceDelay = 300; // 300ms between each playable harmonic
    let playableIndex = 0; // Track delay for playable harmonics only
    
    for (let i = 0; i < 16; i++) {
      const isFilteredOut = isHarmonicFilteredOut(i);
      const isMuted = harmonicMutedState[i];
      const willPlay = !isMuted && !isFilteredOut;
      
      // Calculate delay based on playable harmonics count, not index
      const delay = willPlay ? playableIndex * sequenceDelay : 0;
      
      const timeoutId = setTimeout(() => {
        if (!harmonicsPlaying || !showOvertoneHighlights) return;
        
        const harmonic = harmonicOscillators[i];
        
        // Mark as active so it can be unmuted if filter changes
        harmonicActiveStates[i] = true;
        
        if (harmonic && harmonic.started && willPlay) {
          const userGain = getHarmonicGain(i);
          try {
            harmonic.gain.gain.linearRampToValueAtTime(userGain, audioCtx.currentTime + 0.05);
          } catch {
            harmonic.gain.gain.value = userGain;
          }
          
          const card = overtonesDisplay?.querySelector(`[data-harmonic="${i + 1}"]`);
          if (card) {
            card.classList.add('is-playing');
          }
        }
      }, delay);
      
      harmonicSequenceTimeouts.push(timeoutId);
      
      // Only increment playable index for harmonics that will play
      if (willPlay) {
        playableIndex++;
      }
    }
  }
  
  // Update replay button active state
  function updateReplayButtonState() {
    if (overtonesReplayBtn) {
      if (showOvertoneHighlights && currentOvertonesFundamental > 0 && harmonicsPlaying) {
        overtonesReplayBtn.classList.add('is-active');
      } else {
        overtonesReplayBtn.classList.remove('is-active');
      }
    }
  }
  
  // Attach replay button event listener
  if (overtonesReplayBtn) {
    overtonesReplayBtn.addEventListener('click', replayHarmonicSequence);
  }
  
  // Interval names for each harmonic (matching the example)
  const INTERVAL_NAMES = [
    'Fundamental', 'Octave', 'Perfect Fifth', 'Octave', 'Major Third',
    'Perfect Fifth', 'Flatted Seventh', 'Octave', 'Major Second', 'Major Third',
    'Augmented Fourth', 'Perfect Fifth', 'Minor Sixth', 'Flatted Seventh',
    'Major Seventh', 'Octave'
  ];
  
  // Generate color for each harmonic based on its position
  function getHarmonicColor(harmonicNumber) {
    const hue = (harmonicNumber - 1) * 22.5; // Distribute across color wheel
    return {
      primary: `hsl(${hue}, 65%, 55%)`,
      light: `hsl(${hue + 20}, 70%, 65%)`
    };
  }
  
  // Calculate gain for a harmonic based on user-set volume (1-100%)
  function getHarmonicGain(harmonicIndex) {
    const volumePercent = harmonicVolumes[harmonicIndex];
    const baseGain = 0.3; // Maximum volume per harmonic
    return baseGain * (volumePercent / 100);
  }
  
  // Create harmonic oscillators
  function createHarmonicOscillators() {
    if (!audioCtx) {
      ensureAudio();
    }
    
    // Stop existing oscillators if any
    stopHarmonicOscillators();
    
    harmonicOscillators = [];
    harmonicActiveStates = Array(16).fill(false); // Reset active states
    
    for (let i = 0; i < 16; i++) {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      
      const gain = audioCtx.createGain();
      // Start all harmonics with gain = 0, they'll be unmuted sequentially
      gain.gain.value = 0;
      
      const panner = audioCtx.createStereoPanner();
      panner.pan.value = harmonicPans[i] / 100; // Convert -100..100 to -1..1
      
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(audioCtx.destination);
      
      harmonicOscillators.push({ osc, gain, panner, started: false, harmonicIndex: i });
    }
  }
  
  // Start harmonic oscillators with sequential 200ms delay between each
  function startHarmonicOscillators() {
    if (!audioCtx || !currentOvertonesFundamental || currentOvertonesFundamental <= 0) return;
    
    ensureAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(()=>{});
    }
    
    // Clear any existing sequence timeouts
    harmonicSequenceTimeouts.forEach(timeout => clearTimeout(timeout));
    harmonicSequenceTimeouts = [];
    
    // Create oscillators if they don't exist
    if (harmonicOscillators.length === 0) {
      createHarmonicOscillators();
    }
    
    const t = audioCtx.currentTime + 0.01;
    const sequenceDelay = 300; // 200ms between each harmonic
    
    // Start all oscillators immediately but muted
    for (let i = 0; i < 16; i++) {
      const harmonicFreq = currentOvertonesFundamental * (i + 1);
      const harmonic = harmonicOscillators[i];
      
      if (harmonic && !harmonic.started) {
        harmonic.osc.frequency.value = harmonicFreq;
        harmonic.gain.gain.value = 0; // Start muted
        harmonic.osc.start(t);
        harmonic.started = true;
      } else if (harmonic && harmonic.started) {
        // Update frequency if already started
        setFreq(harmonic.osc, harmonicFreq);
      }
    }
    
    harmonicsPlaying = true;
    updateReplayButtonState();
    
    // Unmute each harmonic sequentially - skip muted/filtered harmonics
    let playableIndex = 0; // Track delay for playable harmonics only
    
    for (let i = 0; i < 16; i++) {
      const isFilteredOut = isHarmonicFilteredOut(i);
      const isMuted = harmonicMutedState[i];
      const willPlay = !isMuted && !isFilteredOut;
      
      // Calculate delay based on playable harmonics count, not index
      const delay = willPlay ? playableIndex * sequenceDelay : 0;
      
      const timeoutId = setTimeout(() => {
        if (!harmonicsPlaying) return; // Stop if playback was cancelled
        
        const harmonic = harmonicOscillators[i];
        
        // Mark this harmonic as active so it can be unmuted if filter changes
        harmonicActiveStates[i] = true;
        
        if (harmonic && harmonic.started && willPlay) {
          const userGain = getHarmonicGain(i);
          // Smooth fade in
          try {
            harmonic.gain.gain.linearRampToValueAtTime(userGain, audioCtx.currentTime + 0.05);
          } catch {
            harmonic.gain.gain.value = userGain;
          }
          
          // Visual feedback - add playing class to the overtone card
          const card = overtonesDisplay?.querySelector(`[data-harmonic="${i + 1}"]`);
          if (card) {
            card.classList.add('is-playing');
          }
        }
      }, delay);
      
      harmonicSequenceTimeouts.push(timeoutId);
      
      // Only increment playable index for harmonics that will play
      if (willPlay) {
        playableIndex++;
      }
    }
  }
  
  // Stop harmonic oscillators
  function stopHarmonicOscillators() {
    // Clear any pending sequence timeouts
    harmonicSequenceTimeouts.forEach(timeout => clearTimeout(timeout));
    harmonicSequenceTimeouts = [];
    
    // Remove visual playing classes from all cards
    overtonesDisplay?.querySelectorAll('.overtone-card').forEach(card => {
      card.classList.remove('is-playing');
    });
    
    harmonicOscillators.forEach(harmonic => {
      if (harmonic && harmonic.started) {
        try {
          harmonic.osc.stop();
        } catch (e) {
          // Already stopped
        }
      }
    });
    
    harmonicOscillators = [];
    harmonicsPlaying = false;
    harmonicActiveStates = Array(16).fill(false);
    updateReplayButtonState();
  }
  
  // Update harmonic frequencies when fundamental changes
  function updateHarmonicFrequencies() {
    if (!harmonicsPlaying || !currentOvertonesFundamental || currentOvertonesFundamental <= 0) return;
    
    for (let i = 0; i < 16; i++) {
      const harmonicFreq = currentOvertonesFundamental * (i + 1);
      const harmonic = harmonicOscillators[i];
      
      if (harmonic && harmonic.started) {
        setFreq(harmonic.osc, harmonicFreq);
      }
    }
  }
  
  // Toggle mute state for a specific harmonic
  function toggleHarmonicMute(harmonicIndex) {
    if (harmonicIndex < 0 || harmonicIndex >= 16) return;
    
    // Toggle mute state
    harmonicMutedState[harmonicIndex] = !harmonicMutedState[harmonicIndex];
    
    // Update gain - only if harmonic has been activated in the sequence
    const harmonic = harmonicOscillators[harmonicIndex];
    if (harmonic && harmonic.gain && audioCtx && harmonicActiveStates[harmonicIndex]) {
      const now = audioCtx.currentTime;
      const userGain = getHarmonicGain(harmonicIndex);
      const isMuted = harmonicMutedState[harmonicIndex] || isHarmonicFilteredOut(harmonicIndex);
      const targetGain = isMuted ? 0 : userGain;
      try {
        harmonic.gain.gain.setTargetAtTime(targetGain, now, 0.015);
      } catch {
        harmonic.gain.gain.value = targetGain;
      }
    }
    
    // Update card visual state
    updateHarmonicCardMuteState(harmonicIndex);
    
    // Update piano key highlights to reflect muted state
    updateOvertoneHighlights();
  }
  
  // Update card visual state for mute
  function updateHarmonicCardMuteState(harmonicIndex) {
    const card = overtonesDisplay?.querySelector(`[data-harmonic="${harmonicIndex + 1}"]`);
    if (!card) return;
    
    const muteIndicator = card.querySelector('.overtone-mute-indicator');
    
    if (harmonicMutedState[harmonicIndex]) {
      card.classList.add('is-muted');
      if (muteIndicator) muteIndicator.textContent = '🔇';
    } else {
      card.classList.remove('is-muted');
      if (muteIndicator) muteIndicator.textContent = '🔊';
    }
  }
  
  // Update harmonic volume
  function updateHarmonicVolume(harmonicIndex, newVolume) {
    if (harmonicIndex < 0 || harmonicIndex >= 16) return;
    
    // Clamp volume to 1-100%
    const clampedVolume = Math.max(1, Math.min(100, newVolume));
    harmonicVolumes[harmonicIndex] = clampedVolume;
    
    // Update audio gain - only if harmonic has been activated in the sequence
    const harmonic = harmonicOscillators[harmonicIndex];
    if (harmonic && harmonic.gain && audioCtx && harmonicActiveStates[harmonicIndex]) {
      const now = audioCtx.currentTime;
      const userGain = getHarmonicGain(harmonicIndex);
      const isMuted = harmonicMutedState[harmonicIndex] || isHarmonicFilteredOut(harmonicIndex);
      const targetGain = isMuted ? 0 : userGain;
      try {
        harmonic.gain.gain.setTargetAtTime(targetGain, now, 0.015);
      } catch {
        harmonic.gain.gain.value = targetGain;
      }
    }
    
    // Update visual feedback
    const card = overtonesDisplay?.querySelector(`[data-harmonic="${harmonicIndex + 1}"]`);
    if (card) {
      card.style.setProperty('--volume-fill', (clampedVolume / 100).toFixed(3));
      const volumeLabel = card.querySelector('.overtone-volume-label');
      if (volumeLabel) {
        volumeLabel.textContent = `${clampedVolume}%`;
      }
    }
  }
  
  // Update harmonic pan
  function updateHarmonicPan(harmonicIndex, newPan) {
    if (harmonicIndex < 0 || harmonicIndex >= 16) return;
    
    // Clamp pan to -100..100
    const clampedPan = Math.max(-100, Math.min(100, newPan));
    harmonicPans[harmonicIndex] = clampedPan;
    
    // Update audio panner
    const harmonic = harmonicOscillators[harmonicIndex];
    if (harmonic && harmonic.panner && audioCtx) {
      const now = audioCtx.currentTime;
      const panValue = clampedPan / 100; // Convert to -1..1
      try {
        harmonic.panner.pan.setTargetAtTime(panValue, now, 0.015);
      } catch {
        harmonic.panner.pan.value = panValue;
      }
    }
  }
  
  // Generate overtone cards for a given fundamental frequency
  function generateOvertones(fundamentalHz) {
    if (!overtonesDisplay) return;
    
    currentOvertonesFundamental = fundamentalHz;
    overtonesDisplay.innerHTML = '';
    
    if (!fundamentalHz || fundamentalHz <= 0) {
      overtonesDisplay.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted);">Play a piano key to see its overtones</div>';
      stopHarmonicOscillators();
      return;
    }
    
    // Stop existing harmonics and create new ones
    stopHarmonicOscillators();
    createHarmonicOscillators();
    
    // Only start playing harmonics if Show Overtones is enabled
    if (showOvertoneHighlights) {
      startHarmonicOscillators();
    }
    
    for (let i = 1; i <= 16; i++) {
      const freq = fundamentalHz * i;
      const noteData = frequencyToNote(freq);
      const colors = getHarmonicColor(i);
      const harmonicIndex = i - 1;
      
      // Get detailed frequency info for Hz offset and cents
      const detailInfo = getDetailedFreqInfo(freq);
      const hzOffsetStr = detailInfo ? `${detailInfo.hzOffset >= 0 ? '+' : ''}${detailInfo.hzOffset.toFixed(1)} Hz` : '—';
      const centsStr = detailInfo ? `${detailInfo.cents >= 0 ? '+' : ''}${detailInfo.cents}¢` : '—';
      
      const card = document.createElement('div');
      card.className = 'overtone-card';
      card.dataset.harmonic = i;
      card.style.setProperty('--overtone-color', colors.primary);
      card.style.setProperty('--overtone-color-light', colors.light);
      
      // Apply muted state if this harmonic is muted
      if (harmonicMutedState[harmonicIndex]) {
        card.classList.add('is-muted');
      }
      
      // Apply filtered-out state based on current filter mode
      if (isHarmonicFilteredOut(harmonicIndex)) {
        card.classList.add('is-filtered-out');
      }
      
      // Set initial volume gradient fill
      const volumePercent = harmonicVolumes[harmonicIndex];
      card.style.setProperty('--volume-fill', (volumePercent / 100).toFixed(3));
      
      card.innerHTML = `
        <div class="overtone-volume-fill"></div>
        <div class="overtone-content">
          <div class="overtone-mute-indicator">🔊</div>
          <div class="overtone-number">Harmonic ${i}</div>
          <div class="overtone-note-name">${noteData.note === 'BELOW_HEARING' ? '🔇' : noteData.note}</div>
          <div class="overtone-interval-name">${INTERVAL_NAMES[i - 1] || `Partial ${i}`}</div>
          <div class="overtone-frequency">${freq.toFixed(1)} Hz</div>
          <div class="overtone-deviation">
            <span class="overtone-hz-offset">${hzOffsetStr}</span>
            <span class="overtone-cents">${centsStr}</span>
          </div>
          <div class="overtone-volume-label">${volumePercent}%</div>
        </div>
        <div class="overtone-pan-control">
          <span class="overtone-pan-label-l">L</span>
          <input type="range" class="overtone-pan-slider" min="-100" max="100" value="${harmonicPans[harmonicIndex]}" step="1">
          <span class="overtone-pan-label-r">R</span>
        </div>
      `;
      
      // Add click handler for mute/unmute on the content area
      const contentArea = card.querySelector('.overtone-content');
      contentArea.title = 'Click to mute/unmute • Scroll to adjust volume';
      contentArea.addEventListener('click', (e) => {
        // Don't toggle mute if clicking on volume label
        if (!e.target.classList.contains('overtone-volume-label')) {
          toggleHarmonicMute(harmonicIndex);
        }
      });
      
      // Add mouse wheel handler for volume control
      card.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY || e.deltaX;
        const change = delta > 0 ? -5 : 5; // Decrease on scroll down, increase on scroll up
        updateHarmonicVolume(harmonicIndex, harmonicVolumes[harmonicIndex] + change);
      }, { passive: false });
      
      // Add pan slider handler
      const panSlider = card.querySelector('.overtone-pan-slider');
      panSlider.addEventListener('input', (e) => {
        e.stopPropagation(); // Prevent triggering mute
        const panValue = parseInt(e.target.value, 10);
        updateHarmonicPan(harmonicIndex, panValue);
      });
      
      panSlider.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering mute
      });
      
      overtonesDisplay.appendChild(card);
    }
  }
  
  // Throttle function for smooth updates during rapid changes
  let updateOvertonesTimeout = null;
  let lastOvertoneUpdate = 0;
  const OVERTONE_UPDATE_THROTTLE = 16; // ~60fps
  
  // Update overtones when fundamental changes (from fine tune)
  function updateOvertones() {
    if (!currentOvertonesFundamental || currentOvertonesFundamental <= 0) return;
    
    // Throttle rapid updates to prevent layout thrashing
    const now = Date.now();
    const timeSinceLastUpdate = now - lastOvertoneUpdate;
    
    if (timeSinceLastUpdate < OVERTONE_UPDATE_THROTTLE) {
      // Too soon, schedule for later
      if (updateOvertonesTimeout) {
        clearTimeout(updateOvertonesTimeout);
      }
      updateOvertonesTimeout = setTimeout(() => {
        updateOvertones();
      }, OVERTONE_UPDATE_THROTTLE - timeSinceLastUpdate);
      return;
    }
    
    lastOvertoneUpdate = now;
    
    // Update card displays
    for (let i = 1; i <= 16; i++) {
      const card = overtonesDisplay?.querySelector(`[data-harmonic="${i}"]`);
      if (!card) continue;
      
      const freq = currentOvertonesFundamental * i;
      const noteData = frequencyToNote(freq);
      const detailInfo = getDetailedFreqInfo(freq);
      
      const noteNameEl = card.querySelector('.overtone-note-name');
      const frequencyEl = card.querySelector('.overtone-frequency');
      const hzOffsetEl = card.querySelector('.overtone-hz-offset');
      const centsEl = card.querySelector('.overtone-cents');
      
      if (noteNameEl) {
        noteNameEl.textContent = noteData.note === 'BELOW_HEARING' ? '🔇' : noteData.note;
      }
      if (frequencyEl) {
        frequencyEl.textContent = `${freq.toFixed(1)} Hz`;
      }
      if (hzOffsetEl) {
        hzOffsetEl.textContent = detailInfo ? `${detailInfo.hzOffset >= 0 ? '+' : ''}${detailInfo.hzOffset.toFixed(1)} Hz` : '—';
      }
      if (centsEl) {
        centsEl.textContent = detailInfo ? `${detailInfo.cents >= 0 ? '+' : ''}${detailInfo.cents}¢` : '—';
      }
    }
    
    // Only update harmonic frequencies if overtones are enabled
    if (showOvertoneHighlights) {
      updateHarmonicFrequencies();
    }
    
    // Update overtone highlights on piano keys (already throttled internally)
    updateOvertoneHighlights();
  }
  
  // Clear overtone highlights from piano keys
  function clearOvertoneHighlights() {
    pianoKeys.forEach(key => {
      if (key.element) {
        key.element.classList.remove('is-overtone');
        key.element.style.removeProperty('--overtone-highlight');
        key.element.style.removeProperty('--overtone-opacity');
        key.element.removeAttribute('data-overtone-count');
        
        // Force background reset by removing inline style
        // (needed because overtone styles use !important)
        if (key.element.style.background) {
          key.element.style.removeProperty('background');
        }
      }
    });
    
    // Clear frequency labels
    clearFreqLabels();
  }
  
  // Clear all frequency labels from above the piano keys
  function clearFreqLabels() {
    if (freqLabelsLayer) {
      freqLabelsLayer.innerHTML = '';
    }
    freqLabelMap.clear();
  }
  
  // Format cents for display (just the cents portion)
  function formatCentsOnly(cents) {
    if (cents === 0) return '0¢';
    return cents > 0 ? `+${cents}¢` : `${cents}¢`;
  }
  
  // Calculate the exact frequency of a MIDI note number
  function midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  
  // Get detailed frequency info for labels
  function getDetailedFreqInfo(frequency) {
    if (!Number.isFinite(frequency) || frequency <= 0) return null;
    if (frequency < 15) return null;
    
    const A4 = 440;
    const A4_MIDI = 69;
    const noteNumber = 12 * Math.log2(frequency / A4) + A4_MIDI;
    const baseMidi = Math.floor(noteNumber);
    const cents = Math.round((noteNumber - baseMidi) * 100);
    const exactNoteFreq = midiToFrequency(baseMidi);
    const hzOffset = frequency - exactNoteFreq;
    
    return {
      frequency: frequency,
      exactNoteFreq: exactNoteFreq,
      hzOffset: hzOffset,
      cents: cents
    };
  }
  
  // Create a single frequency label above a piano key
  function createSingleFreqLabel(keyElement, frequency, color, side = null) {
    if (!freqLabelsLayer || !keyElement || !keyElement.isConnected) return;
    
    const keyboardInner = pianoKeyboardEl?.querySelector('.piano-keyboard-inner');
    if (!keyboardInner) return;
    
    const keyboardRect = keyboardInner.getBoundingClientRect();
    const keyRect = keyElement.getBoundingClientRect();
    const relativeLeft = keyRect.left - keyboardRect.left + (keyRect.width / 2);
    
    // Use frequencyToNote to get the same calculation as LIVE INFO
    const noteInfo = frequencyToNote(frequency);
    if (noteInfo.note === '—' || noteInfo.note === 'BELOW_HEARING') return;
    
    // Get detailed frequency info
    const detailInfo = getDetailedFreqInfo(frequency);
    
    // Create label element with multi-line info
    const label = document.createElement('div');
    label.className = 'piano-freq-label';
    
    if (detailInfo) {
      // In overtone mode, only show Hz offset (simpler label for multiple close notes)
      if (showOvertoneHighlights) {
        const offsetStr = (detailInfo.hzOffset >= 0 ? '+' : '') + detailInfo.hzOffset.toFixed(1) + ' Hz';
        label.innerHTML = `<span class="freq-label-offset">${offsetStr}</span>`;
      } else {
        // Format: actual freq, Hz offset, cents
        const freqStr = detailInfo.frequency.toFixed(2) + ' Hz';
        const offsetStr = (detailInfo.hzOffset >= 0 ? '+' : '') + detailInfo.hzOffset.toFixed(1) + ' Hz';
        const centsStr = formatCentsOnly(detailInfo.cents);
        
        label.innerHTML = `<span class="freq-label-hz">${freqStr}</span><span class="freq-label-offset">${offsetStr}</span><span class="freq-label-cents">${centsStr}</span>`;
      }
    } else {
      label.textContent = showOvertoneHighlights ? '0 Hz' : formatCentsOnly(noteInfo.cents);
    }
    
    label.style.setProperty('--label-left', `${relativeLeft}px`);
    if (color) {
      label.style.setProperty('--label-color', color);
    }
    if (side) {
      label.classList.add(`label-${side}`);
    }
    
    // Check if it's a black key
    if (keyElement.classList.contains('black-key')) {
      label.classList.add('for-black-key');
    }
    
    freqLabelsLayer.appendChild(label);
    freqLabelMap.set(keyElement, label);
  }
  
  // Create frequency labels for wheel frequencies (non-overtone mode)
  function createWheelFreqLabels() {
    if (!freqLabelsLayer || !pianoKeyboardEl || !wheelL || !wheelR) return;
    
    const leftFreq = wheelL.getHz();
    const rightFreq = wheelR.getHz();
    
    // Get key spans for both wheels
    const leftKeySpan = getKeySpanForFrequency(leftFreq);
    const rightKeySpan = getKeySpanForFrequency(rightFreq);
    
    // Create labels for left wheel
    if (leftKeySpan?.key?.element) {
      createSingleFreqLabel(leftKeySpan.key.element, leftFreq, '#f97316', 'left');
    }
    
    // Create labels for right wheel (if different key)
    if (rightKeySpan?.key?.element && rightKeySpan.key.element !== leftKeySpan?.key?.element) {
      createSingleFreqLabel(rightKeySpan.key.element, rightFreq, '#fb923c', 'right');
    }
  }
  
  // Create frequency labels above active piano keys (overtone mode)
  function createOvertoneFreqLabels() {
    if (!freqLabelsLayer || !pianoKeyboardEl) return;
    
    overtoneKeyMap.forEach((harmonics, keyElement) => {
      if (!keyElement || !keyElement.isConnected) return;
      
      // Get the strongest harmonic (by volume) for this key
      const strongest = harmonics.reduce((max, h) => 
        h.volume > max.volume ? h : max
      , harmonics[0]);
      
      createSingleFreqLabel(keyElement, strongest.harmonicFreq, strongest.color);
    });
  }
  
  // Main function to update frequency labels based on current mode
  function updateFreqLabels() {
    clearFreqLabels();
    
    if (showOvertoneHighlights && currentOvertonesFundamental > 0) {
      // Show overtone labels
      createOvertoneFreqLabels();
    } else {
      // Show wheel frequency labels
      createWheelFreqLabels();
    }
  }
  
  // Track which keys have overtones for better visual management
  const overtoneKeyMap = new Map(); // key element -> array of {harmonicIndex, color, volume}
  let isUpdatingOvertones = false; // Prevent overlapping updates
  let pendingOvertoneUpdate = false; // Track if an update is pending
  let overtoneUpdateFrame = null; // Track animation frame
  
  // Update overtone highlights on piano keys (with throttling to prevent layout thrashing)
  function updateOvertoneHighlights() {
    // If already updating, mark that we need another update after this one
    if (isUpdatingOvertones) {
      pendingOvertoneUpdate = true;
      return;
    }
    
    // Cancel any pending frame
    if (overtoneUpdateFrame) {
      cancelAnimationFrame(overtoneUpdateFrame);
      overtoneUpdateFrame = null;
    }
    
    isUpdatingOvertones = true;
    
    // Use requestAnimationFrame to batch DOM updates
    overtoneUpdateFrame = requestAnimationFrame(() => {
      overtoneUpdateFrame = null;
      
      try {
        // Clear existing overtone highlights
        clearOvertoneHighlights();
        overtoneKeyMap.clear();
        
        if (!showOvertoneHighlights || !currentOvertonesFundamental || currentOvertonesFundamental <= 0) {
          // Show wheel frequency labels when overtones are disabled
          createWheelFreqLabels();
          isUpdatingOvertones = false;
          if (pendingOvertoneUpdate) {
            pendingOvertoneUpdate = false;
            updateOvertoneHighlights();
          }
          return;
        }
        
        // First pass: collect all harmonics per key
        for (let i = 1; i <= 16; i++) {
          const harmonicIndex = i - 1;
          
          // Skip muted harmonics - don't highlight their piano keys
          if (harmonicMutedState[harmonicIndex]) {
            continue;
          }
          
          const harmonicFreq = currentOvertonesFundamental * i;
          
          // Find the closest piano key to this harmonic frequency
          const keySpan = getKeySpanForFrequency(harmonicFreq);
          if (!keySpan?.key?.element) continue;
          
          // Get color and volume for this harmonic
          const colors = getHarmonicColor(i);
          const volume = harmonicVolumes[harmonicIndex];
          // Get the frequency ratio (how close to the key) - same as wheel mode
          const ratio = keySpan.ratio;
          
          // Track this harmonic on this key
          const keyElement = keySpan.key.element;
          if (!overtoneKeyMap.has(keyElement)) {
            overtoneKeyMap.set(keyElement, []);
          }
          overtoneKeyMap.get(keyElement).push({
            harmonicIndex,
            color: colors.primary,
            volume,
            ratio, // Store the frequency ratio for fill visualization
            harmonicFreq // Store the actual harmonic frequency
          });
        }
        
        // Second pass: apply visual styling based on strongest harmonic per key
        // Batch all DOM updates together
        const updates = [];
        overtoneKeyMap.forEach((harmonics, keyElement) => {
          // Find the strongest (highest volume) harmonic on this key
          const strongest = harmonics.reduce((max, h) => 
            h.volume > max.volume ? h : max
          , harmonics[0]);
          
          // Use the frequency ratio for fill (same calculation as wheel mode)
          // This shows how close the harmonic is to this key's frequency
          const fillRatio = strongest.ratio;
          
          updates.push({
            element: keyElement,
            color: strongest.color,
            opacity: fillRatio.toFixed(3), // Use ratio for fill, not volume
            count: harmonics.length
          });
        });
        
        // Apply all updates at once with validation
        updates.forEach(update => {
          // Ensure element is still in DOM and valid
          if (update.element && update.element.isConnected) {
            update.element.classList.add('is-overtone');
            update.element.style.setProperty('--overtone-highlight', update.color);
            update.element.style.setProperty('--overtone-opacity', update.opacity);
            update.element.setAttribute('data-overtone-count', update.count);
          }
        });
        
        // Create frequency labels above active keys
        createOvertoneFreqLabels();
        
      } finally {
        isUpdatingOvertones = false;
        
        // If another update was requested while we were updating, do it now
        if (pendingOvertoneUpdate) {
          pendingOvertoneUpdate = false;
          updateOvertoneHighlights();
        }
      }
    });
  }
  
  // Set overtones based on piano key or wheel frequency
  function setOvertonesFundamental(frequency, sourceKey = null) {
    currentOvertonesFundamental = frequency;
    activeOvertoneKey = sourceKey;
    generateOvertones(frequency);
    
    // Defer highlight update to next frame to avoid conflicts with click animations
    requestAnimationFrame(() => {
      updateOvertoneHighlights();
    });
  }
  
  // Initialize with default frequency (same as wheel default)
  const defaultFrequency = SORTED_FREQUENCIES[0] || 0.1;
  generateOvertones(defaultFrequency);
  
  // ===== OVERTONES DEMO =====
  // Educational demonstration of the harmonic series
  
  const overtonesDemoBtn = document.getElementById('overtonesDemoBtn');
  const overtonesDemoOverlay = document.getElementById('overtonesDemoOverlay');
  const overtonesDemoLabel = document.getElementById('overtonesDemoLabel');
  
  // Overtones Demo state
  let overtonesDemoRunning = false;
  let overtonesDemoOscillators = [];
  let overtonesDemoGains = [];
  let overtonesDemoTimeouts = [];
  let overtonesDemoMasterGain = null;
  const OVERTONES_DEMO_FUNDAMENTAL_START = 111; // Slightly above A2 for demo effect
  const OVERTONES_DEMO_FUNDAMENTAL_END = 110; // End at true A2
  
  // Store original states to restore after demo
  let originalHarmonicMutedState = null;
  let originalShowOvertoneHighlights = false;
  let originalOvertonesFundamental = null;
  
  // Harmonic names for educational display
  const HARMONIC_NAMES = {
    1: "Fundamental",
    2: "Octave (2:1)",
    3: "Fifth (3:1)",
    4: "2nd Octave (4:1)",
    5: "Major Third (5:1)",
    6: "Fifth (6:1)",
    7: "Harmonic 7th (7:1)",
    8: "3rd Octave (8:1)"
  };
  
  // Get ordinal suffix
  function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  
  // Update overtones demo label with animation
  function updateOvertonesDemoLabel(text) {
    if (!overtonesDemoLabel) return;
    overtonesDemoLabel.classList.add('transitioning');
    setTimeout(() => {
      overtonesDemoLabel.textContent = text;
      overtonesDemoLabel.classList.remove('transitioning');
    }, 150);
  }
  
  // Clear all demo visual highlights from overtone cards
  function clearOvertonesDemoHighlights() {
    overtonesDisplay?.querySelectorAll('.overtone-card').forEach(card => {
      card.classList.remove('demo-current', 'demo-active', 'demo-fading', 'is-playing');
    });
  }
  
  // Highlight a specific harmonic card
  function highlightOvertoneCard(harmonicNum, isCurrent = false) {
    const card = overtonesDisplay?.querySelector(`[data-harmonic="${harmonicNum}"]`);
    if (card) {
      // Remove is-muted class (cards start muted in demo) and add is-playing
      card.classList.remove('is-muted', 'is-filtered-out');
      card.classList.add('is-playing');
      
      // Update the mute indicator icon
      const muteIndicator = card.querySelector('.overtone-mute-indicator');
      if (muteIndicator) muteIndicator.textContent = '🔊';
      
      if (isCurrent) {
        // Remove current from all others first
        overtonesDisplay?.querySelectorAll('.overtone-card.demo-current').forEach(c => {
          c.classList.remove('demo-current');
          c.classList.add('demo-active');
        });
        card.classList.add('demo-current');
      } else {
        card.classList.add('demo-active');
      }
    }
  }
  
  // Fade out highlight for a harmonic card
  function fadeOutOvertoneCard(harmonicNum) {
    const card = overtonesDisplay?.querySelector(`[data-harmonic="${harmonicNum}"]`);
    if (card) {
      card.classList.remove('demo-current', 'demo-active', 'is-playing');
      card.classList.add('demo-fading', 'is-muted');
      
      // Update the mute indicator icon
      const muteIndicator = card.querySelector('.overtone-mute-indicator');
      if (muteIndicator) muteIndicator.textContent = '🔇';
    }
  }
  
  // Create a harmonic oscillator for the demo
  function createDemoHarmonic(harmonicNum, fadeInDuration = 0.8) {
    if (!audioCtx) return;
    
    const freq = currentOvertonesFundamental * harmonicNum;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    // Start silent
    gain.gain.value = 0;
    
    osc.connect(gain);
    gain.connect(overtonesDemoMasterGain);
    
    osc.start();
    
    // Natural harmonic amplitude rolloff (1/n but adjusted for audibility)
    const targetGain = Math.min(0.25, 0.4 / harmonicNum);
    
    // Smooth fade in
    gain.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + fadeInDuration);
    
    overtonesDemoOscillators[harmonicNum] = osc;
    overtonesDemoGains[harmonicNum] = gain;
    
    // Unmute this harmonic in the state so it gets highlighted on piano
    harmonicMutedState[harmonicNum - 1] = false;
    
    // Update piano key highlighting with proper overtone colors
    updateOvertoneHighlights();
  }
  
  // Fade out a demo harmonic
  function fadeOutDemoHarmonic(harmonicNum, duration = 0.8) {
    const gain = overtonesDemoGains[harmonicNum];
    if (gain && audioCtx) {
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
      
      // Mute this harmonic so it disappears from piano highlighting
      harmonicMutedState[harmonicNum - 1] = true;
      updateOvertoneHighlights();
      
      // Clean up after fade
      const timeoutId = setTimeout(() => {
        try {
          overtonesDemoOscillators[harmonicNum]?.stop();
        } catch (e) {}
        overtonesDemoOscillators[harmonicNum] = null;
        overtonesDemoGains[harmonicNum] = null;
      }, duration * 1000 + 100);
      overtonesDemoTimeouts.push(timeoutId);
    }
  }
  
  // Set level of existing demo harmonic (for timbre exploration)
  function setDemoHarmonicLevel(harmonicNum, level, rampDuration = 0.5) {
    const gain = overtonesDemoGains[harmonicNum];
    if (gain && audioCtx) {
      gain.gain.linearRampToValueAtTime(level, audioCtx.currentTime + rampDuration);
    }
  }
  
  // Wait helper
  function demoWait(ms) {
    return new Promise(resolve => {
      const timeoutId = setTimeout(resolve, ms);
      overtonesDemoTimeouts.push(timeoutId);
    });
  }
  
  // Animate fundamental frequency change (smooth transition)
  function animateFundamentalChange(fromFreq, toFreq, duration) {
    return new Promise(resolve => {
      if (!overtonesDemoRunning) {
        resolve();
        return;
      }
      
      const startTime = performance.now();
      
      function animate(currentTime) {
        if (!overtonesDemoRunning) {
          resolve();
          return;
        }
        
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease in-out for smooth transition
        const eased = -(Math.cos(Math.PI * progress) - 1) / 2;
        
        // Calculate current fundamental
        const currentFundamental = fromFreq + (toFreq - fromFreq) * eased;
        
        // Update the fundamental frequency
        currentOvertonesFundamental = currentFundamental;
        
        // Update all oscillator frequencies
        for (let h = 1; h <= 8; h++) {
          const osc = overtonesDemoOscillators[h];
          if (osc && audioCtx) {
            const newFreq = currentFundamental * h;
            try {
              osc.frequency.setValueAtTime(newFreq, audioCtx.currentTime);
            } catch (e) {
              osc.frequency.value = newFreq;
            }
          }
        }
        
        // Update overtone display (throttled)
        updateOvertones();
        
        // Update piano key highlighting
        updateOvertoneHighlights();
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Ensure we end exactly at target
          currentOvertonesFundamental = toFreq;
          updateOvertones();
          updateOvertoneHighlights();
          resolve();
        }
      }
      
      requestAnimationFrame(animate);
    });
  }
  
  // Stop all demo audio
  function stopOvertonesDemoAudio() {
    // Clear all timeouts
    overtonesDemoTimeouts.forEach(t => clearTimeout(t));
    overtonesDemoTimeouts = [];
    
    // Fade out and stop all oscillators
    overtonesDemoOscillators.forEach((osc, i) => {
      if (osc) {
        try {
          const gain = overtonesDemoGains[i];
          if (gain && audioCtx) {
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
          }
          setTimeout(() => {
            try { osc.stop(); } catch (e) {}
          }, 250);
        } catch (e) {}
      }
    });
    
    overtonesDemoOscillators = [];
    overtonesDemoGains = [];
    
    // Disconnect master gain
    if (overtonesDemoMasterGain) {
      setTimeout(() => {
        try { overtonesDemoMasterGain.disconnect(); } catch (e) {}
        overtonesDemoMasterGain = null;
      }, 300);
    }
  }
  
  // Main demo sequence - "The Harmonic Sunrise"
  // A gentle, meditative exploration of the overtone series
  async function runOvertonesDemo() {
    if (!overtonesDemoRunning) return;
    
    // Setup audio
    ensureAudio();
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    
    // Create master gain for demo - start at 0 for gentle fade in
    overtonesDemoMasterGain = audioCtx.createGain();
    overtonesDemoMasterGain.gain.value = 0;
    overtonesDemoMasterGain.connect(audioCtx.destination);
    
    // Generate overtones display at 110 Hz (A2 - a warm, pleasant pitch)
    generateOvertones(OVERTONES_DEMO_FUNDAMENTAL_END);
    
    // ========== PHASE 1: "Stillness" - The Pure Tone ==========
    if (!overtonesDemoRunning) return;
    updateOvertonesDemoLabel("From silence... a single tone emerges");
    
    // Create fundamental with very gentle fade in
    highlightOvertoneCard(1, true);
    createDemoHarmonic(1, 2.5); // 2.5 second fade in
    
    // Fade master gain up gently
    overtonesDemoMasterGain.gain.linearRampToValueAtTime(1.0, audioCtx.currentTime + 2.5);
    await demoWait(5000);
    
    // ========== PHASE 2: "The Octave" - Perfect Consonance ==========
    if (!overtonesDemoRunning) return;
    updateOvertonesDemoLabel("The Octave — two becoming one");
    highlightOvertoneCard(2, true);
    createDemoHarmonic(2, 1.5);
    await demoWait(4500);
    
    // ========== PHASE 3: "The Fifth" - Nature's Harmony ==========
    if (!overtonesDemoRunning) return;
    updateOvertonesDemoLabel("The Perfect Fifth — nature's favorite interval");
    highlightOvertoneCard(3, true);
    createDemoHarmonic(3, 1.5);
    await demoWait(4500);
    
    // ========== PHASE 4: "Growing Light" - Building Warmth ==========
    if (!overtonesDemoRunning) return;
    updateOvertonesDemoLabel("The Double Octave — resonance deepens");
    highlightOvertoneCard(4, true);
    createDemoHarmonic(4, 1.2);
    await demoWait(3500);
    
    if (!overtonesDemoRunning) return;
    updateOvertonesDemoLabel("The Major Third — sweetness enters");
    highlightOvertoneCard(5, true);
    createDemoHarmonic(5, 1.2);
    await demoWait(3500);
    
    // ========== PHASE 5: "The Subtle Colors" - Higher Harmonics ==========
    if (!overtonesDemoRunning) return;
    updateOvertonesDemoLabel("The higher harmonics... subtle colors of sound");
    highlightOvertoneCard(6, true);
    createDemoHarmonic(6, 1.0);
    await demoWait(2500);
    
    if (!overtonesDemoRunning) return;
    updateOvertonesDemoLabel("The Seventh — the mysterious 'blue note'");
    highlightOvertoneCard(7, true);
    createDemoHarmonic(7, 1.0);
    await demoWait(3000);
    
    if (!overtonesDemoRunning) return;
    updateOvertonesDemoLabel("The Triple Octave — completing the series");
    highlightOvertoneCard(8, true);
    createDemoHarmonic(8, 1.0);
    await demoWait(3000);
    
    // ========== PHASE 6: "Full Spectrum" - Appreciation ==========
    if (!overtonesDemoRunning) return;
    updateOvertonesDemoLabel("The Complete Harmonic Series — the DNA of sound");
    await demoWait(4000);
    
    // ========== PHASE 7: "The Frequency Dance" - Gentle Shifting ==========
    if (!overtonesDemoRunning) return;
    updateOvertonesDemoLabel("Watch the frequencies shift together...");
    await animateFundamentalChange(OVERTONES_DEMO_FUNDAMENTAL_END, OVERTONES_DEMO_FUNDAMENTAL_START, 6000);
    await demoWait(2000);
    
    if (!overtonesDemoRunning) return;
    updateOvertonesDemoLabel("...and return home");
    await animateFundamentalChange(OVERTONES_DEMO_FUNDAMENTAL_START, OVERTONES_DEMO_FUNDAMENTAL_END, 6000);
    await demoWait(2000);
    
    // ========== PHASE 8: "Timbre Exploration" ==========
    
    // Warm sound (reduce higher harmonics)
    if (!overtonesDemoRunning) return;
    updateOvertonesDemoLabel("Warm — like a flute or soft voice");
    for (let h = 4; h <= 8; h++) {
      setDemoHarmonicLevel(h, 0.02, 1.0);
      harmonicMutedState[h - 1] = true;
      const card = overtonesDisplay?.querySelector(`[data-harmonic="${h}"]`);
      if (card) {
        card.classList.remove('is-playing', 'demo-active');
        card.classList.add('demo-fading', 'is-muted');
        const muteIndicator = card.querySelector('.overtone-mute-indicator');
        if (muteIndicator) muteIndicator.textContent = '🔇';
      }
    }
    updateOvertoneHighlights();
    await demoWait(4000);
    
    // Restore gradually
    if (!overtonesDemoRunning) return;
    for (let h = 4; h <= 8; h++) {
      const targetGain = Math.min(0.25, 0.4 / h);
      setDemoHarmonicLevel(h, targetGain, 0.8);
      harmonicMutedState[h - 1] = false;
      const card = overtonesDisplay?.querySelector(`[data-harmonic="${h}"]`);
      if (card) {
        card.classList.remove('demo-fading', 'is-muted');
        card.classList.add('demo-active', 'is-playing');
        const muteIndicator = card.querySelector('.overtone-mute-indicator');
        if (muteIndicator) muteIndicator.textContent = '🔊';
      }
    }
    updateOvertoneHighlights();
    await demoWait(1500);
    
    // Hollow sound (odd harmonics only)
    if (!overtonesDemoRunning) return;
    updateOvertonesDemoLabel("Hollow — like a clarinet");
    [2, 4, 6, 8].forEach(h => {
      setDemoHarmonicLevel(h, 0, 1.0);
      harmonicMutedState[h - 1] = true;
      const card = overtonesDisplay?.querySelector(`[data-harmonic="${h}"]`);
      if (card) {
        card.classList.remove('is-playing', 'demo-active');
        card.classList.add('demo-fading', 'is-muted');
        const muteIndicator = card.querySelector('.overtone-mute-indicator');
        if (muteIndicator) muteIndicator.textContent = '🔇';
      }
    });
    updateOvertoneHighlights();
    await demoWait(4000);
    
    // Restore all
    if (!overtonesDemoRunning) return;
    updateOvertonesDemoLabel("Full spectrum restored");
    [2, 4, 6, 8].forEach(h => {
      const targetGain = Math.min(0.25, 0.4 / h);
      setDemoHarmonicLevel(h, targetGain, 1.0);
      harmonicMutedState[h - 1] = false;
      const card = overtonesDisplay?.querySelector(`[data-harmonic="${h}"]`);
      if (card) {
        card.classList.remove('demo-fading', 'is-muted');
        card.classList.add('demo-active', 'is-playing');
        const muteIndicator = card.querySelector('.overtone-mute-indicator');
        if (muteIndicator) muteIndicator.textContent = '🔊';
      }
    });
    updateOvertoneHighlights();
    await demoWait(3000);
    
    // ========== PHASE 9: "Sunset" - Gentle Farewell ==========
    if (!overtonesDemoRunning) return;
    updateOvertonesDemoLabel("The harmonics fade... one by one");
    
    // Fade out from highest to lowest, slowly and peacefully
    for (let h = 8; h >= 2; h--) {
      if (!overtonesDemoRunning) return;
      fadeOutDemoHarmonic(h, 1.5);
      fadeOutOvertoneCard(h);
      await demoWait(1200);
    }
    
    // Linger on fundamental
    if (!overtonesDemoRunning) return;
    updateOvertonesDemoLabel("Returning to the source");
    await demoWait(3000);
    
    // Final fade to silence
    if (!overtonesDemoRunning) return;
    updateOvertonesDemoLabel("Into stillness...");
    fadeOutDemoHarmonic(1, 3.0);
    fadeOutOvertoneCard(1);
    await demoWait(4000);
    
    // Demo complete
    endOvertonesDemo();
  }
  
  // Start overtones demo
  function startOvertonesDemo() {
    if (overtonesDemoRunning) return;
    
    // Stop any existing harmonic playback
    stopHarmonicOscillators();
    
    // Stop main demo if running
    if (typeof stopDemo === 'function' && demoRunning) {
      stopDemo();
    }
    
    overtonesDemoRunning = true;
    
    // Save original states to restore later
    originalHarmonicMutedState = [...harmonicMutedState];
    originalShowOvertoneHighlights = showOvertoneHighlights;
    originalOvertonesFundamental = currentOvertonesFundamental;
    
    // Set all harmonics to muted initially (they'll be unmuted one by one)
    harmonicMutedState = Array(16).fill(true);
    
    // Enable overtone highlighting mode for proper piano key colors
    showOvertoneHighlights = true;
    
    // Update button state
    if (overtonesDemoBtn) {
      overtonesDemoBtn.classList.add('is-running');
    }
    
    // Show overlay
    if (overtonesDemoOverlay) {
      overtonesDemoOverlay.hidden = false;
    }
    
    // Clear any existing highlights
    clearOvertonesDemoHighlights();
    clearOvertoneHighlights();
    
    // Run the demo
    runOvertonesDemo();
  }
  
  // Restore original overtone states after demo
  function restoreOvertoneStates() {
    // Restore original mute states
    if (originalHarmonicMutedState) {
      harmonicMutedState = [...originalHarmonicMutedState];
      originalHarmonicMutedState = null;
    }
    
    // Restore original showOvertoneHighlights state
    showOvertoneHighlights = originalShowOvertoneHighlights;
    
    // Update the overtone toggle button visual state
    const overtoneHighlightToggle = document.getElementById('overtoneHighlightToggle');
    if (overtoneHighlightToggle) {
      if (showOvertoneHighlights) {
        overtoneHighlightToggle.classList.add('is-active');
      } else {
        overtoneHighlightToggle.classList.remove('is-active');
      }
    }
    
    // Restore original fundamental and regenerate overtone cards to default state
    if (originalOvertonesFundamental !== null) {
      generateOvertones(originalOvertonesFundamental);
      originalOvertonesFundamental = null;
    }
    
    // Clear all piano key overtone highlights
    clearOvertoneHighlights();
  }
  
  // Stop overtones demo (interrupted)
  function stopOvertonesDemo() {
    if (!overtonesDemoRunning) return;
    
    overtonesDemoRunning = false;
    
    // Stop audio
    stopOvertonesDemoAudio();
    
    // Update button state
    if (overtonesDemoBtn) {
      overtonesDemoBtn.classList.remove('is-running');
    }
    
    // Hide overlay
    if (overtonesDemoOverlay) {
      overtonesDemoOverlay.hidden = true;
    }
    
    // Clear overtone card highlights
    clearOvertonesDemoHighlights();
    
    // Restore original states
    restoreOvertoneStates();
  }
  
  // End overtones demo (completed naturally)
  function endOvertonesDemo() {
    overtonesDemoRunning = false;
    
    // Update button state
    if (overtonesDemoBtn) {
      overtonesDemoBtn.classList.remove('is-running');
    }
    
    // Show completion message
    updateOvertonesDemoLabel("✨ Demo Complete");
    
    // Hide overlay after a moment
    setTimeout(() => {
      if (overtonesDemoOverlay) {
        overtonesDemoOverlay.hidden = true;
      }
      clearOvertonesDemoHighlights();
      restoreOvertoneStates();
    }, 2000);
  }
  
  // Wire up demo button
  if (overtonesDemoBtn) {
    overtonesDemoBtn.addEventListener('click', () => {
      if (overtonesDemoRunning) {
        stopOvertonesDemo();
      } else {
        startOvertonesDemo();
      }
    });
  }
  
  // Stop overtones demo when replay is clicked
  if (overtonesReplayBtn) {
    const originalReplayHandler = overtonesReplayBtn.onclick;
    overtonesReplayBtn.addEventListener('click', () => {
      if (overtonesDemoRunning) {
        stopOvertonesDemo();
      }
    });
  }
  
  // Expose for cross-reference
  window.stopOvertonesDemoFn = stopOvertonesDemo;
  
  // Note system toggle button
  const noteSystemToggle = document.getElementById('noteSystemToggle');
  noteSystemToggle?.addEventListener('click', () => {
    // Toggle between systems
    noteSystem = noteSystem === 'alphabetical' ? 'solfege' : 'alphabetical';
    
    // Update button label
    const toggleLabel = noteSystemToggle.querySelector('.toggle-label');
    if (toggleLabel) {
      toggleLabel.textContent = noteSystem === 'alphabetical' ? 'Show Musical Note' : 'Show Solfeggio';
    }
    
    // Update live info display with new note system
    updateLiveInfo();
    
    // Update piano keyboard labels
    updatePianoKeyLabels();
  });
  
  // Overtone highlighting toggle
  const overtoneHighlightToggle = document.getElementById('overtoneHighlightToggle');
  
  overtoneHighlightToggle?.addEventListener('click', () => {
    showOvertoneHighlights = !showOvertoneHighlights;
    
    // Update button active state
    if (showOvertoneHighlights) {
      overtoneHighlightToggle.classList.add('is-active');
      
      // Store current mute states before muting
      wheelMuteStatesBeforeOvertones.left = wheelLMuted;
      wheelMuteStatesBeforeOvertones.right = wheelRMuted;
      
      // Mute both wheels when overtones are active
      if (!wheelLMuted) {
        wheelLMuted = true;
      }
      if (!wheelRMuted) {
        wheelRMuted = true;
      }
      
      updateOscillators();
      updateMuteButtons();
      
      // Start playing harmonics if we have an active fundamental
      if (currentOvertonesFundamental > 0) {
        startHarmonicOscillators();
      }
    } else {
      overtoneHighlightToggle.classList.remove('is-active');
      
      // Restore previous mute states when overtones are disabled
      wheelLMuted = wheelMuteStatesBeforeOvertones.left;
      wheelRMuted = wheelMuteStatesBeforeOvertones.right;
      
      updateOscillators();
      updateMuteButtons();
      
      // Stop playing harmonics when disabled
      stopHarmonicOscillators();
    }
    
    // Update highlights
    updateOvertoneHighlights();
  });
  
  pianoKeyboardEl?.addEventListener('pointerdown', handlePianoPointerDown);
  pianoKeyboardEl?.addEventListener('keydown', handlePianoKeydown);
  pianoKeyboardEl?.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    // Check if we're scrolling over a piano key
    const keyEl = e.target.closest('.piano-key');
    
    if (keyEl && currentOvertonesFundamental > 0) {
      // Scrolling over a piano key - adjust overtones fundamental and wheels
      const delta = e.deltaY || e.deltaX;
      const deltaRotation = -delta * 0.5; // Same sensitivity as Fine Tune dial
      const deltaHz = (deltaRotation / 360) * 10; // Same conversion as Fine Tune
      
      // Calculate new fundamental frequency
      let newFundamental = currentOvertonesFundamental + deltaHz;
      
      // Clamp to valid range
      newFundamental = Math.max(0.1, Math.min(MAX_FREQUENCY_HZ, newFundamental));
      
      // Update wheels to match the new fundamental (same as clicking the key)
      isProgrammaticChange = true;
      
      if (keyboardTargetsState.left) {
        wheelL.setHz(newFundamental);
      }
      if (keyboardTargetsState.right) {
        wheelR.setHz(newFundamental);
      }
      
      scheduleOscillatorSync();
      
      // Update overtones with new fundamental (smooth update without regenerating)
      currentOvertonesFundamental = newFundamental;
      updateOvertones();
      
      // Reset flag after a short delay
      setTimeout(() => { isProgrammaticChange = false; }, 100);
    } else if (keyboardTargetsState.left || keyboardTargetsState.right) {
      // Scrolling over keyboard background - nudge wheels as before
      const direction = e.deltaY < 0 ? 1 : -1;
      const magnitude = Math.min(3, Math.abs(e.deltaY) * SCROLL_SCALE);
      nudgeSelectedWheels(direction * (SCROLL_BASE_STEP + magnitude));
    }
  }, { passive: false });

  // Mono volume slider functionality
  const monoSlider = document.getElementById('monoSlider');
  const monoVolumeTrack = monoSlider?.parentElement;
  const monoVolumeValue = document.getElementById('monoVolumeValue');
  let monoSliderDragging = false;
  let monoSliderPointer = null;
  let monoTrackMetrics = null;
  
  const resetMonoTrackMetrics = () => {
    monoTrackMetrics = null;
  };
  
  const getMonoTrackMetrics = () => {
    if (!monoVolumeTrack) return null;
    if (monoTrackMetrics) return monoTrackMetrics;
    const rect = monoVolumeTrack.getBoundingClientRect();
    const sliderHeight = monoSlider?.offsetHeight || 40;
    const maxPosition = Math.max(1, rect.height - sliderHeight);
    monoTrackMetrics = { rect, sliderHeight, maxPosition };
    return monoTrackMetrics;
  };

  function updateMonoVolume(percent) {
    const clamped = Math.max(0, Math.min(100, percent));
    monoVolume = clamped / 100;
    if (monoGain) {
      const now = audioCtx.currentTime;
      try {
        monoGain.gain.setTargetAtTime(monoVolume, now, 0.01);
      } catch {
        monoGain.gain.value = monoVolume;
      }
    }
    if (monoVolumeValue) {
      monoVolumeValue.textContent = Math.round(clamped) + '%';
    }
    updateMonoSliderPosition(clamped);
  }

  function updateMonoSliderPosition(percent) {
    if (!monoSlider || !monoVolumeTrack) return;
    const metrics = getMonoTrackMetrics();
    if (!metrics) return;
    // Invert: 0% at bottom, 100% at top
    const position = ((100 - percent) / 100) * metrics.maxPosition;
    monoSlider.style.top = (position + (metrics.sliderHeight / 2)) + 'px';
    monoSlider.style.left = '';
    monoSlider.setAttribute('aria-valuenow', Math.round(percent));
  }

  function getMonoPercentFromClientY(clientY) {
    const metrics = getMonoTrackMetrics();
    if (!metrics || typeof clientY !== 'number') return monoVolume * 100;
    const relativeY = clientY - metrics.rect.top - metrics.sliderHeight / 2;
    const clampedY = Math.max(0, Math.min(metrics.maxPosition, relativeY));
    // Invert: top = 100%, bottom = 0%
    const percent = 100 - (clampedY / metrics.maxPosition) * 100;
    return Math.max(0, Math.min(100, percent));
  }

  // Mono slider drag handlers
  if (monoSlider && monoVolumeTrack) {
    const handlePointerDown = (e) => {
      if (typeof e.button === 'number' && e.button !== 0) return;
      monoSliderDragging = true;
      monoSliderPointer = typeof e.pointerId === 'number' ? e.pointerId : null;
      resetMonoTrackMetrics();
      getMonoTrackMetrics();
      if (monoSliderPointer !== null) {
        monoVolumeTrack.setPointerCapture?.(monoSliderPointer);
      }
      e.preventDefault();
      updateMonoVolume(getMonoPercentFromClientY(e.clientY));
    };
    
    const handlePointerMove = (e) => {
      if (!monoSliderDragging) return;
      if (monoSliderPointer !== null && e.pointerId !== monoSliderPointer) return;
      e.preventDefault();
      updateMonoVolume(getMonoPercentFromClientY(e.clientY));
    };
    
    const handlePointerUp = (e) => {
      if (!monoSliderDragging) return;
      if (monoSliderPointer !== null && e.pointerId !== monoSliderPointer) return;
      monoSliderDragging = false;
      if (monoSliderPointer !== null) {
        monoVolumeTrack.releasePointerCapture?.(monoSliderPointer);
      }
      monoSliderPointer = null;
    };
    
    monoVolumeTrack.addEventListener('pointerdown', handlePointerDown);
    addEventListener('pointermove', handlePointerMove);
    addEventListener('pointerup', handlePointerUp);
    addEventListener('pointercancel', handlePointerUp);
    
    addEventListener('resize', () => {
      resetMonoTrackMetrics();
      updateMonoSliderPosition(monoVolume * 100);
    }, { passive: true });
    
    if (window.ResizeObserver) {
      const monoResizeObserver = new ResizeObserver(() => {
        resetMonoTrackMetrics();
        updateMonoSliderPosition(monoVolume * 100);
      });
      monoResizeObserver.observe(monoVolumeTrack);
    }
    
    // Initialize slider position to 0%
    updateMonoSliderPosition(0);
  }

  // Fine-tune dial functionality
  let fineTuneOffset = 0; // Accumulated offset in Hz
  let fineTuneRotation = 0; // Current rotation in degrees (infinite)
  const fineTuneDial = document.getElementById('fineTuneDial');
  const fineTuneRotor = fineTuneDial?.querySelector('.fine-tune-rotor');
  const fineTunePointer = fineTuneDial?.querySelector('.fine-tune-pointer');
  const fineTuneValue = document.getElementById('fineTuneValue');
  
  function updateFineTuneDisplay() {
    if (fineTuneValue) {
      fineTuneValue.textContent = `${fineTuneOffset >= 0 ? '+' : ''}${fineTuneOffset.toFixed(3)} Hz`;
    }
    if (fineTunePointer) {
      fineTunePointer.style.transform = `translate(-50%, -50%) rotate(${fineTuneRotation}deg) translateY(-46.5px)`;
    }
  }
  
  function applyFineTune(deltaHz) {
    // Apply the delta to both wheels
    const currentL = wheelL.getHz();
    const currentR = wheelR.getHz();
    
    // Calculate new frequencies with bounds checking
    let newL = Math.max(0.1, Math.min(MAX_FREQUENCY_HZ, currentL + deltaHz));
    let newR = Math.max(0.1, Math.min(MAX_FREQUENCY_HZ, currentR + deltaHz));
    
    // Only update if at least one wheel can move
    if (newL !== currentL || newR !== currentR) {
      // Calculate actual delta applied (in case we hit bounds)
      const actualDeltaL = newL - currentL;
      const actualDeltaR = newR - currentR;
      const actualDelta = (Math.abs(actualDeltaL) > Math.abs(actualDeltaR)) ? actualDeltaL : actualDeltaR;
      
      fineTuneOffset += actualDelta;
      
      // Sync pitch bend offset (they share the same purpose)
      if (typeof pitchBendOffset !== 'undefined') {
        pitchBendOffset += actualDelta;
        if (typeof pitchBendScrollPos !== 'undefined') pitchBendScrollPos += actualDelta * 10;
        if (typeof updatePitchBendDisplay === 'function') updatePitchBendDisplay();
        if (typeof updatePitchBendScrollPosition === 'function') updatePitchBendScrollPosition();
      }
      
      // Set the new frequencies
      wheelL.setHz(newL);
      wheelR.setHz(newR);
      
      // Update overtones if we have an active fundamental
      // Use the left wheel frequency as the fundamental for overtones
      if (currentOvertonesFundamental > 0) {
        currentOvertonesFundamental = newL;
        updateOvertones();
      }
    }
    
    updateFineTuneDisplay();
  }
  
  // Rotational drag on fine-tune dial
  if (fineTuneRotor) {
    let isDragging = false;
    let lastAngle = 0;
    
    const getAngle = (e, rect) => {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = (e.type.includes('mouse') ? e.clientX : e.touches[0].clientX) - centerX;
      const y = (e.type.includes('mouse') ? e.clientY : e.touches[0].clientY) - centerY;
      return Math.atan2(y, x) * (180 / Math.PI);
    };
    
    const startDrag = (e) => {
      isDragging = true;
      const rect = fineTuneDial.getBoundingClientRect();
      lastAngle = getAngle(e, rect);
      e.preventDefault();
    };
    
    const doDrag = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const rect = fineTuneDial.getBoundingClientRect();
      const currentAngle = getAngle(e, rect);
      
      // Calculate angle delta (handling wraparound)
      let deltaAngle = currentAngle - lastAngle;
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;
      
      lastAngle = currentAngle;
      fineTuneRotation += deltaAngle;
      
      // Convert rotation to Hz change
      // 1 full rotation (360°) = 10 Hz change
      const deltaHz = (deltaAngle / 360) * 10;
      applyFineTune(deltaHz);
    };
    
    const endDrag = () => {
      isDragging = false;
    };
    
    fineTuneRotor.addEventListener('mousedown', startDrag);
    fineTuneRotor.addEventListener('touchstart', startDrag, { passive: false });
    
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('touchmove', doDrag, { passive: false });
    
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
    
    // Mouse wheel scrolling
    fineTuneDial.addEventListener('wheel', (e) => {
      e.preventDefault();
      // Normalize wheel delta (different browsers report different values)
      const delta = e.deltaY || e.deltaX;
      const deltaRotation = -delta * 0.5; // Rotation sensitivity
      fineTuneRotation += deltaRotation;
      const deltaHz = (deltaRotation / 360) * 10;
      applyFineTune(deltaHz);
    }, { passive: false });
    
    // Keyboard support
    fineTuneDial.addEventListener('keydown', (e) => {
      let deltaRotation = 0;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        deltaRotation = -10; // 10 degrees per key press
        e.preventDefault();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        deltaRotation = 10;
        e.preventDefault();
      }
      if (deltaRotation !== 0) {
        fineTuneRotation += deltaRotation;
        const deltaHz = (deltaRotation / 360) * 10;
        applyFineTune(deltaHz);
      }
    });
    
    // Add hover effect to highlight wheels when fine tune dial is hovered
    const wheelLEl = document.getElementById('wheelL');
    const wheelREl = document.getElementById('wheelR');
    
    const highlightWheels = () => {
      if (wheelLEl) wheelLEl.classList.add('fine-tune-active');
      if (wheelREl) wheelREl.classList.add('fine-tune-active');
    };
    
    const unhighlightWheels = () => {
      if (wheelLEl) wheelLEl.classList.remove('fine-tune-active');
      if (wheelREl) wheelREl.classList.remove('fine-tune-active');
    };
    
    fineTuneDial.addEventListener('mouseenter', highlightWheels);
    fineTuneDial.addEventListener('mouseleave', unhighlightWheels);
  }
  
  // Initialize fine-tune display
  updateFineTuneDisplay();

  // ===== PITCH BEND WHEEL =====
  // Duplicates FINE TUNE functionality - scroll up/down to increase/decrease frequency
  // Uses infinite scroll wheel design like a mouse wheel
  let pitchBendOffset = 0; // Accumulated offset in Hz (same as fineTuneOffset)
  let pitchBendScrollPos = 0; // Scroll position in pixels (infinite)
  const pitchBendWheel = document.getElementById('pitchBendWheel');
  const pitchBendScrollWheel = document.getElementById('pitchBendScrollWheel');
  const pitchBendValue = document.getElementById('pitchBendValue');
  
  // Ridge pattern repeats every 10px, so we loop within that range
  const RIDGE_REPEAT = 10;
  
  function updatePitchBendDisplay() {
    if (pitchBendValue) {
      pitchBendValue.textContent = `${pitchBendOffset >= 0 ? '+' : ''}${pitchBendOffset.toFixed(3)}`;
    }
  }
  
  function updatePitchBendScrollPosition() {
    if (!pitchBendScrollWheel) return;
    // Use modulo to create infinite looping scroll effect
    // The wheel is 300% height, centered at -33%
    const loopedPos = pitchBendScrollPos % RIDGE_REPEAT;
    pitchBendScrollWheel.style.transform = `translateY(calc(-33.33% + ${loopedPos}px))`;
  }
  
  function applyPitchBend(deltaHz) {
    // Apply the delta to both wheels (same as applyFineTune)
    const currentL = wheelL.getHz();
    const currentR = wheelR.getHz();
    
    // Calculate new frequencies with bounds checking
    let newL = Math.max(0.1, Math.min(MAX_FREQUENCY_HZ, currentL + deltaHz));
    let newR = Math.max(0.1, Math.min(MAX_FREQUENCY_HZ, currentR + deltaHz));
    
    // Only update if at least one wheel can move
    if (newL !== currentL || newR !== currentR) {
      // Calculate actual delta applied (in case we hit bounds)
      const actualDeltaL = newL - currentL;
      const actualDeltaR = newR - currentR;
      const actualDelta = (Math.abs(actualDeltaL) > Math.abs(actualDeltaR)) ? actualDeltaL : actualDeltaR;
      
      pitchBendOffset += actualDelta;
      // Update scroll position - 10px per 1 Hz for visible movement
      pitchBendScrollPos += actualDelta * 10;
      
      // Also sync with fine tune offset so they stay in sync
      fineTuneOffset += actualDelta;
      fineTuneRotation += (actualDelta / 10) * 360; // Sync rotation too
      
      // Set the new frequencies
      wheelL.setHz(newL);
      wheelR.setHz(newR);
      
      // Update overtones if we have an active fundamental
      if (currentOvertonesFundamental > 0) {
        currentOvertonesFundamental = newL;
        updateOvertones();
      }
    }
    
    updatePitchBendDisplay();
    updatePitchBendScrollPosition();
    updateFineTuneDisplay(); // Keep fine tune display in sync
  }
  
  // Pitch bend drag handlers
  if (pitchBendWheel) {
    let isDragging = false;
    let lastY = 0;
    
    const startDrag = (e) => {
      isDragging = true;
      pitchBendWheel.classList.add('is-active');
      
      if (e.type.includes('touch')) {
        lastY = e.touches[0].clientY;
      } else {
        lastY = e.clientY;
      }
      e.preventDefault();
    };
    
    const doDrag = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      
      let currentY;
      if (e.type.includes('touch')) {
        currentY = e.touches[0].clientY;
      } else {
        currentY = e.clientY;
      }
      
      // Up = positive (negative Y direction)
      const delta = lastY - currentY;
      lastY = currentY;
      
      // Convert pixel movement to Hz change
      // Sensitivity: 1 pixel = 0.1 Hz
      const deltaHz = delta * 0.1;
      applyPitchBend(deltaHz);
    };
    
    const endDrag = () => {
      isDragging = false;
      pitchBendWheel.classList.remove('is-active');
    };
    
    // Mouse events
    pitchBendWheel.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', endDrag);
    
    // Touch events
    pitchBendWheel.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', doDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
    
    // Mouse wheel scrolling (main functionality)
    pitchBendWheel.addEventListener('wheel', (e) => {
      e.preventDefault();
      pitchBendWheel.classList.add('is-active');
      
      // Use same sensitivity as fine tune dial
      const delta = e.deltaY || e.deltaX;
      const deltaHz = -delta * 0.05; // Negative because wheel down = positive deltaY but we want decrease
      applyPitchBend(deltaHz);
      
      // Remove active class after a short delay
      setTimeout(() => {
        pitchBendWheel.classList.remove('is-active');
      }, 150);
    }, { passive: false });
    
    // Keyboard support
    pitchBendWheel.addEventListener('keydown', (e) => {
      let deltaHz = 0;
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        deltaHz = e.shiftKey ? 1 : 0.1; // Shift for larger steps
        e.preventDefault();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        deltaHz = e.shiftKey ? -1 : -0.1;
        e.preventDefault();
      } else if (e.key === 'Home') {
        // Reset to center
        const resetDelta = -pitchBendOffset;
        applyPitchBend(resetDelta);
        pitchBendScrollPos = 0;
        updatePitchBendScrollPosition();
        e.preventDefault();
        return;
      }
      if (deltaHz !== 0) {
        pitchBendWheel.classList.add('is-active');
        applyPitchBend(deltaHz);
        setTimeout(() => {
          pitchBendWheel.classList.remove('is-active');
        }, 150);
      }
    });
    
    // Add visual highlight to wheels when pitch bend is hovered (same as fine tune)
    const wheelLEl = document.getElementById('wheelL');
    const wheelREl = document.getElementById('wheelR');
    
    pitchBendWheel.addEventListener('mouseenter', () => {
      if (wheelLEl) wheelLEl.classList.add('fine-tune-active');
      if (wheelREl) wheelREl.classList.add('fine-tune-active');
    });
    
    pitchBendWheel.addEventListener('mouseleave', () => {
      if (wheelLEl) wheelLEl.classList.remove('fine-tune-active');
      if (wheelREl) wheelREl.classList.remove('fine-tune-active');
    });
  }
  
  // Initialize pitch bend display
  updatePitchBendDisplay();
  updatePitchBendScrollPosition();

  // Buttons
  document.getElementById('play').addEventListener('click', async ()=>{
    ensureAudio();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    startAudio();
    setTransportActive('play');
  });
  document.getElementById('pause').addEventListener('click', async ()=>{
    if (!audioCtx) return;
    try { await audioCtx.suspend(); } catch {}
    setTransportActive('pause');
  });
  document.getElementById('stop').addEventListener('click', ()=> stopAudio());
  document.getElementById('reset').addEventListener('click', ()=> {
    stopAudio();
    
    // Set flag to prevent auto-play on reset
    isProgrammaticChange = true;
    
    // === STOP ALL RUNNING JOURNEYS AND DEMOS ===
    // Stop main Demo
    if (typeof window.stopDemoFn === 'function') {
      window.stopDemoFn();
    }
    // Stop Quick Start
    if (typeof window.stopQuickStartFn === 'function') {
      window.stopQuickStartFn();
    }
    // Stop Guided Journeys (programs)
    if (typeof stopProgram === 'function') {
      stopProgram(true);
    }
    // Stop Dynamic Journeys
    if (typeof window.stopDynamicJourneyFn === 'function') {
      window.stopDynamicJourneyFn();
    }
    // Stop Overtones Demo
    if (typeof stopOvertonesDemo === 'function') {
      stopOvertonesDemo();
    }
    // Stop Music Theory Demo
    if (typeof stopTheoryDemo === 'function') {
      stopTheoryDemo();
    }
    
    // === RESET WHEELS ===
    wheelL.reset();
    wheelR.reset();
    if (presetSelect) presetSelect.value = '';
    if (binauralPresetSelect) binauralPresetSelect.value = '';
    
    // === RESET PAN CONTROLS TO DEFAULTS ===
    setPan('wheelL', -100);
    setPan('wheelR', 100);
    const panSliderL = document.querySelector('.pan-slider[data-wheel="wheelL"]');
    const panSliderR = document.querySelector('.pan-slider[data-wheel="wheelR"]');
    if (panSliderL) panSliderL.value = -100;
    if (panSliderR) panSliderR.value = 100;
    updatePanValues();
    
    // Reset mono volume to 0%
    updateMonoVolume(0);
    
    // Reset fine-tune offset and rotation
    fineTuneOffset = 0;
    fineTuneRotation = 0;
    updateFineTuneDisplay();
    
    // Reset pitch bend wheel
    pitchBendOffset = 0;
    pitchBendScrollPos = 0;
    updatePitchBendDisplay();
    updatePitchBendScrollPosition();
    
    // === RESET HARMONIC FILTERS ===
    harmonicFilterMode = 'all';
    const harmonicToggle = document.getElementById('harmonicOnlyToggle');
    const dissonantToggle = document.getElementById('dissonantOnlyToggle');
    if (harmonicToggle) harmonicToggle.classList.remove('is-active');
    if (dissonantToggle) dissonantToggle.classList.remove('is-active');
    
    // Reset harmonic mute states, volumes, and pans
    harmonicMutedState = Array(16).fill(false);
    harmonicVolumes = Array(16).fill(50);
    harmonicPans = Array(16).fill(0);
    
    // === RESET OVERTONE HIGHLIGHTS ===
    showOvertoneHighlights = false;
    const overtoneToggle = document.getElementById('overtoneHighlightToggle');
    if (overtoneToggle) {
      overtoneToggle.classList.remove('is-active');
    }
    
    // Restore wheel mute states (they get force-muted when overtones are on)
    wheelLMuted = false;
    wheelRMuted = false;
    updateMuteButtons();
    
    // Clear piano key overtone highlights
    pianoKeys.forEach(key => {
      if (key.element) {
        key.element.classList.remove('is-overtone', 'is-left', 'is-right', 'school-demo-active', 'school-demo-filling');
        key.element.style.removeProperty('--overtone-highlight');
        key.element.style.removeProperty('--overtone-opacity');
        key.element.style.removeProperty('--left-highlight');
        key.element.style.removeProperty('--right-highlight');
        key.element.style.removeProperty('--left-fill');
        key.element.removeAttribute('data-overtone-count');
        key.element.style.removeProperty('background');
      }
    });
    
    // Clear frequency labels from piano
    const freqLabelsContainer = document.querySelector('.freq-labels-container');
    if (freqLabelsContainer) {
      freqLabelsContainer.innerHTML = '';
    }
    
    // Reset overtones to default frequency (same as wheel default)
    const defaultFrequency = SORTED_FREQUENCIES[0] || 0.1;
    currentOvertonesFundamental = defaultFrequency;
    activeOvertoneKey = null;
    generateOvertones(defaultFrequency);
    
    // === RESET JOURNEY SELECTS ===
    const programSelect = document.getElementById('programSelect');
    const dynamicJourneySelect = document.getElementById('dynamicJourneySelect');
    if (programSelect) programSelect.value = '';
    if (dynamicJourneySelect) dynamicJourneySelect.value = '';
    
    // Reset transport state
    setTransportActive('stop');
    
    // Reset flag after a short delay
    setTimeout(() => { isProgrammaticChange = false; }, 100);
  });

  // No category switching needed - only Solfeggio & Chakra frequencies available

  // Visual states and ripple feedback
  function setTransportActive(which){
    const ids = ['play','pause','stop','reset'];
    ids.forEach(id=>{
      const el = document.getElementById(id);
      if (!el) return;
      // Only Play and Pause should stay visually active
      // Stop and Reset are momentary actions
      if (id === which && (id === 'play' || id === 'pause')) {
        el.classList.add('is-active');
      } else {
        el.classList.remove('is-active');
      }
    });
    
    // Update spectrogram based on transport state
    if (which === 'play') {
      onAudioStart();
    } else if (which === 'pause') {
      onAudioPause();
    } else if (which === 'stop') {
      onAudioStop();
    }
  }
  function attachRipple(el){
    el?.addEventListener('click', (e)=>{
      const rect = el.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size/2;
      const y = e.clientY - rect.top - size/2;
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      el.appendChild(ripple);
      ripple.addEventListener('animationend', ()=> ripple.remove());
    });
  }
  ['play','pause','stop','reset'].forEach(id=> attachRipple(document.getElementById(id)));

  // THEME: persist light/dark and toggle
  const THEME_KEY = 'twinwheels-theme';
  const themeToggle = document.getElementById('themeToggle');
  const applyTheme = (mode) => {
    document.body.setAttribute('data-theme', mode);
    if (themeToggle){
      themeToggle.dataset.mode = mode;
      themeToggle.textContent = mode === 'dark' ? '🌙' : '☀️';
      const themeColor = mode === 'dark' ? '#0f1220' : '#f8fafc';
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta) themeMeta.setAttribute('content', themeColor);
    }
  };
  const storedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(storedTheme || (prefersDark ? 'dark' : 'light'));
  themeToggle?.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    
    // Update spectrogram canvas with new theme colors
    if (isAudioPlaying) {
      const leftFreq = wheelL?.getHz() ?? 0;
      const rightFreq = wheelR?.getHz() ?? 0;
      renderOscilloscope(leftFreq, rightFreq);
    } else {
      renderIdleWaveform();
    }
  });

  // ===== MUSIC SCHOOL SECTION =====
  const musicSchoolConcepts = {
    frequency: {
      title: 'Frequency',
      text: 'How many times a sound wave vibrates per second, measured in Hertz (Hz). 100 Hz = 100 vibrations/sec (low bass), 1000 Hz = 1000 vibrations/sec (higher pitch). Each unique frequency corresponds to a specific pitch—change the frequency, change the note! Piano example: A4 = 440 Hz (concert pitch). One key right: A#4 = 466.16 Hz. Each adjacent key increases frequency by ~5.9%. After 12 keys (one octave), frequency doubles: A5 = 880 Hz.',
      visual: `<svg viewBox="0 0 100 30" fill="none">
        <path d="M5 15 Q15 3 25 15 Q35 27 45 15 Q55 3 65 15 Q75 27 85 15 Q92 8 98 15" stroke="#9370db" stroke-width="2" fill="none"/>
      </svg>`,
      demoType: 'frequency'
    },
    vibrations: {
      title: 'Vibrations',
      text: 'Physical back-and-forth motion that creates sound. A guitar string vibrates when plucked, pushing air molecules into pressure waves that travel to your ear. The speed of vibration determines pitch: faster = higher, slower = lower.',
      visual: `<svg viewBox="0 0 100 30" fill="none">
        <path d="M50 5 L50 25" stroke="#9370db" stroke-width="3"/>
        <path d="M46 3 L50 0 L54 3" stroke="#40e0d0" stroke-width="1.5" fill="none"/>
        <path d="M42 6 C39 9 39 12 42 15" stroke="#ff69b4" stroke-width="1.5" fill="none" opacity="0.6"/>
        <path d="M58 6 C61 9 61 12 58 15" stroke="#ff69b4" stroke-width="1.5" fill="none" opacity="0.6"/>
      </svg>`,
      demoType: 'vibrato'
    },
    harmonics: {
      title: 'Harmonics',
      text: 'Whole-number multiples of the base frequency. If the fundamental is 100 Hz, harmonics are 200 Hz (2×), 300 Hz (3×), 400 Hz (4×), etc. These create pleasing musical intervals like octaves and fifths, which is why harmonics sound good together.',
      visual: `<svg viewBox="0 0 100 30" fill="none">
        <path d="M5 22 Q25 10 45 22 Q65 34 85 22" stroke="#9370db" stroke-width="2" fill="none" opacity="0.5"/>
        <path d="M5 15 Q15 8 25 15 Q35 22 45 15 Q55 8 65 15 Q75 22 85 15" stroke="#40e0d0" stroke-width="2" fill="none"/>
      </svg>`,
      demoType: 'harmonics'
    },
    overtones: {
      title: 'Overtones',
      text: 'Frequencies produced above the fundamental note. The 1st overtone = 2nd harmonic, 2nd overtone = 3rd harmonic, etc. Overtones give instruments their unique "voice" (timbre)—why a piano and violin playing the same note sound different.',
      visual: `<svg viewBox="0 0 100 30" fill="none">
        <path d="M5 22 Q20 8 40 22 Q60 36 80 22 Q90 16 95 22" stroke="#9370db" stroke-width="2.5" fill="none"/>
        <path d="M5 16 Q12 10 20 16 Q28 22 35 16 Q42 10 50 16 Q58 22 65 16 Q72 10 80 16" stroke="#40e0d0" stroke-width="1.5" fill="none" opacity="0.7"/>
        <path d="M5 11 Q10 8 15 11 Q20 14 25 11 Q30 8 35 11 Q40 14 45 11 Q50 8 55 11 Q60 14 65 11 Q70 8 75 11 Q80 14 85 11" stroke="#ff69b4" stroke-width="1" fill="none" opacity="0.5"/>
      </svg>`,
      demoType: 'overtones'
    },
    timbre: {
      title: 'Timbre',
      text: 'The unique "color" or quality of a sound that lets you tell instruments apart. A piano and violin playing the same note at the same volume sound different because of timbre—it\'s determined by the mix and strength of overtones each instrument produces.',
      visual: `<svg viewBox="0 0 100 30" fill="none">
        <path d="M5 20 Q15 10 25 20 Q35 30 45 20" stroke="#9370db" stroke-width="2" fill="none"/>
        <path d="M55 20 Q62 12 70 20 Q78 28 85 20" stroke="#40e0d0" stroke-width="2" fill="none"/>
        <circle cx="25" cy="8" r="4" fill="#9370db" opacity="0.6"/>
        <circle cx="70" cy="8" r="4" fill="#40e0d0" opacity="0.6"/>
      </svg>`,
      demoType: 'timbre'
    },
    tone: {
      title: 'Tone',
      text: 'A pure sine wave at a single frequency with no overtones—like a tuning fork or electronic beep. Real instruments produce complex tones with many overtones. Pure tones are rare in nature but common in synthesizers and test signals.',
      visual: `<svg viewBox="0 0 100 30" fill="none">
        <path d="M5 15 Q25 3 50 15 Q75 27 95 15" stroke="#9370db" stroke-width="2.5" fill="none"/>
      </svg>`,
      demoType: 'tone'
    },
    note: {
      title: 'Note',
      text: 'A named musical pitch in the system: C, D, E, F, G, A, B (repeating in octaves). Each note corresponds to a specific frequency—A4 = 440 Hz is the universal tuning standard. Notes let musicians communicate pitch using letters instead of Hz values.',
      visual: `<svg viewBox="0 0 100 30" fill="none">
        <ellipse cx="25" cy="20" rx="8" ry="6" fill="#9370db" transform="rotate(-15 25 20)"/>
        <path d="M32 18 L32 5" stroke="#9370db" stroke-width="2"/>
        <path d="M32 5 Q42 3 46 6 Q42 10 32 8" fill="#9370db"/>
        <text x="60" y="18" font-size="11" fill="#40e0d0" font-weight="bold">A4</text>
      </svg>`,
      demoType: 'note'
    },
    scale: {
      title: 'Scale',
      text: 'An ordered sequence of notes spanning an octave with specific intervals between them. The major scale (Do-Re-Mi-Fa-Sol-La-Ti-Do) follows a pattern of whole and half steps. Different scales (major, minor, pentatonic) create different moods and styles.',
      visual: `<svg viewBox="0 0 100 30" fill="none">
        <circle cx="12" cy="24" r="3" fill="#40e0d0"/>
        <circle cx="27" cy="20" r="3" fill="#40e0d0"/>
        <circle cx="42" cy="16" r="3" fill="#9370db"/>
        <circle cx="57" cy="12" r="3" fill="#40e0d0"/>
        <circle cx="72" cy="8" r="3" fill="#40e0d0"/>
        <circle cx="87" cy="4" r="3" fill="#ff69b4"/>
      </svg>`,
      demoType: 'scale'
    },
    octave: {
      title: 'Octave',
      text: 'The interval where frequency exactly doubles (ratio 2:1). A3=220 Hz → A4=440 Hz → A5=880 Hz. Notes one octave apart share the same letter name and sound "equivalent" but higher or lower. This 2:1 ratio is why the 12-note pattern repeats on a piano.',
      visual: `<svg viewBox="0 0 100 30" fill="none">
        <path d="M10 22 Q25 10 40 22" stroke="#9370db" stroke-width="2" fill="none"/>
        <path d="M40 22 Q55 10 70 22" stroke="#40e0d0" stroke-width="2" fill="none"/>
        <text x="25" y="28" font-size="7" fill="#9370db" font-weight="bold">1×</text>
        <text x="55" y="28" font-size="7" fill="#40e0d0" font-weight="bold">2×</text>
      </svg>`,
      demoType: 'octave'
    },
    intervals: {
      title: 'Intervals',
      text: 'The distance between two notes, measured in semitones. Perfect 5th (7 semitones) sounds powerful—the "power chord." Major 3rd (4 semitones) sounds happy and bright. Minor 3rd (3 semitones) sounds sad. Perfect 4th (5 semitones) sounds stable. These interval "flavors" are the building blocks of chords and melodies.',
      visual: `<svg viewBox="0 0 100 30" fill="none">
        <circle cx="20" cy="20" r="6" fill="#9370db" opacity="0.8"/>
        <circle cx="50" cy="12" r="6" fill="#40e0d0" opacity="0.8"/>
        <path d="M26 18 L44 14" stroke="#ff69b4" stroke-width="2" stroke-dasharray="3,2"/>
        <text x="65" y="18" font-size="8" fill="#ff69b4" font-weight="bold">5th</text>
      </svg>`,
      demoType: 'intervals'
    }
  };

  // Music School DOM elements
  const musicSchoolSection = document.getElementById('musicSchoolSection');
  const conceptSelect = document.getElementById('conceptSelect');
  const conceptExplanation = document.getElementById('conceptExplanation');
  const explanationClose = document.getElementById('explanationClose');
  const explanationVisual = document.getElementById('explanationVisual');
  const explanationTitle = document.getElementById('explanationTitle');
  const explanationText = document.getElementById('explanationText');
  const explanationDemo = document.getElementById('explanationDemo');

  let activeSchoolOscillator = null;
  let activeSchoolGain = null;
  let schoolDemoHighlightedKeys = [];

  function showConceptExplanation(concept) {
    const data = musicSchoolConcepts[concept];
    if (!data) return;

    // Stop any playing demo when switching concepts
    stopSchoolDemo();

    // Populate explanation
    explanationVisual.innerHTML = data.visual;
    explanationTitle.textContent = data.title;
    explanationText.textContent = data.text;

    // Create demo button based on type
    explanationDemo.innerHTML = '';
    const demoBtn = document.createElement('button');
    demoBtn.className = 'demo-btn';
    
    switch(data.demoType) {
      case 'frequency':
        demoBtn.innerHTML = '🔊 Low→High';
        demoBtn.addEventListener('click', () => playFrequencyDemo(demoBtn));
        break;
      case 'vibrato':
        demoBtn.innerHTML = '🔊 Vibrato';
        demoBtn.addEventListener('click', () => playVibratoDemo(demoBtn));
        break;
      case 'harmonics':
        demoBtn.innerHTML = '🔊 Harmonics';
        demoBtn.addEventListener('click', () => playHarmonicsDemo(demoBtn));
        break;
      case 'overtones':
        demoBtn.innerHTML = '🔊 Overtones';
        demoBtn.addEventListener('click', () => playOvertonesDemo(demoBtn));
        break;
      case 'timbre':
        demoBtn.innerHTML = '🔊 Compare Timbres';
        demoBtn.addEventListener('click', () => playTimbreDemo(demoBtn));
        break;
      case 'tone':
        demoBtn.innerHTML = '🔊 Pure Tone';
        demoBtn.addEventListener('click', () => playToneDemo(demoBtn));
        break;
      case 'note':
        demoBtn.innerHTML = '🔊 Play Notes';
        demoBtn.addEventListener('click', () => playNoteDemo(demoBtn));
        break;
      case 'scale':
        demoBtn.innerHTML = '🔊 Play Scale';
        demoBtn.addEventListener('click', () => playScaleDemo(demoBtn));
        break;
      case 'octave':
        demoBtn.innerHTML = '🔊 Octaves';
        demoBtn.addEventListener('click', () => playOctaveDemo(demoBtn));
        break;
      case 'intervals':
        demoBtn.innerHTML = '🔊 Play Intervals';
        demoBtn.addEventListener('click', () => playIntervalsDemo(demoBtn));
        break;
    }
    
    explanationDemo.appendChild(demoBtn);
    conceptExplanation.classList.add('active');
  }

  function hideConceptExplanation() {
    conceptExplanation.classList.remove('active');
    if (conceptSelect) conceptSelect.value = '';
    stopSchoolDemo();
  }

  function ensureSchoolAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  // Highlight piano key for a frequency
  function highlightSchoolKey(frequency) {
    const keySpan = getKeySpanForFrequency(frequency);
    if (keySpan?.key?.element) {
      keySpan.key.element.classList.add('school-demo-active');
      schoolDemoHighlightedKeys.push(keySpan.key.element);
    }
  }

  // Clear all school demo highlights
  function clearSchoolKeyHighlights() {
    schoolDemoHighlightedKeys.forEach(el => {
      el.classList.remove('school-demo-active');
    });
    schoolDemoHighlightedKeys = [];
  }

  let schoolDemoTimeout = null;
  
  // FREQUENCY DEMO: Variables for fill animation
  let schoolFillAnimationFrame = null;
  let schoolCurrentFillingKey = null;
  
  // Clear filling key highlight
  function clearSchoolFillingKey() {
    if (schoolCurrentFillingKey) {
      schoolCurrentFillingKey.classList.remove('is-left', 'school-demo-filling');
      schoolCurrentFillingKey.style.removeProperty('--left-fill');
      schoolCurrentFillingKey.style.removeProperty('--left-highlight');
      schoolCurrentFillingKey = null;
    }
    if (schoolFillAnimationFrame) {
      cancelAnimationFrame(schoolFillAnimationFrame);
      schoolFillAnimationFrame = null;
    }
  }
  
  function stopSchoolDemo() {
    if (schoolDemoTimeout) {
      clearTimeout(schoolDemoTimeout);
      schoolDemoTimeout = null;
    }
    clearSchoolKeyHighlights();
    clearSchoolFillingKey(); // Clear frequency fill animation
    if (activeSchoolOscillator) {
      try { activeSchoolOscillator.stop(); activeSchoolOscillator.disconnect(); } catch(e) {}
      activeSchoolOscillator = null;
    }
    if (activeSchoolGain) {
      try { activeSchoolGain.disconnect(); } catch(e) {}
      activeSchoolGain = null;
    }
    document.querySelectorAll('.demo-btn.playing').forEach(b => b.classList.remove('playing'));
  }
  
  function playFrequencyDemo(btn) {
    stopSchoolDemo();
    clearSchoolFillingKey();
    ensureSchoolAudio();
    btn.classList.add('playing');

    if (!pianoKeys.length) {
      btn.classList.remove('playing');
      return;
    }
    
    // Use A3 (220 Hz) to A4 (440 Hz) - one octave range
    const startFreq = 220; // A3
    const endFreq = 440;   // A4
    
    // Sweep audio from A3 to A4
    activeSchoolGain = audioCtx.createGain();
    activeSchoolGain.connect(audioCtx.destination);
    activeSchoolGain.gain.setValueAtTime(0, audioCtx.currentTime);
    activeSchoolGain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.1);

    activeSchoolOscillator = audioCtx.createOscillator();
    activeSchoolOscillator.type = 'sine';
    activeSchoolOscillator.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
    activeSchoolOscillator.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + 5);
    activeSchoolOscillator.connect(activeSchoolGain);
    activeSchoolOscillator.start();

    // Animate fill across A3 to A4 over 5 seconds
    const duration = 5000;
    const startTime = performance.now();
    let lastKeyEl = null;
    
    // Color interpolation from low (purple) to high (orange/pink)
    function getFrequencyColor(progress) {
      const r = Math.round(120 + progress * 135); // 120 -> 255
      const g = Math.round(80 - progress * 30);   // 80 -> 50
      const b = Math.round(200 - progress * 120); // 200 -> 80
      return `rgb(${r}, ${g}, ${b})`;
    }
    
    function animateFill(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      // Calculate current frequency (exponential interpolation to match audio)
      const currentFreq = startFreq * Math.pow(endFreq / startFreq, progress);
      
      // Find which key this frequency falls on
      const keySpan = getKeySpanForFrequency(currentFreq);
      if (!keySpan?.key?.element) {
        if (progress < 1) {
          schoolFillAnimationFrame = requestAnimationFrame(animateFill);
        }
        return;
      }
      
      const keyEl = keySpan.key.element;
      const fillRatio = keySpan.ratio;
      const color = getFrequencyColor(progress);
      
      // If we moved to a new key, clear the previous one
      if (lastKeyEl && lastKeyEl !== keyEl) {
        lastKeyEl.classList.remove('is-left', 'school-demo-filling');
        lastKeyEl.style.removeProperty('--left-fill');
        lastKeyEl.style.removeProperty('--left-highlight');
      }
      
      // Setup current key
      if (lastKeyEl !== keyEl) {
        keyEl.classList.add('is-left', 'school-demo-filling');
        keyEl.classList.remove('is-overtone');
        schoolCurrentFillingKey = keyEl;
        lastKeyEl = keyEl;
      }
      
      // Update current key's fill level and color
      keyEl.style.setProperty('--left-fill', fillRatio.toFixed(3));
      keyEl.style.setProperty('--left-highlight', color);
      
      if (progress < 1) {
        schoolFillAnimationFrame = requestAnimationFrame(animateFill);
      }
    }
    
    schoolFillAnimationFrame = requestAnimationFrame(animateFill);

    schoolDemoTimeout = setTimeout(() => {
      activeSchoolGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
      setTimeout(() => {
        clearSchoolFillingKey();
        stopSchoolDemo();
        btn.classList.remove('playing');
      }, 350);
    }, 5200);
  }

  // VIBRATO DEMO: Play a note with pitch wobble to show vibration
  function playVibratoDemo(btn) {
    stopSchoolDemo();
    ensureSchoolAudio();
    btn.classList.add('playing');
    
    const baseFreq = 440;
    highlightSchoolKey(baseFreq);
    
    activeSchoolGain = audioCtx.createGain();
    activeSchoolGain.connect(audioCtx.destination);
    activeSchoolGain.gain.setValueAtTime(0, audioCtx.currentTime);
    activeSchoolGain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.1);

    activeSchoolOscillator = audioCtx.createOscillator();
    activeSchoolOscillator.type = 'sine';
    activeSchoolOscillator.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
    
    // Create vibrato with LFO
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 6; // 6 Hz vibrato rate
    lfoGain.gain.value = 15; // ±15 Hz pitch variation
    lfo.connect(lfoGain);
    lfoGain.connect(activeSchoolOscillator.frequency);
    
    activeSchoolOscillator.connect(activeSchoolGain);
    activeSchoolOscillator.start();
    lfo.start();

    schoolDemoTimeout = setTimeout(() => {
      activeSchoolGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
      setTimeout(() => {
        try { lfo.stop(); lfo.disconnect(); } catch(e) {}
        stopSchoolDemo();
        btn.classList.remove('playing');
      }, 250);
    }, 1500);
  }

  // HARMONICS DEMO: Play fundamental then add harmonics one by one (exact multiples)
  function playHarmonicsDemo(btn) {
    stopSchoolDemo();
    ensureSchoolAudio();
    btn.classList.add('playing');

    const fundamental = 220;
    const oscillators = [];
    const gains = [];
    
    const masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = 0.3;

    // Start with just fundamental
    highlightSchoolKey(fundamental);
    
    function addHarmonic(mult, delay) {
      schoolDemoTimeout = setTimeout(() => {
        highlightSchoolKey(fundamental * mult);
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = fundamental * mult;
        gain.gain.value = 0.4 / mult;
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
        oscillators.push(osc);
        gains.push(gain);
      }, delay);
    }

    // Add harmonics progressively (exact integer multiples)
    addHarmonic(1, 0);
    addHarmonic(2, 400);
    addHarmonic(3, 800);
    addHarmonic(4, 1200);

    schoolDemoTimeout = setTimeout(() => {
      masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
      setTimeout(() => {
        oscillators.forEach(o => { try { o.stop(); o.disconnect(); } catch(e) {} });
        gains.forEach(g => g.disconnect());
        masterGain.disconnect();
        clearSchoolKeyHighlights();
        btn.classList.remove('playing');
      }, 350);
    }, 2200);
  }

  // OVERTONES DEMO: Play each overtone individually then combine them
  function playOvertonesDemo(btn) {
    stopSchoolDemo();
    ensureSchoolAudio();
    btn.classList.add('playing');

    const fundamental = 220; // A3
    const overtones = [1, 2, 3, 4, 5, 6]; // Fundamental + 5 overtones
    const amplitudes = [0.3, 0.2, 0.15, 0.12, 0.1, 0.08];
    let index = 0;
    const oscillators = [];
    const gains = [];
    
    const masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = 1;

    // Play each overtone one at a time, then hold all together
    function playNextOvertone() {
      if (index >= overtones.length) {
        // All overtones now playing together - let them ring
        schoolDemoTimeout = setTimeout(() => {
          masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
          setTimeout(() => {
            oscillators.forEach(o => { try { o.stop(); o.disconnect(); } catch(e) {} });
            gains.forEach(g => g.disconnect());
            masterGain.disconnect();
            clearSchoolKeyHighlights();
            btn.classList.remove('playing');
          }, 450);
        }, 800);
        return;
      }

      const mult = overtones[index];
      const freq = fundamental * mult;
      
      highlightSchoolKey(freq);
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(amplitudes[index], audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      oscillators.push(osc);
      gains.push(gain);
      
      index++;
      schoolDemoTimeout = setTimeout(playNextOvertone, 350);
    }

    playNextOvertone();
  }

  // TONE DEMO: Play a pure, steady sine wave
  function playToneDemo(btn) {
    stopSchoolDemo();
    ensureSchoolAudio();
    btn.classList.add('playing');
    
    const freq = 440;
    highlightSchoolKey(freq);
    
    activeSchoolGain = audioCtx.createGain();
    activeSchoolGain.connect(audioCtx.destination);
    activeSchoolGain.gain.setValueAtTime(0, audioCtx.currentTime);
    activeSchoolGain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.1);

    activeSchoolOscillator = audioCtx.createOscillator();
    activeSchoolOscillator.type = 'sine';
    activeSchoolOscillator.frequency.value = freq;
    activeSchoolOscillator.connect(activeSchoolGain);
    activeSchoolOscillator.start();

    schoolDemoTimeout = setTimeout(() => {
      activeSchoolGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
      setTimeout(() => {
        stopSchoolDemo();
        btn.classList.remove('playing');
      }, 250);
    }, 1500);
  }

  // TIMBRE DEMO: Play same note with different waveforms to show timbre differences
  function playTimbreDemo(btn) {
    stopSchoolDemo();
    ensureSchoolAudio();
    btn.classList.add('playing');
    
    const freq = 440; // A4
    const waveforms = ['sine', 'triangle', 'square', 'sawtooth'];
    let index = 0;
    
    function playNextTimbre() {
      if (index >= waveforms.length) {
        clearSchoolDemoHighlights();
        btn.classList.remove('playing');
        return;
      }
      
      highlightSchoolKey(freq);
      
      activeSchoolGain = audioCtx.createGain();
      activeSchoolGain.connect(audioCtx.destination);
      activeSchoolGain.gain.setValueAtTime(0, audioCtx.currentTime);
      activeSchoolGain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);

      activeSchoolOscillator = audioCtx.createOscillator();
      activeSchoolOscillator.type = waveforms[index];
      activeSchoolOscillator.frequency.value = freq;
      activeSchoolOscillator.connect(activeSchoolGain);
      activeSchoolOscillator.start();

      schoolDemoTimeout = setTimeout(() => {
        activeSchoolGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
        setTimeout(() => {
          if (activeSchoolOscillator) {
            activeSchoolOscillator.stop();
            activeSchoolOscillator = null;
          }
          index++;
          schoolDemoTimeout = setTimeout(playNextTimbre, 200);
        }, 150);
      }, 600);
    }
    
    playNextTimbre();
  }

  // NOTE DEMO: Play C, E, G notes showing different named pitches
  function playNoteDemo(btn) {
    stopSchoolDemo();
    ensureSchoolAudio();
    btn.classList.add('playing');

    // C4, E4, G4 (a chord broken up)
    const notes = [261.63, 329.63, 392.00];
    let index = 0;

    function playNext() {
      clearSchoolKeyHighlights();
      if (index >= notes.length) {
        btn.classList.remove('playing');
        return;
      }
      highlightSchoolKey(notes[index]);
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = notes[index];
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
      
      index++;
      schoolDemoTimeout = setTimeout(playNext, 450);
    }
    playNext();
  }

  // SCALE DEMO: Play C major scale
  function playScaleDemo(btn) {
    stopSchoolDemo();
    ensureSchoolAudio();
    btn.classList.add('playing');

    const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    let index = 0;

    function playNext() {
      clearSchoolKeyHighlights();
      if (index >= scale.length) {
        btn.classList.remove('playing');
        return;
      }
      highlightSchoolKey(scale[index]);
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = scale[index];
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.22, audioCtx.currentTime + 0.03);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.22);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
      
      index++;
      schoolDemoTimeout = setTimeout(playNext, 280);
    }
    playNext();
  }

  // OCTAVE DEMO: Play same note across 3 octaves
  function playOctaveDemo(btn) {
    stopSchoolDemo();
    ensureSchoolAudio();
    btn.classList.add('playing');

    const octaves = [220, 440, 880]; // A3, A4, A5
    let index = 0;

    function playNext() {
      clearSchoolKeyHighlights();
      if (index >= octaves.length) {
        btn.classList.remove('playing');
        return;
      }
      highlightSchoolKey(octaves[index]);
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = octaves[index];
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
      
      index++;
      schoolDemoTimeout = setTimeout(playNext, 550);
    }
    playNext();
  }

  // INTERVALS DEMO: Play common musical intervals with fill animation
  function playIntervalsDemo(btn) {
    stopSchoolDemo();
    clearSchoolFillingKey();
    ensureSchoolAudio();
    btn.classList.add('playing');

    const rootC = 261.63; // C4
    // Intervals: [name, semitones, color1, color2]
    const intervals = [
      { name: 'Minor 2nd', semitones: 1, color1: '#e74c3c', color2: '#c0392b' },
      { name: 'Major 3rd', semitones: 4, color1: '#f39c12', color2: '#f1c40f' },
      { name: 'Minor 3rd', semitones: 3, color1: '#9b59b6', color2: '#8e44ad' },
      { name: 'Perfect 4th', semitones: 5, color1: '#27ae60', color2: '#2ecc71' },
      { name: 'Perfect 5th', semitones: 7, color1: '#1abc9c', color2: '#16a085' },
      { name: 'Octave', semitones: 12, color1: '#9370db', color2: '#9370db' }
    ];
    let index = 0;
    let intervalFilledKeys = [];

    function clearIntervalFillsLocal() {
      intervalFilledKeys.forEach(el => {
        el.classList.remove('is-left', 'is-right', 'school-demo-filling');
        el.style.removeProperty('--left-fill');
        el.style.removeProperty('--left-highlight');
        el.style.removeProperty('--right-fill');
        el.style.removeProperty('--right-highlight');
      });
      intervalFilledKeys = [];
    }

    function playNextInterval() {
      clearSchoolKeyHighlights();
      clearIntervalFillsLocal();
      
      if (index >= intervals.length) {
        btn.classList.remove('playing');
        return;
      }
      
      const interval = intervals[index];
      const freq2 = rootC * Math.pow(2, interval.semitones / 12);
      
      // Fill keys with colors based on frequency
      const keySpan1 = getKeySpanForFrequency(rootC);
      const keySpan2 = getKeySpanForFrequency(freq2);
      
      if (keySpan1?.key?.element) {
        const keyEl1 = keySpan1.key.element;
        keyEl1.classList.add('is-left', 'school-demo-filling');
        keyEl1.style.setProperty('--left-fill', keySpan1.ratio.toFixed(3));
        keyEl1.style.setProperty('--left-highlight', interval.color1);
        intervalFilledKeys.push(keyEl1);
      }
      
      if (keySpan2?.key?.element) {
        const keyEl2 = keySpan2.key.element;
        keyEl2.classList.add('is-right', 'school-demo-filling');
        keyEl2.style.setProperty('--right-fill', keySpan2.ratio.toFixed(3));
        keyEl2.style.setProperty('--right-highlight', interval.color2);
        intervalFilledKeys.push(keyEl2);
      }
      
      // Play root note
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.value = rootC;
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      gain1.gain.setValueAtTime(0, audioCtx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
      gain1.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.9);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 1);
      
      // Play interval note
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = freq2;
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      gain2.gain.setValueAtTime(0, audioCtx.currentTime);
      gain2.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
      gain2.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.9);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 1);
      
      index++;
      schoolDemoTimeout = setTimeout(playNextInterval, 1200);
    }
    playNextInterval();
  }

  // ===== MUSIC THEORY DEMO =====
  
  const theoryDemoBtn = document.getElementById('theoryDemoBtn');
  const theoryDemoOverlay = document.getElementById('theoryDemoOverlay');
  const theoryDemoLabel = document.getElementById('theoryDemoLabel');
  const theoryDemoBtnText = theoryDemoBtn?.querySelector('.demo-text');
  
  let theoryDemoRunning = false;
  let theoryDemoTimeouts = [];
  let theoryDemoOscillators = [];
  let theoryDemoGains = [];
  
  function updateTheoryDemoLabel(text) {
    if (theoryDemoLabel) {
      theoryDemoLabel.textContent = text;
    }
    if (theoryDemoOverlay) {
      theoryDemoOverlay.hidden = false;
    }
  }
  
  function clearTheoryDemoLabel() {
    if (theoryDemoOverlay) {
      theoryDemoOverlay.hidden = true;
    }
  }
  
  function theoryDemoWait(ms) {
    return new Promise(resolve => {
      const timeout = setTimeout(resolve, ms);
      theoryDemoTimeouts.push(timeout);
    });
  }
  
  function stopTheoryDemo() {
    theoryDemoRunning = false;
    
    // Clear all timeouts
    theoryDemoTimeouts.forEach(t => clearTimeout(t));
    theoryDemoTimeouts = [];
    
    // Stop all oscillators
    theoryDemoOscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch(e) {}
    });
    theoryDemoOscillators = [];
    
    // Disconnect gains
    theoryDemoGains.forEach(gain => {
      try { gain.disconnect(); } catch(e) {}
    });
    theoryDemoGains = [];
    
    // Clear school demo state
    stopSchoolDemo();
    clearSchoolKeyHighlights();
    
    // Update UI
    if (theoryDemoBtn) {
      theoryDemoBtn.classList.remove('is-running');
    }
    if (theoryDemoBtnText) {
      theoryDemoBtnText.textContent = 'Demo';
    }
    clearTheoryDemoLabel();
  }
  
  function endTheoryDemo() {
    theoryDemoRunning = false;
    
    if (theoryDemoBtn) {
      theoryDemoBtn.classList.remove('is-running');
    }
    if (theoryDemoBtnText) {
      theoryDemoBtnText.textContent = 'Demo';
    }
    
    updateTheoryDemoLabel("✨ Demo Complete — Explore the topics above!");
    
    setTimeout(() => {
      clearTheoryDemoLabel();
      clearSchoolKeyHighlights();
    }, 3000);
  }
  
  async function runTheoryDemo() {
    if (!theoryDemoRunning) return;
    
    ensureSchoolAudio();
    
    // Helper to play a single note with highlight
    function playNote(freq, duration, volume = 0.22) {
      clearSchoolKeyHighlights();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration - 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
      theoryDemoOscillators.push(osc);
      theoryDemoGains.push(gain);
      highlightSchoolKey(freq);
    }
    
    // Helper to create sustained note
    function sustainNote(freq, volume = 0.2) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.15);
      osc.start();
      theoryDemoOscillators.push(osc);
      theoryDemoGains.push(gain);
      highlightSchoolKey(freq);
      return { osc, gain };
    }
    
    // Helper to fade out
    function fadeOut(noteObj, duration = 0.4) {
      if (noteObj?.gain) {
        noteObj.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
        setTimeout(() => { try { noteObj.osc.stop(); } catch(e) {} }, duration * 1000 + 50);
      }
    }
    
    // ========== INTRO ==========
    if (!theoryDemoRunning) return;
    updateTheoryDemoLabel("🎓 Welcome to Music Theory");
    await theoryDemoWait(2500);
    
    // ========== 1. TONE ==========
    if (!theoryDemoRunning) return;
    clearSchoolKeyHighlights();
    updateTheoryDemoLabel("TONE — A single pure sound");
    await theoryDemoWait(800);
    const toneNote = sustainNote(440, 0.25);
    await theoryDemoWait(2500);
    fadeOut(toneNote, 0.5);
    await theoryDemoWait(1000);
    
    // ========== 2. FREQUENCY ==========
    if (!theoryDemoRunning) return;
    clearSchoolKeyHighlights();
    clearSchoolFillingKey();
    updateTheoryDemoLabel("FREQUENCY — Low pitch to high pitch");
    await theoryDemoWait(800);
    
    // Sweep from low to high: A3 → A4 with fill animation like playFrequencyDemo
    const startFreq = 220;
    const endFreq = 440;
    const sweepDuration = 4000;
    
    const sweepOsc = audioCtx.createOscillator();
    const sweepGain = audioCtx.createGain();
    sweepOsc.type = 'sine';
    sweepOsc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
    sweepOsc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + sweepDuration / 1000);
    sweepOsc.connect(sweepGain);
    sweepGain.connect(audioCtx.destination);
    sweepGain.gain.setValueAtTime(0, audioCtx.currentTime);
    sweepGain.gain.linearRampToValueAtTime(0.22, audioCtx.currentTime + 0.1);
    sweepGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + sweepDuration / 1000 + 0.2);
    sweepOsc.start();
    sweepOsc.stop(audioCtx.currentTime + sweepDuration / 1000 + 0.5);
    theoryDemoOscillators.push(sweepOsc);
    theoryDemoGains.push(sweepGain);
    
    // Fill animation - same as playFrequencyDemo
    const sweepStartTime = performance.now();
    let lastFillingKey = null;
    
    function getFreqColor(progress) {
      const r = Math.round(120 + progress * 135);
      const g = Math.round(80 - progress * 30);
      const b = Math.round(200 - progress * 120);
      return `rgb(${r}, ${g}, ${b})`;
    }
    
    function animateFreqFill() {
      if (!theoryDemoRunning) return;
      const elapsed = performance.now() - sweepStartTime;
      const progress = Math.min(1, elapsed / sweepDuration);
      
      // Calculate current frequency (exponential interpolation)
      const currentFreq = startFreq * Math.pow(endFreq / startFreq, progress);
      
      // Find which key this frequency falls on
      const keySpan = getKeySpanForFrequency(currentFreq);
      if (!keySpan?.key?.element) {
        if (progress < 1) requestAnimationFrame(animateFreqFill);
        return;
      }
      
      const keyEl = keySpan.key.element;
      const fillRatio = keySpan.ratio;
      const color = getFreqColor(progress);
      
      // If we moved to a new key, clear the previous one
      if (lastFillingKey && lastFillingKey !== keyEl) {
        lastFillingKey.classList.remove('is-left', 'school-demo-filling');
        lastFillingKey.style.removeProperty('--left-fill');
        lastFillingKey.style.removeProperty('--left-highlight');
      }
      
      // Setup current key with fill
      if (lastFillingKey !== keyEl) {
        keyEl.classList.add('is-left', 'school-demo-filling');
        keyEl.classList.remove('is-overtone');
        schoolCurrentFillingKey = keyEl;
        lastFillingKey = keyEl;
      }
      
      // Update fill level and color
      keyEl.style.setProperty('--left-fill', fillRatio.toFixed(3));
      keyEl.style.setProperty('--left-highlight', color);
      
      if (progress < 1) {
        requestAnimationFrame(animateFreqFill);
      }
    }
    
    requestAnimationFrame(animateFreqFill);
    await theoryDemoWait(sweepDuration + 500);
    
    // Clean up fill animation
    if (lastFillingKey) {
      lastFillingKey.classList.remove('is-left', 'school-demo-filling');
      lastFillingKey.style.removeProperty('--left-fill');
      lastFillingKey.style.removeProperty('--left-highlight');
    }
    clearSchoolFillingKey();
    clearSchoolKeyHighlights();
    await theoryDemoWait(800);
    
    // ========== 3. NOTE ==========
    if (!theoryDemoRunning) return;
    updateTheoryDemoLabel("NOTE — Named pitches: A, B, C...");
    await theoryDemoWait(800);
    
    playNote(440, 0.6, 0.22); // A
    await theoryDemoWait(700);
    if (!theoryDemoRunning) return;
    
    playNote(493.88, 0.6, 0.22); // B
    await theoryDemoWait(700);
    if (!theoryDemoRunning) return;
    
    playNote(523.25, 0.6, 0.22); // C
    await theoryDemoWait(1000);
    clearSchoolKeyHighlights();
    
    // ========== 4. OCTAVE ==========
    if (!theoryDemoRunning) return;
    updateTheoryDemoLabel("OCTAVE — Same note, double frequency");
    await theoryDemoWait(800);
    
    playNote(220, 0.7, 0.2); // A3
    await theoryDemoWait(800);
    if (!theoryDemoRunning) return;
    
    playNote(440, 0.7, 0.2); // A4
    await theoryDemoWait(800);
    if (!theoryDemoRunning) return;
    
    playNote(880, 0.7, 0.2); // A5
    await theoryDemoWait(1000);
    
    // All together
    if (!theoryDemoRunning) return;
    clearSchoolKeyHighlights();
    updateTheoryDemoLabel("OCTAVE — All three A's together");
    await theoryDemoWait(500);
    const oct1 = sustainNote(220, 0.12);
    const oct2 = sustainNote(440, 0.12);
    const oct3 = sustainNote(880, 0.1);
    await theoryDemoWait(2500);
    fadeOut(oct1, 0.5);
    fadeOut(oct2, 0.5);
    fadeOut(oct3, 0.5);
    await theoryDemoWait(1000);
    
    // ========== 5. SCALE ==========
    if (!theoryDemoRunning) return;
    clearSchoolKeyHighlights();
    updateTheoryDemoLabel("SCALE — C Major: Do Re Mi Fa Sol La Ti Do");
    await theoryDemoWait(800);
    
    const scaleNotes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    for (const freq of scaleNotes) {
      if (!theoryDemoRunning) return;
      playNote(freq, 0.35, 0.22);
      await theoryDemoWait(380);
    }
    await theoryDemoWait(800);
    clearSchoolKeyHighlights();
    
    // ========== 6. INTERVALS ==========
    // Helper to fill keys for interval with proper colors
    function fillIntervalKeys(freq1, freq2, color1, color2) {
      clearSchoolKeyHighlights();
      clearSchoolFillingKey();
      
      const keySpan1 = getKeySpanForFrequency(freq1);
      const keySpan2 = getKeySpanForFrequency(freq2);
      
      if (keySpan1?.key?.element) {
        const keyEl1 = keySpan1.key.element;
        keyEl1.classList.add('is-left', 'school-demo-filling');
        keyEl1.style.setProperty('--left-fill', keySpan1.ratio.toFixed(3));
        keyEl1.style.setProperty('--left-highlight', color1);
      }
      
      if (keySpan2?.key?.element) {
        const keyEl2 = keySpan2.key.element;
        keyEl2.classList.add('is-right', 'school-demo-filling');
        keyEl2.style.setProperty('--right-fill', keySpan2.ratio.toFixed(3));
        keyEl2.style.setProperty('--right-highlight', color2);
      }
    }
    
    function clearIntervalFills() {
      document.querySelectorAll('.school-demo-filling').forEach(el => {
        el.classList.remove('is-left', 'is-right', 'school-demo-filling');
        el.style.removeProperty('--left-fill');
        el.style.removeProperty('--left-highlight');
        el.style.removeProperty('--right-fill');
        el.style.removeProperty('--right-highlight');
      });
    }
    
    // Helper to play interval with fill animation
    function playIntervalWithFill(freq1, freq2, duration, color1, color2, vol = 0.15) {
      clearIntervalFills();
      fillIntervalKeys(freq1, freq2, color1, color2);
      
      // Note 1
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.value = freq1;
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      gain1.gain.setValueAtTime(0, audioCtx.currentTime);
      gain1.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.05);
      gain1.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration - 0.1);
      osc1.start();
      osc1.stop(audioCtx.currentTime + duration);
      theoryDemoOscillators.push(osc1);
      theoryDemoGains.push(gain1);
      
      // Note 2
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = freq2;
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      gain2.gain.setValueAtTime(0, audioCtx.currentTime);
      gain2.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.05);
      gain2.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration - 0.1);
      osc2.start();
      osc2.stop(audioCtx.currentTime + duration);
      theoryDemoOscillators.push(osc2);
      theoryDemoGains.push(gain2);
    }
    
    if (!theoryDemoRunning) return;
    updateTheoryDemoLabel("INTERVALS — The distance between two notes");
    await theoryDemoWait(1500);
    
    // C4 = 261.63 Hz as root note
    const rootC = 261.63;
    
    // Minor 2nd (1 semitone) - dissonant, tense - red/orange for dissonance
    if (!theoryDemoRunning) return;
    updateTheoryDemoLabel("INTERVAL — Minor 2nd (tense, dissonant)");
    await theoryDemoWait(600);
    playIntervalWithFill(rootC, rootC * Math.pow(2, 1/12), 1.2, '#e74c3c', '#c0392b');
    await theoryDemoWait(1500);
    
    // Major 3rd (4 semitones) - happy, bright - yellow/gold
    if (!theoryDemoRunning) return;
    clearIntervalFills();
    updateTheoryDemoLabel("INTERVAL — Major 3rd (happy, bright)");
    await theoryDemoWait(600);
    playIntervalWithFill(rootC, rootC * Math.pow(2, 4/12), 1.2, '#f39c12', '#f1c40f');
    await theoryDemoWait(1500);
    
    // Minor 3rd (3 semitones) - sad, dark - blue/purple
    if (!theoryDemoRunning) return;
    clearIntervalFills();
    updateTheoryDemoLabel("INTERVAL — Minor 3rd (sad, melancholic)");
    await theoryDemoWait(600);
    playIntervalWithFill(rootC, rootC * Math.pow(2, 3/12), 1.2, '#9b59b6', '#8e44ad');
    await theoryDemoWait(1500);
    
    // Perfect 4th (5 semitones) - stable, church-like - green
    if (!theoryDemoRunning) return;
    clearIntervalFills();
    updateTheoryDemoLabel("INTERVAL — Perfect 4th (stable, pure)");
    await theoryDemoWait(600);
    playIntervalWithFill(rootC, rootC * Math.pow(2, 5/12), 1.2, '#27ae60', '#2ecc71');
    await theoryDemoWait(1500);
    
    // Perfect 5th (7 semitones) - powerful, open - cyan/teal
    if (!theoryDemoRunning) return;
    clearIntervalFills();
    updateTheoryDemoLabel("INTERVAL — Perfect 5th (powerful, the 'power chord')");
    await theoryDemoWait(600);
    playIntervalWithFill(rootC, rootC * Math.pow(2, 7/12), 1.2, '#1abc9c', '#16a085');
    await theoryDemoWait(1500);
    
    // Octave (12 semitones) - same note, perfect consonance - matching purple
    if (!theoryDemoRunning) return;
    clearIntervalFills();
    updateTheoryDemoLabel("INTERVAL — Octave (perfect unity)");
    await theoryDemoWait(600);
    playIntervalWithFill(rootC, rootC * 2, 1.2, '#9370db', '#9370db');
    await theoryDemoWait(1500);
    
    clearIntervalFills();
    clearSchoolKeyHighlights();
    await theoryDemoWait(500);
    
    // ========== 7. HARMONICS ==========
    if (!theoryDemoRunning) return;
    updateTheoryDemoLabel("HARMONICS — Building sound with multiples");
    await theoryDemoWait(1000);
    
    const fund = 220;
    clearSchoolKeyHighlights();
    const h1 = sustainNote(fund * 1, 0.25);
    await theoryDemoWait(800);
    if (!theoryDemoRunning) return;
    
    const h2 = sustainNote(fund * 2, 0.12);
    await theoryDemoWait(800);
    if (!theoryDemoRunning) return;
    
    const h3 = sustainNote(fund * 3, 0.08);
    await theoryDemoWait(800);
    if (!theoryDemoRunning) return;
    
    const h4 = sustainNote(fund * 4, 0.06);
    await theoryDemoWait(1500);
    
    if (!theoryDemoRunning) return;
    updateTheoryDemoLabel("HARMONICS — Rich, complex tone");
    await theoryDemoWait(2000);
    
    fadeOut(h4, 0.6);
    fadeOut(h3, 0.6);
    fadeOut(h2, 0.6);
    fadeOut(h1, 0.6);
    await theoryDemoWait(1200);
    clearSchoolKeyHighlights();
    
    // ========== 8. VIBRATIONS ==========
    if (!theoryDemoRunning) return;
    updateTheoryDemoLabel("VIBRATIONS — Sound waves pulsing");
    await theoryDemoWait(800);
    
    const vibOsc = audioCtx.createOscillator();
    const vibGain = audioCtx.createGain();
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    
    vibOsc.type = 'sine';
    vibOsc.frequency.value = 440;
    lfo.type = 'sine';
    lfo.frequency.value = 6;
    lfoGain.gain.value = 12;
    
    lfo.connect(lfoGain);
    lfoGain.connect(vibOsc.frequency);
    vibOsc.connect(vibGain);
    vibGain.connect(audioCtx.destination);
    vibGain.gain.setValueAtTime(0, audioCtx.currentTime);
    vibGain.gain.linearRampToValueAtTime(0.22, audioCtx.currentTime + 0.1);
    
    vibOsc.start();
    lfo.start();
    theoryDemoOscillators.push(vibOsc, lfo);
    theoryDemoGains.push(vibGain, lfoGain);
    highlightSchoolKey(440);
    
    await theoryDemoWait(2500);
    vibGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    await theoryDemoWait(800);
    clearSchoolKeyHighlights();
    
    // ========== 9. TIMBRE ==========
    if (!theoryDemoRunning) return;
    updateTheoryDemoLabel("TIMBRE — Different wave shapes");
    await theoryDemoWait(1200);
    
    const waves = [
      { type: 'sine', name: 'Sine (pure)' },
      { type: 'triangle', name: 'Triangle (soft)' },
      { type: 'sawtooth', name: 'Sawtooth (bright)' },
      { type: 'square', name: 'Square (hollow)' }
    ];
    
    for (const wave of waves) {
      if (!theoryDemoRunning) return;
      clearSchoolKeyHighlights();
      updateTheoryDemoLabel(`TIMBRE — ${wave.name}`);
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = wave.type;
      osc.frequency.value = 440;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(wave.type === 'sawtooth' ? 0.1 : 0.15, audioCtx.currentTime + 0.05);
      osc.start();
      theoryDemoOscillators.push(osc);
      theoryDemoGains.push(gain);
      highlightSchoolKey(440);
      
      await theoryDemoWait(1100);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
      await theoryDemoWait(400);
    }
    clearSchoolKeyHighlights();
    
    // ========== FINALE ==========
    if (!theoryDemoRunning) return;
    updateTheoryDemoLabel("🎵 A little melody to finish...");
    await theoryDemoWait(1200);
    
    // Simple melody
    const melody = [
      { f: 261.63, d: 0.35 },
      { f: 261.63, d: 0.35 },
      { f: 392.00, d: 0.35 },
      { f: 392.00, d: 0.35 },
      { f: 440.00, d: 0.35 },
      { f: 440.00, d: 0.35 },
      { f: 392.00, d: 0.7 }
    ];
    
    for (const n of melody) {
      if (!theoryDemoRunning) return;
      playNote(n.f, n.d + 0.1, 0.25);
      await theoryDemoWait(n.d * 1000 + 80);
    }
    
    await theoryDemoWait(1200);
    clearSchoolKeyHighlights();
    
    endTheoryDemo();
  }
  
  function startTheoryDemo() {
    if (theoryDemoRunning) return;
    
    // Stop any existing school demos
    stopSchoolDemo();
    hideConceptExplanation();
    
    // Stop other demos if running
    if (typeof stopDemo === 'function' && demoRunning) {
      stopDemo();
    }
    if (typeof stopOvertonesDemo === 'function' && overtonesDemoRunning) {
      stopOvertonesDemo();
    }
    
    theoryDemoRunning = true;
    
    if (theoryDemoBtn) {
      theoryDemoBtn.classList.add('is-running');
    }
    if (theoryDemoBtnText) {
      theoryDemoBtnText.textContent = 'Stop';
    }
    
    runTheoryDemo();
  }
  
  // Theory demo button event listener
  if (theoryDemoBtn) {
    theoryDemoBtn.addEventListener('click', () => {
      if (theoryDemoRunning) {
        stopTheoryDemo();
      } else {
        startTheoryDemo();
      }
    });
  }

  // Event listeners for music school dropdown
  if (conceptSelect) {
    // Reset to default on page load (browsers sometimes remember form values)
    conceptSelect.value = '';
    
    conceptSelect.addEventListener('change', () => {
      // Stop theory demo if running when user selects a concept
      if (theoryDemoRunning) {
        stopTheoryDemo();
      }
      const concept = conceptSelect.value;
      if (concept) {
        showConceptExplanation(concept);
      } else {
        hideConceptExplanation();
      }
    });
  }

  if (explanationClose) {
    explanationClose.addEventListener('click', hideConceptExplanation);
  }

  // ===== RELAXATION PROGRAMS =====
  
  // Program definitions with phases
  const RELAXATION_PROGRAMS = {
    'deep-calm': {
      name: '🌊 Deep Calm',
      duration: 15 * 60, // 15 minutes in seconds
      description: 'Transition from busy mind to peaceful theta state',
      phases: [
        {
          name: 'Arrival & Settling',
          duration: 3 * 60, // 3 minutes
          leftHz: 200,
          rightHz: 214,
          binauralHz: 14,
          description: 'Gentle disengagement from analytical overdrive'
        },
        {
          name: 'Alpha Stabilization',
          duration: 4 * 60, // 4 minutes
          leftHz: 200,
          rightHz: 210,
          binauralHz: 10,
          description: 'Calm focus, emotional settling - the gateway state'
        },
        {
          name: 'Pre-Theta Descent',
          duration: 4 * 60, // 4 minutes
          leftHz: 200,
          rightHz: 208,
          binauralHz: 8,
          description: 'Mental quiet, inner spaciousness emerges'
        },
        {
          name: 'Theta Rest',
          duration: 3 * 60, // 3 minutes
          leftHz: 200,
          rightHz: 206,
          binauralHz: 6,
          description: 'Deep nervous system rest and integration'
        },
        {
          name: 'Gentle Return',
          duration: 1 * 60, // 1 minute
          leftHz: 200,
          rightHz: 200,
          binauralHz: 0,
          description: 'Smooth re-orientation to waking awareness'
        }
      ]
    },
    'focus-reset': {
      name: '🎯 Focus Reset',
      duration: 12 * 60, // 12 minutes
      description: 'Clear mental fog and restore alertness',
      phases: [
        {
          name: 'Stress Release',
          duration: 3 * 60,
          leftHz: 180,
          rightHz: 192,
          binauralHz: 12,
          description: 'Releasing tension and mental clutter'
        },
        {
          name: 'Alpha Stabilize',
          duration: 4 * 60,
          leftHz: 180,
          rightHz: 190,
          binauralHz: 10,
          description: 'Establishing calm, centered awareness'
        },
        {
          name: 'Refresh Zone',
          duration: 3 * 60,
          leftHz: 180,
          rightHz: 188,
          binauralHz: 8,
          description: 'Deep refresh and mental clarity'
        },
        {
          name: 'Re-Energize',
          duration: 2 * 60,
          leftHz: 180,
          rightHz: 194,
          binauralHz: 14,
          description: 'Returning with renewed focus and energy'
        }
      ]
    },
    'sleep-prep': {
      name: '🌙 Sleep Preparation',
      duration: 20 * 60, // 20 minutes
      description: 'Gradual descent into deep delta for restful sleep',
      phases: [
        {
          name: 'Unwinding',
          duration: 4 * 60,
          leftHz: 150,
          rightHz: 160,
          binauralHz: 10,
          description: 'Letting go of the day, body relaxation begins'
        },
        {
          name: 'Theta Drift',
          duration: 5 * 60,
          leftHz: 150,
          rightHz: 156,
          binauralHz: 6,
          description: 'Thoughts become distant, dreamy state'
        },
        {
          name: 'Pre-Sleep',
          duration: 5 * 60,
          leftHz: 150,
          rightHz: 153,
          binauralHz: 3,
          description: 'Approaching the edge of sleep'
        },
        {
          name: 'Deep Delta',
          duration: 5 * 60,
          leftHz: 150,
          rightHz: 151,
          binauralHz: 1,
          description: 'Deep restorative delta wave state'
        },
        {
          name: 'Sleep Fade',
          duration: 1 * 60,
          leftHz: 150,
          rightHz: 150.5,
          binauralHz: 0.5,
          description: 'Gentle fade into natural sleep'
        }
      ]
    },
    'creative-flow': {
      name: '🎨 Creative Flow',
      duration: 15 * 60, // 15 minutes
      description: 'Access the alpha-theta border for creativity',
      phases: [
        {
          name: 'Settling In',
          duration: 3 * 60,
          leftHz: 220,
          rightHz: 230,
          binauralHz: 10,
          description: 'Relaxing the analytical mind'
        },
        {
          name: 'Flow Gateway',
          duration: 4 * 60,
          leftHz: 220,
          rightHz: 227.5,
          binauralHz: 7.5,
          description: 'Entering the alpha-theta borderland'
        },
        {
          name: 'Deep Flow',
          duration: 5 * 60,
          leftHz: 220,
          rightHz: 227,
          binauralHz: 7,
          description: 'Creative insights and ideas emerge freely'
        },
        {
          name: 'Integration',
          duration: 3 * 60,
          leftHz: 220,
          rightHz: 228,
          binauralHz: 8,
          description: 'Consolidating creative insights'
        }
      ]
    },
    'quick-refresh': {
      name: '⚡ Quick Refresh',
      duration: 8 * 60, // 8 minutes
      description: 'Fast mental reset when time is limited',
      phases: [
        {
          name: 'Quick Settle',
          duration: 1.5 * 60,
          leftHz: 200,
          rightHz: 212,
          binauralHz: 12,
          description: 'Rapid transition from busy state'
        },
        {
          name: 'Refresh',
          duration: 2.5 * 60,
          leftHz: 200,
          rightHz: 210,
          binauralHz: 10,
          description: 'Core alpha refresh zone'
        },
        {
          name: 'Micro-Rest',
          duration: 2 * 60,
          leftHz: 200,
          rightHz: 208,
          binauralHz: 8,
          description: 'Brief theta touch for mental reset'
        },
        {
          name: 'Quick Return',
          duration: 2 * 60,
          leftHz: 200,
          rightHz: 210,
          binauralHz: 10,
          description: 'Energized return to alertness'
        }
      ]
    },
    'manifestation': {
      name: '✨ Manifestation',
      duration: 18 * 60, // 18 minutes
      description: 'Access deep theta for visualization and intention setting',
      phases: [
        {
          name: 'Centering & Grounding',
          duration: 3 * 60,
          leftHz: 210,
          rightHz: 220,
          binauralHz: 10,
          description: 'Calming the mind, creating a receptive alpha state'
        },
        {
          name: 'Heart Coherence',
          duration: 4 * 60,
          leftHz: 210,
          rightHz: 218,
          binauralHz: 8,
          description: 'Opening to gratitude and positive emotion'
        },
        {
          name: 'Vision Expansion',
          duration: 5 * 60,
          leftHz: 210,
          rightHz: 217,
          binauralHz: 7,
          description: 'Deep theta visualization and intention setting'
        },
        {
          name: 'Belief Anchoring',
          duration: 4 * 60,
          leftHz: 210,
          rightHz: 217.83,
          binauralHz: 7.83,
          description: 'Schumann resonance alignment - grounding your vision'
        },
        {
          name: 'Integration',
          duration: 2 * 60,
          leftHz: 210,
          rightHz: 220,
          binauralHz: 10,
          description: 'Sealing practice and returning with clear intention'
        }
      ]
    },
    'morning-awakening': {
      name: '🌅 Morning Awakening',
      duration: 10 * 60, // 10 minutes
      description: 'Start your day with mental clarity and natural energy',
      phases: [
        {
          name: 'Gentle Wake',
          duration: 2 * 60,
          leftHz: 200,
          rightHz: 208,
          binauralHz: 8,
          description: 'Soft awakening from rest, gentle alpha embrace'
        },
        {
          name: 'Mind Clear',
          duration: 3 * 60,
          leftHz: 200,
          rightHz: 210,
          binauralHz: 10,
          description: 'Clearing mental fog, sharpening awareness'
        },
        {
          name: 'Energy Rise',
          duration: 3 * 60,
          leftHz: 200,
          rightHz: 214,
          binauralHz: 14,
          description: 'Building natural alertness and motivation'
        },
        {
          name: 'Ready State',
          duration: 2 * 60,
          leftHz: 200,
          rightHz: 218,
          binauralHz: 18,
          description: 'Full wakefulness, ready to seize the day'
        }
      ]
    },
    'anxiety-release': {
      name: '💜 Anxiety Release',
      duration: 15 * 60, // 15 minutes
      description: 'Soothe an anxious mind and calm your nervous system',
      phases: [
        {
          name: 'Acknowledge',
          duration: 3 * 60,
          leftHz: 180,
          rightHz: 192,
          binauralHz: 12,
          description: 'Meeting yourself where you are with compassion'
        },
        {
          name: 'Breath Sync',
          duration: 4 * 60,
          leftHz: 180,
          rightHz: 190,
          binauralHz: 10,
          description: 'Calming the nervous system, slowing the breath'
        },
        {
          name: 'Release',
          duration: 4 * 60,
          leftHz: 180,
          rightHz: 187,
          binauralHz: 7,
          description: 'Letting go of tension and worried thoughts'
        },
        {
          name: 'Peace',
          duration: 3 * 60,
          leftHz: 180,
          rightHz: 186,
          binauralHz: 6,
          description: 'Deep calm and safety, theta sanctuary'
        },
        {
          name: 'Ground',
          duration: 1 * 60,
          leftHz: 180,
          rightHz: 188,
          binauralHz: 8,
          description: 'Gentle return feeling centered and safe'
        }
      ]
    },
    'lucid-dreaming': {
      name: '🔮 Lucid Dreaming',
      duration: 20 * 60, // 20 minutes
      description: 'Prepare your mind for conscious dreaming',
      phases: [
        {
          name: 'Relaxation',
          duration: 4 * 60,
          leftHz: 160,
          rightHz: 170,
          binauralHz: 10,
          description: 'Deep body relaxation, releasing physical tension'
        },
        {
          name: 'Hypnagogia',
          duration: 5 * 60,
          leftHz: 160,
          rightHz: 166,
          binauralHz: 6,
          description: 'Approaching the hypnagogic threshold'
        },
        {
          name: 'REM Preparation',
          duration: 5 * 60,
          leftHz: 160,
          rightHz: 164,
          binauralHz: 4,
          description: 'Theta-delta border, dream imagery emerges'
        },
        {
          name: 'Dream Gate',
          duration: 5 * 60,
          leftHz: 160,
          rightHz: 163,
          binauralHz: 3,
          description: 'Edge of sleep, consciousness floating'
        },
        {
          name: 'Lucid Hold',
          duration: 1 * 60,
          leftHz: 160,
          rightHz: 165,
          binauralHz: 5,
          description: 'Maintaining awareness thread into dreams'
        }
      ]
    },
    'healing-harmony': {
      name: '💚 Healing Harmony',
      duration: 16 * 60, // 16 minutes
      description: 'Support physical and emotional recovery',
      phases: [
        {
          name: 'Sanctuary',
          duration: 3 * 60,
          leftHz: 174,
          rightHz: 184,
          binauralHz: 10,
          description: 'Creating a safe, nurturing inner space'
        },
        {
          name: 'Cell Renewal',
          duration: 4 * 60,
          leftHz: 174,
          rightHz: 181.83,
          binauralHz: 7.83,
          description: 'Schumann resonance for Earth-aligned healing'
        },
        {
          name: 'Deep Restore',
          duration: 5 * 60,
          leftHz: 174,
          rightHz: 178,
          binauralHz: 4,
          description: 'Deep delta healing state, cellular regeneration'
        },
        {
          name: 'Integration',
          duration: 3 * 60,
          leftHz: 174,
          rightHz: 180,
          binauralHz: 6,
          description: 'Integrating healing throughout body and mind'
        },
        {
          name: 'Emergence',
          duration: 1 * 60,
          leftHz: 174,
          rightHz: 184,
          binauralHz: 10,
          description: 'Returning refreshed and renewed'
        }
      ]
    }
  };
  
  // Program state
  let programRunning = false;
  let programStartTime = null;
  let programAnimationFrame = null;
  let currentProgram = null;
  let currentPhaseIndex = 0;
  let programTransitionInterval = null;
  
  // DOM elements
  const programSelect = document.getElementById('programSelect');
  const programStart = document.getElementById('programStart');
  const programStop = document.getElementById('programStop');
  const programDisplay = document.getElementById('programDisplay');
  const programSection = document.getElementById('guidedPanel'); // Now using panel instead of section
  const programInfoCards = document.getElementById('programInfoCards');
  
  // Format time as MM:SS
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  
  // Get current phase based on elapsed time
  function getCurrentPhase(program, elapsedSeconds) {
    let accumulated = 0;
    for (let i = 0; i < program.phases.length; i++) {
      accumulated += program.phases[i].duration;
      if (elapsedSeconds < accumulated) {
        return {
          phase: program.phases[i],
          index: i,
          phaseElapsed: elapsedSeconds - (accumulated - program.phases[i].duration),
          phaseRemaining: accumulated - elapsedSeconds
        };
      }
    }
    // Return last phase if somehow exceeded
    return {
      phase: program.phases[program.phases.length - 1],
      index: program.phases.length - 1,
      phaseElapsed: program.phases[program.phases.length - 1].duration,
      phaseRemaining: 0
    };
  }
  
  // Calculate phase markers for progress bar
  function createPhaseMarkers(program) {
    const markersContainer = document.getElementById('programPhaseMarkers');
    if (!markersContainer) return;
    markersContainer.innerHTML = '';
    
    let accumulated = 0;
    for (let i = 0; i < program.phases.length - 1; i++) {
      accumulated += program.phases[i].duration;
      const percent = (accumulated / program.duration) * 100;
      
      const marker = document.createElement('div');
      marker.className = 'phase-marker';
      marker.style.left = `${percent}%`;
      marker.dataset.phase = `P${i + 2}`;
      markersContainer.appendChild(marker);
    }
  }
  
  // Smooth frequency transition
  function setWheelFrequencySmoothly(wheel, targetHz, durationMs = 2000) {
    const currentHz = wheel.getHz();
    const startTime = performance.now();
    const diff = targetHz - currentHz;
    
    function animate() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease in-out cubic
      const eased = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      const newHz = currentHz + diff * eased;
      wheel.setHz(newHz);
      
      if (progress < 1 && programRunning) {
        requestAnimationFrame(animate);
      }
    }
    
    requestAnimationFrame(animate);
  }
  
  // Update wheel frequencies for current phase
  function updateProgramFrequencies(phase, phaseProgress) {
    // Get next phase for smooth transition near phase boundaries
    const nextPhaseIndex = currentPhaseIndex + 1;
    const hasNextPhase = currentProgram && nextPhaseIndex < currentProgram.phases.length;
    
    let targetLeft = phase.leftHz;
    let targetRight = phase.rightHz;
    
    // If within last 5 seconds of phase and there's a next phase, start transitioning
    if (hasNextPhase && phase.duration - (phase.duration * phaseProgress) < 5) {
      const nextPhase = currentProgram.phases[nextPhaseIndex];
      const transitionProgress = 1 - ((phase.duration - (phase.duration * phaseProgress)) / 5);
      targetLeft = phase.leftHz + (nextPhase.leftHz - phase.leftHz) * transitionProgress;
      targetRight = phase.rightHz + (nextPhase.rightHz - phase.rightHz) * transitionProgress;
    }
    
    // Set frequencies on the wheels
    wheelL.setHz(targetLeft);
    wheelR.setHz(targetRight);
    
    // Update the audio
    updateOscillators();
  }
  
  // Update program display
  function updateProgramDisplay(elapsed) {
    if (!currentProgram) return;
    
    const phaseInfo = getCurrentPhase(currentProgram, elapsed);
    const { phase, index, phaseElapsed } = phaseInfo;
    const phaseProgress = phaseElapsed / phase.duration;
    
    // Update timer
    document.getElementById('programElapsed').textContent = formatTime(elapsed);
    document.getElementById('programTotal').textContent = formatTime(currentProgram.duration);
    
    // Update progress bar
    const progressPercent = (elapsed / currentProgram.duration) * 100;
    document.getElementById('programProgressFill').style.width = `${progressPercent}%`;
    
    // Update phase display
    document.getElementById('phaseBadge').textContent = `Phase ${index + 1} of ${currentProgram.phases.length}`;
    document.getElementById('phaseName').textContent = phase.name;
    document.getElementById('phaseFreqL').textContent = `${phase.leftHz.toFixed(1)} Hz`;
    document.getElementById('phaseFreqR').textContent = `${phase.rightHz.toFixed(1)} Hz`;
    document.getElementById('phaseBinaural').textContent = `${phase.binauralHz.toFixed(1)} Hz`;
    document.getElementById('phaseDescription').textContent = phase.description;
    
    // Update frequency-responsive visuals
    const overallProgress = elapsed / currentProgram.duration;
    updateFrequencyVisuals(programDisplay, phase.binauralHz, overallProgress);
    
    // Update frequencies if phase changed
    if (index !== currentPhaseIndex) {
      currentPhaseIndex = index;
      // Smooth transition to new phase frequencies
      setWheelFrequencySmoothly(wheelL, phase.leftHz, 3000);
      setWheelFrequencySmoothly(wheelR, phase.rightHz, 3000);
    } else {
      // Micro-adjustments for smooth transitions
      updateProgramFrequencies(phase, phaseProgress);
    }
    
    return elapsed >= currentProgram.duration;
  }
  
  // Main program loop
  function programLoop() {
    if (!programRunning || !programStartTime) return;
    
    const elapsed = (Date.now() - programStartTime) / 1000;
    const finished = updateProgramDisplay(elapsed);
    
    if (finished) {
      stopProgram();
      return;
    }
    
    programAnimationFrame = requestAnimationFrame(programLoop);
  }
  
  // Create galaxy-themed visual elements
  function createFrequencyVisuals(container) {
    // Remove any existing visuals first
    removeFrequencyVisuals(container);
    
    // Create main galaxy background container (handles clipping and animated layers)
    const galaxyBg = document.createElement('div');
    galaxyBg.className = 'freq-galaxy-bg';
    container.insertBefore(galaxyBg, container.firstChild);
    
    // Create third nebula layer for additional depth
    const nebulaBg = document.createElement('div');
    nebulaBg.className = 'freq-nebula-bg';
    galaxyBg.appendChild(nebulaBg);
    
    // Create nebula wisps (flowing clouds) - inside galaxy container
    for (let i = 0; i < 3; i++) {
      const nebula = document.createElement('div');
      nebula.className = 'freq-nebula';
      galaxyBg.appendChild(nebula);
    }
    
    // Create distant stars (small, drifting with twinkle) - inside galaxy container
    for (let i = 0; i < 12; i++) {
      const star = document.createElement('div');
      star.className = 'freq-star';
      galaxyBg.appendChild(star);
    }
    
    // Create accent stars (larger, with glow and orbit) - inside galaxy container
    for (let i = 0; i < 3; i++) {
      const starAccent = document.createElement('div');
      starAccent.className = 'freq-star-accent';
      galaxyBg.appendChild(starAccent);
    }
    
    // Create cosmic dust particles - inside galaxy container
    for (let i = 0; i < 6; i++) {
      const dust = document.createElement('div');
      dust.className = 'freq-dust';
      galaxyBg.appendChild(dust);
    }
    
    // Create center aura (breathing glow)
    const aura = document.createElement('div');
    aura.className = 'freq-aura';
    galaxyBg.appendChild(aura);
    
    // Create shooting stars (very rare, gentle) with random positioning
    // Only 2 shooting stars, appearing rarely
    for (let i = 0; i < 2; i++) {
      const shootingStar = document.createElement('div');
      shootingStar.className = 'freq-shooting-star';
      shootingStar.dataset.starIndex = i;
      galaxyBg.appendChild(shootingStar);
      
      // Start random repositioning for this shooting star
      randomizeShootingStar(shootingStar, i);
    }
  }
  
  // Store shooting star interval IDs for cleanup
  let shootingStarIntervals = [];
  
  // Randomize shooting star position and timing - occasional, calming appearances
  function randomizeShootingStar(star, index) {
    // First star after 10-20 seconds, second after 25-40 seconds
    const initialDelay = 10000 + (index * 15000) + Math.random() * 10000;
    
    const repositionStar = () => {
      // Random position across the container
      const topPos = 10 + Math.random() * 50; // 10% to 60% from top
      const leftPos = 15 + Math.random() * 65; // 15% to 80% from left
      
      // Random angle between -30 and -50 degrees
      const angle = -30 - Math.random() * 20;
      
      // Random size variation
      const width = 55 + Math.random() * 35; // 55px to 90px
      
      // Apply new position
      star.style.top = `${topPos}%`;
      star.style.left = `${leftPos}%`;
      star.style.width = `${width}px`;
      star.style.setProperty('--star-angle', `${angle}deg`);
      
      // Restart animation by removing and re-adding the class
      star.style.animation = 'none';
      star.offsetHeight; // Trigger reflow
      
      // Animation duration 12-18 seconds - star visible for ~1 second within this
      const duration = 12 + Math.random() * 6;
      star.style.animation = `shooting-star-random ${duration}s ease-in-out infinite`;
    };
    
    // Initial positioning after delay
    setTimeout(() => {
      repositionStar();
      
      // Reposition every 25-45 seconds (gentle pacing)
      const intervalId = setInterval(() => {
        repositionStar();
      }, 25000 + Math.random() * 20000);
      
      shootingStarIntervals.push(intervalId);
    }, initialDelay);
  }
  
  // Remove frequency visual elements
  function removeFrequencyVisuals(container) {
    // Clear shooting star intervals
    shootingStarIntervals.forEach(id => clearInterval(id));
    shootingStarIntervals = [];
    
    const visualClasses = [
      'freq-galaxy-bg', 'freq-nebula-bg', 'freq-star', 'freq-star-accent', 
      'freq-nebula', 'freq-dust', 'freq-aura', 'freq-shooting-star'
    ];
    visualClasses.forEach(cls => {
      const elements = container.querySelectorAll('.' + cls);
      elements.forEach(el => el.remove());
    });
    // Reset CSS custom properties
    container.style.removeProperty('--freq-pulse-duration');
    container.style.removeProperty('--freq-intensity');
    container.style.removeProperty('--nebula-drift');
  }
  
  // Update galaxy visuals based on current binaural beat
  function updateFrequencyVisuals(container, binauralHz, phaseProgress) {
    if (!container) return;
    
    // Calculate breathing duration based on binaural frequency
    // Lower frequency = slower, deeper breathing effect
    // Maps binaural Hz to a calm, slow animation range
    // Delta (0.5-4): very slow 12-8s, Theta (4-8): slow 8-6s, Alpha (8-12): moderate 6-5s, Beta (12+): 5-4s
    let pulseDuration;
    if (binauralHz <= 1) {
      pulseDuration = 12;
    } else if (binauralHz <= 4) {
      pulseDuration = 12 - ((binauralHz - 1) / 3) * 4; // 12 -> 8
    } else if (binauralHz <= 8) {
      pulseDuration = 8 - ((binauralHz - 4) / 4) * 2; // 8 -> 6
    } else if (binauralHz <= 12) {
      pulseDuration = 6 - ((binauralHz - 8) / 4) * 1; // 6 -> 5
    } else {
      pulseDuration = Math.max(4, 5 - (binauralHz - 12) * 0.05); // 5 -> 4
    }
    
    // Calculate subtle intensity based on frequency band
    // Keep everything gentle - range from 0.5 to 0.85
    let intensity;
    if (binauralHz < 4) {
      // Delta: very soft, dreamy
      intensity = 0.5 + (binauralHz / 4) * 0.1; // 0.5 - 0.6
    } else if (binauralHz < 8) {
      // Theta: slightly more visible
      intensity = 0.6 + ((binauralHz - 4) / 4) * 0.1; // 0.6 - 0.7
    } else if (binauralHz < 12) {
      // Alpha: moderate presence
      intensity = 0.7 + ((binauralHz - 8) / 4) * 0.1; // 0.7 - 0.8
    } else {
      // Beta: gentle cap
      intensity = 0.8 + Math.min((binauralHz - 12) / 20, 0.05); // 0.8 - 0.85
    }
    
    // Apply CSS custom properties - all very smooth
    container.style.setProperty('--freq-pulse-duration', `${pulseDuration}s`);
    container.style.setProperty('--freq-intensity', intensity.toFixed(2));
  }
  
  // Start program
  async function startProgram(programId) {
    const program = RELAXATION_PROGRAMS[programId];
    if (!program) return;
    
    // Stop any running dynamic journey first (defined later in the script)
    if (typeof window.stopDynamicJourneyFn === 'function') {
      window.stopDynamicJourneyFn();
    }
    
    currentProgram = program;
    currentPhaseIndex = -1; // Will be set to 0 on first update
    
    // Ensure audio is ready
    ensureAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    
    // Set initial frequencies
    const firstPhase = program.phases[0];
    wheelL.setHz(firstPhase.leftHz);
    wheelR.setHz(firstPhase.rightHz);
    
    // Start audio with fade-in to prevent click
    startAudio(true);
    setTransportActive('play');
    
    // Show program display
    programDisplay.style.display = 'block';
    programSection.classList.add('is-running');
    document.getElementById('programCurrentName').textContent = program.name;
    
    // Create frequency-responsive visual elements
    createFrequencyVisuals(programDisplay);
    
    // Create phase markers
    createPhaseMarkers(program);
    
    // Update UI
    programStart.classList.add('is-playing');
    programStart.querySelector('.btn-text').textContent = 'Journeying...';
    programStart.disabled = true;
    programStop.disabled = false;
    programSelect.disabled = true;
    
    // Start timer
    programStartTime = Date.now();
    programRunning = true;
    programLoop();
  }
  
  // Stop program with optional fade out
  let programFadingOut = false;
  
  async function stopProgram(immediate = false) {
    // Prevent multiple fade-outs
    if (programFadingOut) return;
    
    programRunning = false;
    programStartTime = null;
    currentPhaseIndex = 0;
    
    if (programAnimationFrame) {
      cancelAnimationFrame(programAnimationFrame);
      programAnimationFrame = null;
    }
    
    if (programTransitionInterval) {
      clearInterval(programTransitionInterval);
      programTransitionInterval = null;
    }
    
    // Update button to show fading state
    if (!immediate) {
      programFadingOut = true;
      programStart.querySelector('.btn-text').textContent = 'Ending...';
      
      // Fade out audio over 3 seconds
      await fadeOutAudio(3);
      
      programFadingOut = false;
    } else {
      // Immediate stop (no fade)
      stopAudio();
    }
    
    currentProgram = null;
    
    // Hide program display and clean up visuals
    removeFrequencyVisuals(programDisplay);
    programDisplay.style.display = 'none';
    programSection.classList.remove('is-running');
    
    // Reset UI
    programStart.classList.remove('is-playing');
    programStart.querySelector('.btn-text').textContent = 'Begin Journey';
    programStart.disabled = !programSelect.value;
    programStop.disabled = true;
    programSelect.disabled = false;
  }
  
  // Event listeners
  if (programSelect) {
    programSelect.addEventListener('change', () => {
      const value = programSelect.value;
      programStart.disabled = !value;
      
      // Highlight selected info card
      document.querySelectorAll('.info-card').forEach(card => {
        card.classList.toggle('active', card.dataset.program === value);
      });
    });
  }
  
  if (programStart) {
    programStart.addEventListener('click', () => {
      if (programRunning) {
        // Already running - do nothing (pause not supported for programs)
        return;
      }
      const programId = programSelect.value;
      if (programId) {
        startProgram(programId);
      }
    });
  }
  
  if (programStop) {
    programStop.addEventListener('click', () => {
      stopProgram();
    });
  }
  
  // Info card click to select program
  if (programInfoCards) {
    programInfoCards.addEventListener('click', (e) => {
      const card = e.target.closest('.info-card');
      if (card && card.dataset.program) {
        programSelect.value = card.dataset.program;
        programSelect.dispatchEvent(new Event('change'));
      }
    });
  }

  // ===== DYNAMIC BINAURAL JOURNEYS =====
  
  // Harmonic interval ratios for consonant, pleasant frequencies
  const HARMONIC_INTERVALS = {
    unison:       { ratio: 1/1,   name: 'Unison',        consonance: 1.0 },
    octave:       { ratio: 2/1,   name: 'Octave',        consonance: 0.95 },
    fifth:        { ratio: 3/2,   name: 'Perfect Fifth', consonance: 0.9 },
    fourth:       { ratio: 4/3,   name: 'Perfect Fourth', consonance: 0.85 },
    majorThird:   { ratio: 5/4,   name: 'Major Third',   consonance: 0.8 },
    minorThird:   { ratio: 6/5,   name: 'Minor Third',   consonance: 0.75 },
    majorSixth:   { ratio: 5/3,   name: 'Major Sixth',   consonance: 0.78 },
    minorSixth:   { ratio: 8/5,   name: 'Minor Sixth',   consonance: 0.7 },
    majorSecond:  { ratio: 9/8,   name: 'Major Second',  consonance: 0.5 },
    minorSeventh: { ratio: 16/9,  name: 'Minor Seventh', consonance: 0.45 },
    majorSeventh: { ratio: 15/8,  name: 'Major Seventh', consonance: 0.4 }
  };
  
  // Chord progressions using harmonic intervals (for harmonic journeys)
  const HARMONIC_PROGRESSIONS = {
    peaceful: ['unison', 'fifth', 'majorThird', 'fourth', 'unison'],
    uplifting: ['unison', 'majorThird', 'fifth', 'octave', 'fifth', 'majorThird'],
    dreamy: ['unison', 'fourth', 'minorThird', 'fifth', 'majorSixth', 'fourth'],
    cosmic: ['unison', 'fifth', 'octave', 'fifth', 'fourth', 'majorThird', 'unison'],
    oceanic: ['unison', 'fourth', 'fifth', 'majorThird', 'fourth', 'unison'],
    ethereal: ['unison', 'majorSixth', 'fifth', 'fourth', 'majorThird', 'fifth', 'octave']
  };
  
  // Helper: Smooth interpolation between two values
  function smoothInterpolate(from, to, progress, easing = 'sine') {
    let t = Math.max(0, Math.min(1, progress));
    switch (easing) {
      case 'sine': t = (1 - Math.cos(t * Math.PI)) / 2; break;
      case 'quad': t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; break;
      case 'cubic': t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; break;
      default: break;
    }
    return from + (to - from) * t;
  }
  
  // Helper: Get interval-based frequencies with smooth transitions
  function getHarmonicFrequencies(baseHz, progression, phaseProgress, binauralHz) {
    const intervals = progression.map(name => HARMONIC_INTERVALS[name]);
    const segmentCount = intervals.length - 1;
    const segmentIndex = Math.min(Math.floor(phaseProgress * segmentCount), segmentCount - 1);
    const segmentProgress = (phaseProgress * segmentCount) % 1;
    
    const fromInterval = intervals[segmentIndex];
    const toInterval = intervals[segmentIndex + 1] || intervals[segmentIndex];
    
    // Smoothly interpolate between interval ratios
    const currentRatio = smoothInterpolate(fromInterval.ratio, toInterval.ratio, segmentProgress);
    
    // Create harmonically related frequencies
    const leftHz = baseHz;
    const rightHz = baseHz * currentRatio;
    
    // Add the binaural beat offset to one channel
    return {
      leftHz: leftHz,
      rightHz: rightHz + binauralHz,
      intervalName: segmentProgress < 0.5 ? fromInterval.name : toInterval.name
    };
  }
  
  // Dynamic Journey definitions with harmonic intervals
  const DYNAMIC_JOURNEYS = {
    'cosmic-drift': {
      name: '🚀 Cosmic Drift',
      duration: 12 * 60, // 12 minutes
      description: 'Float through space with harmonic frequency relationships',
      phases: [
        {
          name: 'Launch Pad',
          duration: 2 * 60,
          baseHz: 180,
          binauralHz: 10,
          progression: 'peaceful',
          modulation: { 
            type: 'harmonic-drift', 
            harmonicSpread: 0.02, // subtle harmonic movement
            waveSpeed: 0.15,
            breathCycle: 8 // seconds per breath cycle
          },
          description: 'Grounding in perfect fifths and unison'
        },
        {
          name: 'Orbital Float',
          duration: 2.5 * 60,
          baseHz: 165,
          binauralHz: 8,
          progression: 'cosmic',
          modulation: { 
            type: 'harmonic-wave',
            harmonicSpread: 0.03,
            waveSpeed: 0.1,
            breathCycle: 10
          },
          description: 'Ascending through major thirds and perfect fifths'
        },
        {
          name: 'Deep Space',
          duration: 3 * 60,
          baseHz: 150,
          binauralHz: 6,
          progression: 'dreamy',
          modulation: { 
            type: 'harmonic-float',
            harmonicSpread: 0.025,
            waveSpeed: 0.08,
            breathCycle: 12
          },
          description: 'Drifting through fourth and sixth intervals'
        },
        {
          name: 'Nebula Dreams',
          duration: 3 * 60,
          baseHz: 140,
          binauralHz: 5,
          progression: 'ethereal',
          modulation: { 
            type: 'harmonic-shimmer',
            harmonicSpread: 0.02,
            waveSpeed: 0.12,
            breathCycle: 14
          },
          description: 'Cascading through the overtone series'
        },
        {
          name: 'Re-entry',
          duration: 1.5 * 60,
          baseHz: 170,
          binauralHz: 8,
          progression: 'peaceful',
          modulation: { 
            type: 'harmonic-return',
            harmonicSpread: 0.015,
            waveSpeed: 0.2,
            breathCycle: 6
          },
          description: 'Gentle descent back to grounding unison'
        }
      ]
    },
    'neural-symphony': {
      name: '🎻 Neural Symphony',
      duration: 10 * 60, // 10 minutes
      description: 'A symphony of harmonic intervals like a neural orchestra',
      phases: [
        {
          name: 'Prelude',
          duration: 2 * 60,
          baseHz: 196, // G3 - orchestral tuning
          binauralHz: 10,
          progression: 'uplifting',
          modulation: { 
            type: 'symphony-intro',
            harmonicSpread: 0.015,
            waveSpeed: 0.18,
            breathCycle: 6
          },
          description: 'Opening with unison, rising to major third'
        },
        {
          name: 'Allegro',
          duration: 2.5 * 60,
          baseHz: 220, // A3
          binauralHz: 12,
          progression: 'uplifting',
          modulation: { 
            type: 'symphony-allegro',
            harmonicSpread: 0.025,
            waveSpeed: 0.25,
            breathCycle: 4
          },
          description: 'Lively dance through fifths and octaves'
        },
        {
          name: 'Adagio',
          duration: 3 * 60,
          baseHz: 174.6, // F3 - warm, deep
          binauralHz: 7,
          progression: 'dreamy',
          modulation: { 
            type: 'symphony-adagio',
            harmonicSpread: 0.02,
            waveSpeed: 0.08,
            breathCycle: 16
          },
          description: 'Slow, beautiful major sixth passages'
        },
        {
          name: 'Crescendo',
          duration: 2.5 * 60,
          baseHz: 196, // Back to G3
          binauralHz: 10,
          progression: 'cosmic',
          modulation: { 
            type: 'symphony-crescendo',
            harmonicSpread: 0.03,
            waveSpeed: 0.15,
            breathCycle: 5
          },
          description: 'Building through the harmonic series to finale'
        }
      ]
    },
    'tidal-waves': {
      name: '🌊 Tidal Waves',
      duration: 14 * 60, // 14 minutes
      description: 'Ocean rhythms flowing through harmonic intervals',
      phases: [
        {
          name: 'Shore Calm',
          duration: 2 * 60,
          baseHz: 174.6, // F3 - Solfeggio 174Hz nearby
          binauralHz: 10,
          progression: 'oceanic',
          modulation: { 
            type: 'tide-gentle',
            harmonicSpread: 0.015,
            waveSpeed: 0.1,
            breathCycle: 10,
            tideDepth: 0.3
          },
          description: 'Calm waters, gentle unison and fourth'
        },
        {
          name: 'Rising Tide',
          duration: 3 * 60,
          baseHz: 164.8, // E3
          binauralHz: 8,
          progression: 'peaceful',
          modulation: { 
            type: 'tide-rising',
            harmonicSpread: 0.025,
            waveSpeed: 0.08,
            breathCycle: 12,
            tideDepth: 0.5
          },
          description: 'Swelling through perfect fifths and fourths'
        },
        {
          name: 'Deep Current',
          duration: 4 * 60,
          baseHz: 146.8, // D3 - deep
          binauralHz: 6,
          progression: 'dreamy',
          modulation: { 
            type: 'tide-deep',
            harmonicSpread: 0.02,
            waveSpeed: 0.05,
            breathCycle: 18,
            tideDepth: 0.7
          },
          description: 'Submerged in major sixths and minor thirds'
        },
        {
          name: 'Oceanic Drift',
          duration: 3 * 60,
          baseHz: 138.6, // C#3
          binauralHz: 5,
          progression: 'ethereal',
          modulation: { 
            type: 'tide-float',
            harmonicSpread: 0.018,
            waveSpeed: 0.04,
            breathCycle: 20,
            tideDepth: 0.6
          },
          description: 'Floating through the overtone spectrum'
        },
        {
          name: 'Gentle Return',
          duration: 2 * 60,
          baseHz: 164.8, // E3
          binauralHz: 8,
          progression: 'peaceful',
          modulation: { 
            type: 'tide-return',
            harmonicSpread: 0.012,
            waveSpeed: 0.12,
            breathCycle: 8,
            tideDepth: 0.3
          },
          description: 'Tide carries you back on perfect intervals'
        }
      ]
    },
    'aurora-borealis': {
      name: '🌈 Aurora Borealis',
      duration: 11 * 60, // 11 minutes
      description: 'Shimmering harmonic cascades like northern lights',
      phases: [
        {
          name: 'Twilight',
          duration: 2 * 60,
          baseHz: 185,
          binauralHz: 10,
          progression: 'peaceful',
          modulation: { 
            type: 'aurora-twilight',
            harmonicSpread: 0.01,
            waveSpeed: 0.15,
            shimmerRate: 0.3
          },
          description: 'Sky darkens, subtle fifth and unison hints'
        },
        {
          name: 'First Light',
          duration: 2 * 60,
          baseHz: 175,
          binauralHz: 8,
          progression: 'uplifting',
          modulation: { 
            type: 'aurora-emerge',
            harmonicSpread: 0.025,
            waveSpeed: 0.12,
            shimmerRate: 0.5
          },
          description: 'Ribbons of major thirds appear'
        },
        {
          name: 'Dancing Curtains',
          duration: 3 * 60,
          baseHz: 165,
          binauralHz: 7,
          progression: 'ethereal',
          modulation: { 
            type: 'aurora-dance',
            harmonicSpread: 0.04,
            waveSpeed: 0.08,
            shimmerRate: 0.8
          },
          description: 'Sixths and fifths weave across the sky'
        },
        {
          name: 'Peak Display',
          duration: 2.5 * 60,
          baseHz: 155,
          binauralHz: 6,
          progression: 'cosmic',
          modulation: { 
            type: 'aurora-peak',
            harmonicSpread: 0.035,
            waveSpeed: 0.1,
            shimmerRate: 1.0
          },
          description: 'Full spectrum of harmonic intervals'
        },
        {
          name: 'Dawn',
          duration: 1.5 * 60,
          baseHz: 175,
          binauralHz: 8,
          progression: 'peaceful',
          modulation: { 
            type: 'aurora-fade',
            harmonicSpread: 0.015,
            waveSpeed: 0.18,
            shimmerRate: 0.2
          },
          description: 'Gentle return to grounding fifths'
        }
      ]
    },
    'quantum-pulse': {
      name: '⚛️ Quantum Pulse',
      duration: 9 * 60, // 9 minutes
      description: 'Rhythmic harmonic patterns in the quantum realm',
      phases: [
        {
          name: 'Initialization',
          duration: 2 * 60,
          baseHz: 196, // G3
          binauralHz: 12,
          progression: 'uplifting',
          modulation: { 
            type: 'quantum-init',
            harmonicSpread: 0.02,
            waveSpeed: 0.3,
            pulseRate: 0.5
          },
          description: 'Activating with major thirds and fifths'
        },
        {
          name: 'Superposition',
          duration: 2.5 * 60,
          baseHz: 185,
          binauralHz: 10,
          progression: 'cosmic',
          modulation: { 
            type: 'quantum-super',
            harmonicSpread: 0.03,
            waveSpeed: 0.2,
            pulseRate: 0.7
          },
          description: 'Multiple harmonic states overlapping'
        },
        {
          name: 'Entanglement',
          duration: 2.5 * 60,
          baseHz: 174.6,
          binauralHz: 7,
          progression: 'ethereal',
          modulation: { 
            type: 'quantum-entangle',
            harmonicSpread: 0.025,
            waveSpeed: 0.15,
            pulseRate: 0.9
          },
          description: 'Perfect intervals dance in quantum lock'
        },
        {
          name: 'Coherence',
          duration: 2 * 60,
          baseHz: 196,
          binauralHz: 10,
          progression: 'peaceful',
          modulation: { 
            type: 'quantum-coherent',
            harmonicSpread: 0.015,
            waveSpeed: 0.25,
            pulseRate: 0.4
          },
          description: 'Perfect alignment in harmonic coherence'
        }
      ]
    },
    'zen-garden': {
      name: '🧘 Zen Garden',
      duration: 13 * 60, // 13 minutes
      description: 'Tranquil harmonic intervals for mindful stillness',
      phases: [
        {
          name: 'Stone Garden',
          duration: 2.5 * 60,
          baseHz: 174, // Near solfeggio 174Hz
          binauralHz: 8,
          progression: 'peaceful',
          modulation: { 
            type: 'zen-stillness',
            harmonicSpread: 0.01,
            waveSpeed: 0.05,
            breathCycle: 12
          },
          description: 'Grounding in pure unison, absolute stillness'
        },
        {
          name: 'Bamboo Flow',
          duration: 3 * 60,
          baseHz: 164.8, // E3
          binauralHz: 7,
          progression: 'oceanic',
          modulation: { 
            type: 'zen-flow',
            harmonicSpread: 0.015,
            waveSpeed: 0.04,
            breathCycle: 14
          },
          description: 'Perfect fourths like bamboo swaying gently'
        },
        {
          name: 'Koi Pond',
          duration: 3.5 * 60,
          baseHz: 155.6, // Eb3
          binauralHz: 6,
          progression: 'dreamy',
          modulation: { 
            type: 'zen-ripple',
            harmonicSpread: 0.02,
            waveSpeed: 0.03,
            breathCycle: 16
          },
          description: 'Fifths ripple like water, spacious awareness'
        },
        {
          name: 'Tea Ceremony',
          duration: 2.5 * 60,
          baseHz: 146.8, // D3
          binauralHz: 5,
          progression: 'ethereal',
          modulation: { 
            type: 'zen-ceremony',
            harmonicSpread: 0.018,
            waveSpeed: 0.025,
            breathCycle: 18
          },
          description: 'Major sixths in contemplative reflection'
        },
        {
          name: 'Temple Bell',
          duration: 1.5 * 60,
          baseHz: 174,
          binauralHz: 8,
          progression: 'peaceful',
          modulation: { 
            type: 'zen-return',
            harmonicSpread: 0.012,
            waveSpeed: 0.08,
            breathCycle: 10
          },
          description: 'Returning to grounding unison, bell fades'
        }
      ]
    },
    'energy-vortex': {
      name: '⚡ Energy Vortex',
      duration: 11 * 60, // 11 minutes
      description: 'Dynamic harmonic spirals for vitality and alertness',
      phases: [
        {
          name: 'Ignition',
          duration: 2 * 60,
          baseHz: 196, // G3
          binauralHz: 12,
          progression: 'uplifting',
          modulation: { 
            type: 'vortex-ignite',
            harmonicSpread: 0.02,
            waveSpeed: 0.25,
            pulseRate: 0.6
          },
          description: 'Perfect fifths spark the energy field'
        },
        {
          name: 'Acceleration',
          duration: 3 * 60,
          baseHz: 220, // A3
          binauralHz: 15,
          progression: 'uplifting',
          modulation: { 
            type: 'vortex-spin',
            harmonicSpread: 0.03,
            waveSpeed: 0.35,
            pulseRate: 0.8
          },
          description: 'Major thirds build momentum and clarity'
        },
        {
          name: 'Power Surge',
          duration: 3.5 * 60,
          baseHz: 246.9, // B3
          binauralHz: 18,
          progression: 'cosmic',
          modulation: { 
            type: 'vortex-surge',
            harmonicSpread: 0.035,
            waveSpeed: 0.4,
            pulseRate: 1.0
          },
          description: 'Octaves and fifths at peak intensity'
        },
        {
          name: 'Radiant Core',
          duration: 2.5 * 60,
          baseHz: 220,
          binauralHz: 14,
          progression: 'peaceful',
          modulation: { 
            type: 'vortex-radiate',
            harmonicSpread: 0.025,
            waveSpeed: 0.3,
            pulseRate: 0.7
          },
          description: 'Sustained power in stable fifth intervals'
        }
      ]
    },
    'heart-opening': {
      name: '🌸 Heart Opening',
      duration: 14 * 60, // 14 minutes
      description: 'Warm harmonic progressions for emotional flow',
      phases: [
        {
          name: 'Heart Center',
          duration: 2.5 * 60,
          baseHz: 136.1, // Heart chakra frequency near C#3
          binauralHz: 10,
          progression: 'peaceful',
          modulation: { 
            type: 'heart-ground',
            harmonicSpread: 0.015,
            waveSpeed: 0.08,
            breathCycle: 10
          },
          description: 'Centering in grounding unison at heart frequency'
        },
        {
          name: 'Warmth Rising',
          duration: 3 * 60,
          baseHz: 146.8, // D3
          binauralHz: 8,
          progression: 'uplifting',
          modulation: { 
            type: 'heart-warmth',
            harmonicSpread: 0.02,
            waveSpeed: 0.06,
            breathCycle: 12
          },
          description: 'Major thirds open the emotional body'
        },
        {
          name: 'Love Expansion',
          duration: 4 * 60,
          baseHz: 155.6, // Eb3
          binauralHz: 7,
          progression: 'ethereal',
          modulation: { 
            type: 'heart-expand',
            harmonicSpread: 0.025,
            waveSpeed: 0.05,
            breathCycle: 14
          },
          description: 'Major sixths create spacious compassion'
        },
        {
          name: 'Release',
          duration: 3 * 60,
          baseHz: 164.8, // E3
          binauralHz: 6,
          progression: 'dreamy',
          modulation: { 
            type: 'heart-release',
            harmonicSpread: 0.02,
            waveSpeed: 0.04,
            breathCycle: 16
          },
          description: 'Perfect fifths release held emotions'
        },
        {
          name: 'Integration',
          duration: 1.5 * 60,
          baseHz: 136.1,
          binauralHz: 10,
          progression: 'peaceful',
          modulation: { 
            type: 'heart-integrate',
            harmonicSpread: 0.012,
            waveSpeed: 0.1,
            breathCycle: 8
          },
          description: 'Major thirds seal the heart-opening practice'
        }
      ]
    },
    'dreamweaver': {
      name: '🌙 Dreamweaver',
      duration: 15 * 60, // 15 minutes
      description: 'Deep theta-delta harmonic descent for profound rest',
      phases: [
        {
          name: 'Twilight Threshold',
          duration: 3 * 60,
          baseHz: 164.8, // E3
          binauralHz: 8,
          progression: 'peaceful',
          modulation: { 
            type: 'dream-twilight',
            harmonicSpread: 0.015,
            waveSpeed: 0.06,
            breathCycle: 12
          },
          description: 'Perfect fifths at the edge of waking'
        },
        {
          name: 'Descent',
          duration: 3.5 * 60,
          baseHz: 146.8, // D3
          binauralHz: 6,
          progression: 'dreamy',
          modulation: { 
            type: 'dream-descend',
            harmonicSpread: 0.02,
            waveSpeed: 0.04,
            breathCycle: 16
          },
          description: 'Perfect fourths guide the downward journey'
        },
        {
          name: 'Dream Depths',
          duration: 4 * 60,
          baseHz: 130.8, // C3 - deep
          binauralHz: 4,
          progression: 'ethereal',
          modulation: { 
            type: 'dream-deep',
            harmonicSpread: 0.018,
            waveSpeed: 0.025,
            breathCycle: 20
          },
          description: 'Major sixths in the ocean of dreams'
        },
        {
          name: 'Still Waters',
          duration: 3 * 60,
          baseHz: 123.5, // B2
          binauralHz: 3,
          progression: 'oceanic',
          modulation: { 
            type: 'dream-still',
            harmonicSpread: 0.01,
            waveSpeed: 0.02,
            breathCycle: 24
          },
          description: 'Unison in absolute rest'
        },
        {
          name: 'Floating',
          duration: 1.5 * 60,
          baseHz: 130.8,
          binauralHz: 5,
          progression: 'peaceful',
          modulation: { 
            type: 'dream-float',
            harmonicSpread: 0.012,
            waveSpeed: 0.03,
            breathCycle: 18
          },
          description: 'Perfect fifths carry you into sleep'
        }
      ]
    },
    'phoenix-rising': {
      name: '🔥 Phoenix Rising',
      duration: 12 * 60, // 12 minutes
      description: 'Transformational journey from stillness to empowerment',
      phases: [
        {
          name: 'Ashes',
          duration: 2 * 60,
          baseHz: 130.8, // C3 - low, grounded
          binauralHz: 6,
          progression: 'peaceful',
          modulation: { 
            type: 'phoenix-ashes',
            harmonicSpread: 0.01,
            waveSpeed: 0.04,
            breathCycle: 14
          },
          description: 'Pure unison in stillness before rebirth'
        },
        {
          name: 'First Ember',
          duration: 2.5 * 60,
          baseHz: 146.8, // D3
          binauralHz: 8,
          progression: 'uplifting',
          modulation: { 
            type: 'phoenix-ember',
            harmonicSpread: 0.02,
            waveSpeed: 0.1,
            breathCycle: 10
          },
          description: 'Major thirds spark the inner flame'
        },
        {
          name: 'Rising Flames',
          duration: 3 * 60,
          baseHz: 174.6, // F3
          binauralHz: 10,
          progression: 'cosmic',
          modulation: { 
            type: 'phoenix-flame',
            harmonicSpread: 0.03,
            waveSpeed: 0.2,
            breathCycle: 6
          },
          description: 'Perfect fifths build transformative power'
        },
        {
          name: 'Taking Flight',
          duration: 3 * 60,
          baseHz: 196, // G3
          binauralHz: 14,
          progression: 'uplifting',
          modulation: { 
            type: 'phoenix-soar',
            harmonicSpread: 0.035,
            waveSpeed: 0.3,
            breathCycle: 4
          },
          description: 'Octaves propel into triumphant ascent'
        },
        {
          name: 'Radiant Being',
          duration: 1.5 * 60,
          baseHz: 220, // A3
          binauralHz: 12,
          progression: 'peaceful',
          modulation: { 
            type: 'phoenix-radiate',
            harmonicSpread: 0.025,
            waveSpeed: 0.25,
            breathCycle: 5
          },
          description: 'Sustained fifths in empowered presence'
        }
      ]
    }
  };
  
  // Dynamic Journey state
  let dynamicJourneyRunning = false;
  let dynamicJourneyStartTime = null;
  let dynamicJourneyAnimationFrame = null;
  let currentDynamicJourney = null;
  let currentDynamicPhaseIndex = 0;
  let dynamicModulationOffset = 0;
  
  // Phase transition settings - slow crossfade between phases
  const PHASE_TRANSITION_DURATION = 8; // 8 seconds of crossfade between phases
  let previousPhaseEndFreqs = null; // Store last frequencies of previous phase for crossfading
  let phaseTransitionStartTime = null; // When the current phase started (for transition calc)
  
  // DOM elements for dynamic journeys
  const dynamicJourneySelect = document.getElementById('dynamicJourneySelect');
  const dynamicJourneyStart = document.getElementById('dynamicJourneyStart');
  const dynamicJourneyStop = document.getElementById('dynamicJourneyStop');
  const dynamicJourneyDisplay = document.getElementById('dynamicJourneyDisplay');
  const dynamicJourneysSection = document.getElementById('dynamicPanel'); // Now using panel instead of section
  const dynamicJourneyInfoCards = document.getElementById('dynamicJourneyInfoCards');
  
  // Calculate harmonically modulated frequencies based on phase progression
  function calculateHarmonicFrequencies(phase, phaseElapsed, totalPhaseTime) {
    const { baseHz, binauralHz, progression: progName, modulation } = phase;
    const progression = HARMONIC_PROGRESSIONS[progName] || HARMONIC_PROGRESSIONS.peaceful;
    const phaseProgress = Math.min(phaseElapsed / totalPhaseTime, 1);
    
    // Get base harmonic frequencies from interval progression
    const harmonic = getHarmonicFrequencies(baseHz, progression, phaseProgress, binauralHz);
    
    // Apply additional modulation for organic movement
    const mod = modulation || { type: 'default', harmonicSpread: 0.02, waveSpeed: 0.1 };
    const time = phaseElapsed;
    const spread = mod.harmonicSpread || 0.02;
    const speed = mod.waveSpeed || 0.1;
    const breathCycle = mod.breathCycle || 8;
    
    // Breathing modulation - slow, organic pulsing
    const breathPhase = (time / breathCycle) * Math.PI * 2;
    const breathMod = Math.sin(breathPhase) * spread * baseHz;
    
    // Secondary harmonic movement - adds subtle variation
    const secondaryPhase = time * speed * Math.PI * 2;
    
    let leftMod = 0;
    let rightMod = 0;
    
    switch (mod.type) {
      case 'harmonic-drift':
        // Gentle wandering within harmonic bounds
        leftMod = breathMod + baseHz * spread * 0.5 * Math.sin(secondaryPhase * 0.7);
        rightMod = breathMod + baseHz * spread * 0.5 * Math.cos(secondaryPhase * 0.5);
        break;
        
      case 'harmonic-wave':
        // Wave-like movement through harmonics
        leftMod = breathMod + baseHz * spread * Math.sin(secondaryPhase);
        rightMod = breathMod + baseHz * spread * Math.sin(secondaryPhase + Math.PI * 0.25);
        break;
        
      case 'harmonic-float':
        // Floating, dreamlike movement
        leftMod = breathMod * 1.2 + baseHz * spread * 0.3 * Math.sin(secondaryPhase * 0.5);
        rightMod = breathMod * 1.2 + baseHz * spread * 0.3 * Math.cos(secondaryPhase * 0.3);
        break;
        
      case 'harmonic-shimmer':
        // Subtle shimmering
        const shimmer = Math.sin(secondaryPhase * 3) * 0.3;
        leftMod = breathMod + baseHz * spread * shimmer;
        rightMod = breathMod + baseHz * spread * shimmer * Math.cos(secondaryPhase);
        break;
        
      case 'harmonic-return':
        // Gradually settling movement
        const decay = 1 - phaseProgress * 0.7;
        leftMod = breathMod * decay + baseHz * spread * 0.5 * Math.sin(secondaryPhase) * decay;
        rightMod = breathMod * decay + baseHz * spread * 0.5 * Math.cos(secondaryPhase) * decay;
        break;
        
      case 'symphony-intro':
      case 'symphony-allegro':
        // Orchestral movement - more structured
        const allegro = mod.type === 'symphony-allegro' ? 1.5 : 1;
        leftMod = breathMod + baseHz * spread * Math.sin(secondaryPhase * allegro);
        rightMod = breathMod + baseHz * spread * Math.sin(secondaryPhase * allegro + Math.PI / 3);
        break;
        
      case 'symphony-adagio':
        // Slow, beautiful movement
        leftMod = breathMod * 1.5;
        rightMod = breathMod * 1.5 + baseHz * spread * 0.2 * Math.sin(secondaryPhase * 0.3);
        break;
        
      case 'symphony-crescendo':
        // Building intensity
        const crescendo = Math.min(phaseProgress * 2, 1);
        leftMod = breathMod * (1 + crescendo) + baseHz * spread * Math.sin(secondaryPhase) * crescendo;
        rightMod = breathMod * (1 + crescendo) + baseHz * spread * Math.cos(secondaryPhase) * crescendo;
        break;
        
      case 'tide-gentle':
      case 'tide-rising':
      case 'tide-deep':
      case 'tide-float':
      case 'tide-return':
        // Tidal movements - organic, rhythmic
        const tideDepth = mod.tideDepth || 0.5;
        const tidePhase = (time / 15) * Math.PI * 2; // 15 second tide cycle
        const tideMod = Math.sin(tidePhase) * tideDepth;
        leftMod = breathMod * (1 + tideMod * 0.5) + baseHz * spread * Math.sin(secondaryPhase * 0.5);
        rightMod = breathMod * (1 + tideMod * 0.5) + baseHz * spread * Math.sin(secondaryPhase * 0.5 + Math.PI * 0.3);
        break;
        
      case 'aurora-twilight':
      case 'aurora-emerge':
      case 'aurora-dance':
      case 'aurora-peak':
      case 'aurora-fade':
        // Aurora movements - shimmering, dancing
        const shimmerRate = mod.shimmerRate || 0.5;
        const auroraPhase = secondaryPhase * shimmerRate;
        const dance = Math.sin(auroraPhase) * Math.cos(auroraPhase * 0.618);
        leftMod = breathMod + baseHz * spread * dance;
        rightMod = breathMod + baseHz * spread * Math.sin(auroraPhase * 1.3) * Math.cos(auroraPhase * 0.8);
        break;
        
      case 'quantum-init':
      case 'quantum-super':
      case 'quantum-entangle':
      case 'quantum-coherent':
        // Quantum movements - precise, pulsing
        const pulseRate = mod.pulseRate || 0.5;
        const quantumPhase = secondaryPhase * (1 + pulseRate);
        const pulse = Math.pow(Math.sin(quantumPhase), 2);
        leftMod = breathMod * 0.7 + baseHz * spread * pulse;
        rightMod = breathMod * 0.7 + baseHz * spread * Math.pow(Math.cos(quantumPhase), 2);
        break;
        
      default:
        leftMod = breathMod;
        rightMod = breathMod;
    }
    
    return {
      leftHz: harmonic.leftHz + leftMod,
      rightHz: harmonic.rightHz + rightMod,
      intervalName: harmonic.intervalName
    };
  }
  
  
  // Format time for display
  function formatDynamicTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  
  // Track current harmonic interval for display
  let currentHarmonicInterval = '';
  
  // Smooth easing function for phase transitions (ease-in-out cubic)
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  // Calculate the ending frequencies of a phase (for transition blending)
  function getPhaseEndFrequencies(phase) {
    // Get frequencies at the very end of the phase
    return calculateHarmonicFrequencies(phase, phase.duration * 0.99, phase.duration);
  }
  
  // Update dynamic journey display
  function updateDynamicJourneyDisplay() {
    if (!dynamicJourneyRunning || !dynamicJourneyStartTime) return;
    
    const elapsed = (Date.now() - dynamicJourneyStartTime) / 1000;
    const journey = currentDynamicJourney;
    
    if (elapsed >= journey.duration) {
      stopDynamicJourney();
      return;
    }
    
    // Update elapsed time
    document.getElementById('dynamicJourneyElapsed').textContent = formatDynamicTime(elapsed);
    
    // Update progress
    const progress = (elapsed / journey.duration) * 100;
    document.getElementById('dynamicJourneyProgressFill').style.width = `${progress}%`;
    
    // Find current phase
    let phaseTime = 0;
    let phaseIndex = 0;
    for (let i = 0; i < journey.phases.length; i++) {
      if (elapsed < phaseTime + journey.phases[i].duration) {
        phaseIndex = i;
        break;
      }
      phaseTime += journey.phases[i].duration;
    }
    
    const phase = journey.phases[phaseIndex];
    const phaseElapsed = elapsed - phaseTime;
    const phaseDuration = phase.duration;
    
    // Calculate harmonic frequencies using the new system
    const frequencies = calculateHarmonicFrequencies(phase, phaseElapsed, phaseDuration);
    let leftHz = frequencies.leftHz;
    let rightHz = frequencies.rightHz;
    
    // Handle phase transition - detect when phase changes
    if (phaseIndex !== currentDynamicPhaseIndex) {
      // Store the previous phase's ending frequencies for crossfade
      if (currentDynamicPhaseIndex >= 0 && currentDynamicPhaseIndex < journey.phases.length) {
        const prevPhase = journey.phases[currentDynamicPhaseIndex];
        previousPhaseEndFreqs = getPhaseEndFrequencies(prevPhase);
      }
      phaseTransitionStartTime = elapsed;
      currentDynamicPhaseIndex = phaseIndex;
      
      document.getElementById('dynamicPhaseBadge').textContent = `Phase ${phaseIndex + 1}`;
      document.getElementById('dynamicPhaseName').textContent = phase.name;
      document.getElementById('dynamicPhaseDescription').textContent = phase.description;
    }
    
    // Apply slow crossfade transition between phases
    if (previousPhaseEndFreqs && phaseTransitionStartTime !== null) {
      const transitionElapsed = elapsed - phaseTransitionStartTime;
      
      if (transitionElapsed < PHASE_TRANSITION_DURATION) {
        // Calculate transition progress with easing
        const transitionProgress = easeInOutCubic(transitionElapsed / PHASE_TRANSITION_DURATION);
        
        // Crossfade between previous phase end frequencies and current phase frequencies
        leftHz = previousPhaseEndFreqs.leftHz + (leftHz - previousPhaseEndFreqs.leftHz) * transitionProgress;
        rightHz = previousPhaseEndFreqs.rightHz + (rightHz - previousPhaseEndFreqs.rightHz) * transitionProgress;
      } else {
        // Transition complete, clear the previous frequencies
        previousPhaseEndFreqs = null;
        phaseTransitionStartTime = null;
      }
    }
    
    const binauralHz = Math.abs(rightHz - leftHz);
    
    // Update harmonic interval display if changed
    if (frequencies.intervalName !== currentHarmonicInterval) {
      currentHarmonicInterval = frequencies.intervalName;
    }
    
    // Update frequency displays (these update continuously for dynamic effect)
    document.getElementById('dynamicPhaseFreqL').textContent = `${leftHz.toFixed(1)} Hz`;
    document.getElementById('dynamicPhaseFreqR').textContent = `${rightHz.toFixed(1)} Hz`;
    document.getElementById('dynamicPhaseBinaural').textContent = `${binauralHz.toFixed(2)} Hz`;
    
    // Update actual wheel frequencies
    if (wheelL && wheelR) {
      wheelL.setHz(leftHz);
      wheelR.setHz(rightHz);
    }
    
    // Update frequency-responsive visuals
    const overallProgress = elapsed / journey.duration;
    updateFrequencyVisuals(dynamicJourneyDisplay, binauralHz, overallProgress);
    
    dynamicJourneyAnimationFrame = requestAnimationFrame(updateDynamicJourneyDisplay);
  }
  
  // Start dynamic journey
  async function startDynamicJourney(journeyId) {
    const journey = DYNAMIC_JOURNEYS[journeyId];
    if (!journey) return;
    
    // Stop any running program first
    if (programRunning) {
      stopProgram();
    }
    
    currentDynamicJourney = journey;
    currentDynamicPhaseIndex = -1; // Will trigger phase update
    currentHarmonicInterval = ''; // Reset harmonic tracking
    previousPhaseEndFreqs = null; // Reset transition state
    phaseTransitionStartTime = null;
    dynamicJourneyRunning = true;
    
    // Ensure audio is ready
    ensureAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    
    // Set initial frequencies using the harmonic system
    const firstPhase = journey.phases[0];
    const initialFreqs = calculateHarmonicFrequencies(firstPhase, 0, firstPhase.duration);
    wheelL.setHz(initialFreqs.leftHz);
    wheelR.setHz(initialFreqs.rightHz);
    
    // Set up display
    document.getElementById('dynamicJourneyCurrentName').textContent = journey.name;
    document.getElementById('dynamicJourneyTotal').textContent = formatDynamicTime(journey.duration);
    document.getElementById('dynamicJourneyElapsed').textContent = '00:00';
    document.getElementById('dynamicJourneyProgressFill').style.width = '0%';
    
    // Create phase markers
    const markersContainer = document.getElementById('dynamicJourneyPhaseMarkers');
    markersContainer.innerHTML = '';
    let cumulative = 0;
    journey.phases.forEach((phase, i) => {
      if (i > 0) {
        const marker = document.createElement('div');
        marker.className = 'phase-marker';
        marker.style.left = `${(cumulative / journey.duration) * 100}%`;
        markersContainer.appendChild(marker);
      }
      cumulative += phase.duration;
    });
    
    // Update button states
    dynamicJourneyStart.classList.add('is-playing');
    dynamicJourneyStart.querySelector('.btn-text').textContent = 'Experiencing...';
    dynamicJourneyStart.disabled = true;
    dynamicJourneyStop.disabled = false;
    dynamicJourneySelect.disabled = true;
    
    // Show display
    dynamicJourneyDisplay.style.display = 'block';
    dynamicJourneysSection.classList.add('is-running');
    
    // Create frequency-responsive visual elements
    createFrequencyVisuals(dynamicJourneyDisplay);
    
    dynamicJourneyStartTime = Date.now();
    
    // Start audio playback with fade-in to prevent click
    startAudio(true);
    setTransportActive('play');
    
    // Start update loop
    updateDynamicJourneyDisplay();
  }
  
  // Stop dynamic journey
  function stopDynamicJourney() {
    if (!dynamicJourneyRunning && !currentDynamicJourney) return; // Already stopped
    dynamicJourneyRunning = false;
    dynamicJourneyStartTime = null;
    currentDynamicJourney = null;
    currentDynamicPhaseIndex = 0;
    currentHarmonicInterval = '';
    previousPhaseEndFreqs = null;
    phaseTransitionStartTime = null;
    
    if (dynamicJourneyAnimationFrame) {
      cancelAnimationFrame(dynamicJourneyAnimationFrame);
      dynamicJourneyAnimationFrame = null;
    }
    
    // Update button states
    dynamicJourneyStart.classList.remove('is-playing');
    dynamicJourneyStart.querySelector('.btn-text').textContent = 'Begin Experience';
    dynamicJourneyStart.disabled = !dynamicJourneySelect.value;
    dynamicJourneyStop.disabled = true;
    dynamicJourneySelect.disabled = false;
    
    // Hide display and clean up visuals
    removeFrequencyVisuals(dynamicJourneyDisplay);
    dynamicJourneyDisplay.style.display = 'none';
    dynamicJourneysSection.classList.remove('is-running');
    
    // Stop audio
    stopAudio();
  }
  
  // Expose stopDynamicJourney for cross-reference with relaxation programs
  window.stopDynamicJourneyFn = stopDynamicJourney;
  
  // Event listeners for dynamic journeys
  if (dynamicJourneySelect) {
    dynamicJourneySelect.addEventListener('change', () => {
      const value = dynamicJourneySelect.value;
      dynamicJourneyStart.disabled = !value;
      
      // Highlight selected card
      document.querySelectorAll('.info-card.dynamic').forEach(card => {
        card.classList.toggle('active', card.dataset.journey === value);
      });
    });
  }
  
  if (dynamicJourneyStart) {
    dynamicJourneyStart.addEventListener('click', () => {
      if (dynamicJourneyRunning) return;
      
      const journeyId = dynamicJourneySelect.value;
      if (journeyId) {
        startDynamicJourney(journeyId);
      }
    });
  }
  
  if (dynamicJourneyStop) {
    dynamicJourneyStop.addEventListener('click', () => {
      stopDynamicJourney();
    });
  }
  
  // Info card clicks for dynamic journeys
  if (dynamicJourneyInfoCards) {
    dynamicJourneyInfoCards.addEventListener('click', (e) => {
      const card = e.target.closest('.info-card.dynamic');
      if (card && card.dataset.journey) {
        dynamicJourneySelect.value = card.dataset.journey;
        dynamicJourneySelect.dispatchEvent(new Event('change'));
      }
    });
  }

  // ===== QUICK START PRESETS =====
  // One-click buttons for "I need to focus" / "I need to relax" / "I can't sleep"
  
  const experiencesSection = document.getElementById('experiencesSection');
  const quickStartDisplay = document.getElementById('quickStartDisplay');
  const qsCurrentName = document.getElementById('qsCurrentName');
  const qsElapsed = document.getElementById('qsElapsed');
  const qsTotal = document.getElementById('qsTotal');
  const qsProgressFill = document.getElementById('qsProgressFill');
  const qsPhaseMarkers = document.getElementById('qsPhaseMarkers');
  const qsLabel = document.getElementById('qsLabel');
  const qsBrainwave = document.getElementById('qsBrainwave');
  const qsStopBtn = document.getElementById('qsStopBtn');
  const quickStartBtns = document.querySelectorAll('.quick-start-btn');
  
  // Quick start state
  let quickStartRunning = false;
  let quickStartCurrentPreset = null;
  let quickStartCurrentStep = 0;
  let quickStartAnimationFrame = null;
  let quickStartStepTimeout = null;
  let quickStartStartTime = null;
  let quickStartTotalDuration = 0;
  
  // Easing functions for smooth animations
  const qsEasing = {
    easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  };
  
  // FOCUS PRESET - Beta waves (14-30 Hz) for mental clarity and concentration
  // 5 minutes total - Starts with calming alpha, builds up to beta for peak focus
  const FOCUS_SEQUENCE = [
    { left: 200, right: 210, duration: 30000, label: "Centering Mind", brainwave: "Alpha 10 Hz" },
    { left: 200, right: 212, duration: 35000, label: "Clearing Thoughts", brainwave: "Alpha 12 Hz" },
    { left: 200, right: 214, duration: 40000, label: "Building Focus", brainwave: "Low Beta 14 Hz" },
    { left: 200, right: 218, duration: 45000, label: "Mental Clarity", brainwave: "Beta 18 Hz" },
    { left: 200, right: 220, duration: 45000, label: "Deep Concentration", brainwave: "Beta 20 Hz" },
    { left: 200, right: 225, duration: 50000, label: "Peak Performance", brainwave: "Beta 25 Hz" },
    { left: 200, right: 218, duration: 30000, label: "Sustained Focus", brainwave: "Beta 18 Hz" },
    { left: 200, right: 215, duration: 25000, label: "Optimal Zone", brainwave: "Beta 15 Hz" },
  ];
  
  // ADVANCED DEEP FOCUS - Scientific peak performance protocol
  // 18 minutes total - Research-based optimal brainwave entrainment for focus & flow
  // Based on studies: SMR (12-15 Hz) improves attention, reduces ADHD symptoms
  // Mid-Beta (15-20 Hz) optimal for sustained analytical concentration
  // Gamma (40 Hz) triggers peak cognitive performance and "flow state"
  // Uses 220 Hz carrier - optimal for beta/gamma perception
  // Includes spatial audio for enhanced engagement and reduced monotony
  const DEEP_FOCUS_SEQUENCE = [
    // Phase 1: Calm Foundation (3 minutes)
    // Establish alpha baseline for calm alertness before ramping up
    { left: 220, right: 230, leftPan: -100, rightPan: 100, duration: 45000, label: "Mind Clear", brainwave: "Alpha 10 Hz" },
    { left: 220, right: 231, leftPan: -90, rightPan: 90, duration: 45000, label: "Alert Calm", brainwave: "Alpha 11 Hz" },
    { left: 220, right: 232, leftPan: -80, rightPan: 80, duration: 45000, label: "Ready State", brainwave: "Alpha 12 Hz" },
    { left: 220, right: 232.5, leftPan: -70, rightPan: 70, duration: 40000, label: "Activation", brainwave: "Alpha 12.5 Hz" },
    
    // Phase 2: SMR Attention Training (4 minutes)
    // Sensorimotor rhythm (12-15 Hz) - proven to improve attention and reduce distractibility
    { left: 220, right: 233, leftPan: -60, rightPan: 60, duration: 50000, label: "Focus Lock", brainwave: "SMR 13 Hz" },
    { left: 220, right: 234, leftPan: -55, rightPan: 55, duration: 55000, label: "Attention Hold", brainwave: "SMR 14 Hz" },
    { left: 220, right: 234.5, leftPan: -50, rightPan: 50, duration: 55000, label: "Laser Focus", brainwave: "SMR 14.5 Hz" },
    { left: 220, right: 235, leftPan: -45, rightPan: 45, duration: 50000, label: "Zone Entry", brainwave: "SMR 15 Hz" },
    
    // Phase 3: Active Beta Concentration (4 minutes)
    // Mid-beta (15-20 Hz) for active analytical thinking and sustained concentration
    { left: 220, right: 236, leftPan: -40, rightPan: 40, duration: 55000, label: "Active Mind", brainwave: "Beta 16 Hz" },
    { left: 220, right: 238, leftPan: -35, rightPan: 35, duration: 60000, label: "Deep Think", brainwave: "Beta 18 Hz" },
    { left: 220, right: 239, leftPan: -30, rightPan: 30, duration: 60000, label: "Concentration", brainwave: "Beta 19 Hz" },
    { left: 220, right: 240, leftPan: -25, rightPan: 25, duration: 55000, label: "Peak Beta", brainwave: "Beta 20 Hz" },
    
    // Phase 4: Gamma Peak Performance (4 minutes)
    // 40 Hz gamma - associated with "flow state", peak cognition, memory consolidation
    // Introduced gradually to avoid overstimulation
    { left: 220, right: 245, leftPan: -20, rightPan: 20, duration: 50000, label: "Gamma Rise", brainwave: "High Beta 25 Hz" },
    { left: 220, right: 250, leftPan: -15, rightPan: 15, duration: 55000, label: "Gamma Entry", brainwave: "Low Gamma 30 Hz" },
    { left: 220, right: 255, leftPan: -10, rightPan: 10, duration: 60000, label: "Flow State", brainwave: "Gamma 35 Hz" },
    { left: 220, right: 260, leftPan: -5, rightPan: 5, duration: 60000, label: "Peak Flow", brainwave: "Gamma 40 Hz" },
    
    // Phase 5: Sustained Optimal Focus (3 minutes)
    // Return to stable mid-beta for sustained productive work without burnout
    // Ends in optimal work zone so user can continue working
    { left: 220, right: 250, leftPan: -15, rightPan: 15, duration: 45000, label: "Stabilizing", brainwave: "Low Gamma 30 Hz" },
    { left: 220, right: 240, leftPan: -25, rightPan: 25, duration: 50000, label: "Optimal Work", brainwave: "Beta 20 Hz" },
    { left: 220, right: 238, leftPan: -30, rightPan: 30, duration: 50000, label: "Sustained", brainwave: "Beta 18 Hz" },
    { left: 220, right: 236, leftPan: -35, rightPan: 35, duration: 45000, label: "Productive", brainwave: "Beta 16 Hz" },
  ];
  
  // RELAX PRESET - Alpha/Theta waves (6-12 Hz) for calm and peace
  // 5 minutes total - Gentle descent from awareness to deep relaxation
  const RELAX_SEQUENCE = [
    { left: 136, right: 148, duration: 35000, label: "Settling In", brainwave: "Alpha 12 Hz" },
    { left: 136, right: 146, duration: 40000, label: "Releasing Tension", brainwave: "Alpha 10 Hz" },
    { left: 136, right: 144, duration: 40000, label: "Deep Breathing", brainwave: "Alpha 8 Hz" },
    { left: 136, right: 143, duration: 45000, label: "Inner Peace", brainwave: "Theta 7 Hz" },
    { left: 136, right: 142, duration: 45000, label: "Calm Awareness", brainwave: "Theta 6 Hz" },
    { left: 136, right: 143.83, duration: 40000, label: "Earth Resonance", brainwave: "Schumann 7.83 Hz" },
    { left: 136, right: 144, duration: 30000, label: "Peaceful Mind", brainwave: "Alpha 8 Hz" },
    { left: 136, right: 146, duration: 25000, label: "Gentle Return", brainwave: "Alpha 10 Hz" },
  ];
  
  // SLEEP PRESET - Delta/Theta waves (0.5-6 Hz) for deep rest
  // 5 minutes total - Progressive descent into delta for sleep preparation
  const SLEEP_SEQUENCE = [
    { left: 100, right: 110, leftPan: -100, rightPan: 100, duration: 25000, label: "Winding Down", brainwave: "Alpha 10 Hz" },
    { left: 100, right: 108, leftPan: -80, rightPan: 80, duration: 30000, label: "Letting Go", brainwave: "Alpha 8 Hz" },
    { left: 100, right: 106, leftPan: -60, rightPan: 60, duration: 35000, label: "Deep Calm", brainwave: "Theta 6 Hz" },
    { left: 100, right: 104, leftPan: -50, rightPan: 50, duration: 40000, label: "Drifting Off", brainwave: "Theta 4 Hz" },
    { left: 100, right: 103, leftPan: -40, rightPan: 40, duration: 45000, label: "Sleep Gateway", brainwave: "Delta 3 Hz" },
    { left: 100, right: 102, leftPan: -30, rightPan: 30, duration: 45000, label: "Deep Rest", brainwave: "Delta 2 Hz" },
    { left: 100, right: 101, leftPan: -20, rightPan: 20, duration: 40000, label: "Dreamland", brainwave: "Delta 1 Hz" },
    { left: 100, right: 100.5, leftPan: -10, rightPan: 10, duration: 40000, label: "Deep Sleep", brainwave: "Deep Delta 0.5 Hz" },
  ];
  
  // ADVANCED DEEP SLEEP - Scientific sleep induction protocol
  // 20 minutes total - Research-based optimal brainwave entrainment for sleep
  // Based on studies: Gradual descent through alpha→theta→delta with extended delta phases
  // Uses lower carrier frequency (85 Hz) optimal for delta entrainment
  // Incorporates Schumann resonance (7.83 Hz) for natural grounding
  // Extended deep delta phases (0.5-2 Hz) for maximum entrainment effectiveness
  const DEEP_SLEEP_SEQUENCE = [
    // Phase 1: Grounding & Initial Relaxation (3 minutes)
    // Gentle alpha waves to calm the mind and prepare for descent
    { left: 85, right: 95, leftPan: -100, rightPan: 100, duration: 45000, label: "Evening Calm", brainwave: "Alpha 10 Hz" },
    { left: 85, right: 93.83, leftPan: -90, rightPan: 90, duration: 45000, label: "Earth Grounding", brainwave: "Schumann 7.83 Hz" },
    { left: 85, right: 93, leftPan: -80, rightPan: 80, duration: 45000, label: "Releasing Day", brainwave: "Alpha 8 Hz" },
    { left: 85, right: 92, leftPan: -70, rightPan: 70, duration: 45000, label: "Mind Quieting", brainwave: "Theta 7 Hz" },
    
    // Phase 2: Theta Descent (4 minutes)
    // Hypnagogic state - the bridge between waking and sleep
    { left: 85, right: 91, leftPan: -60, rightPan: 60, duration: 50000, label: "Hypnagogic Entry", brainwave: "Theta 6 Hz" },
    { left: 85, right: 90, leftPan: -50, rightPan: 50, duration: 55000, label: "Twilight State", brainwave: "Theta 5 Hz" },
    { left: 85, right: 89, leftPan: -40, rightPan: 40, duration: 60000, label: "Dream Threshold", brainwave: "Theta 4 Hz" },
    { left: 85, right: 88.5, leftPan: -35, rightPan: 35, duration: 55000, label: "Sleep Gateway", brainwave: "Theta 3.5 Hz" },
    
    // Phase 3: Delta Entry (4 minutes)
    // Transitioning into sleep delta waves
    { left: 85, right: 88, leftPan: -30, rightPan: 30, duration: 60000, label: "Sleep Onset", brainwave: "Delta 3 Hz" },
    { left: 85, right: 87.5, leftPan: -25, rightPan: 25, duration: 60000, label: "Drifting Deeper", brainwave: "Delta 2.5 Hz" },
    { left: 85, right: 87, leftPan: -20, rightPan: 20, duration: 60000, label: "Deep Descent", brainwave: "Delta 2 Hz" },
    { left: 85, right: 86.5, leftPan: -15, rightPan: 15, duration: 60000, label: "Restorative Wave", brainwave: "Delta 1.5 Hz" },
    
    // Phase 4: Deep Delta Immersion (6 minutes)
    // Extended time at optimal sleep frequencies for maximum effectiveness
    // Research shows 0.5-2 Hz delta is most effective for deep sleep
    { left: 85, right: 86, leftPan: -10, rightPan: 10, duration: 75000, label: "Deep Sleep", brainwave: "Delta 1 Hz" },
    { left: 85, right: 85.75, leftPan: -8, rightPan: 8, duration: 75000, label: "Cellular Renewal", brainwave: "Delta 0.75 Hz" },
    { left: 85, right: 85.5, leftPan: -5, rightPan: 5, duration: 75000, label: "Profound Rest", brainwave: "Deep Delta 0.5 Hz" },
    { left: 85, right: 85.3, leftPan: -3, rightPan: 3, duration: 75000, label: "Sleep Anchor", brainwave: "Ultra Delta 0.3 Hz" },
    
    // Phase 5: Sleep Sustain (3 minutes)
    // Ultra-low delta with minimal spatial movement for uninterrupted sleep
    { left: 85, right: 85.5, leftPan: -2, rightPan: 2, duration: 60000, label: "Infinite Rest", brainwave: "Deep Delta 0.5 Hz" },
    { left: 85, right: 85.3, leftPan: -1, rightPan: 1, duration: 60000, label: "Dream Ocean", brainwave: "Ultra Delta 0.3 Hz" },
    { left: 85, right: 85.2, leftPan: 0, rightPan: 0, duration: 60000, label: "Stillness", brainwave: "Ultra Delta 0.2 Hz" },
  ];
  
  // DEEP MEDITATION - Theta-focused for profound meditative states
  // 6 minutes - Gentle theta journey with subtle spatial movement
  const MEDITATION_SEQUENCE = [
    { left: 136, right: 146, leftPan: -100, rightPan: 100, duration: 35000, label: "Grounding", brainwave: "Alpha 10 Hz" },
    { left: 136, right: 144, leftPan: -90, rightPan: 90, duration: 40000, label: "Breath Awareness", brainwave: "Alpha 8 Hz" },
    { left: 136, right: 143, leftPan: -70, rightPan: 70, duration: 45000, label: "Inner Stillness", brainwave: "Theta 7 Hz" },
    { left: 136, right: 142, leftPan: -50, rightPan: 50, duration: 50000, label: "Deep Presence", brainwave: "Theta 6 Hz" },
    { left: 136, right: 141, leftPan: -30, rightPan: 30, duration: 50000, label: "Pure Awareness", brainwave: "Theta 5 Hz" },
    { left: 136, right: 143.83, leftPan: -40, rightPan: 40, duration: 45000, label: "Earth Connection", brainwave: "Schumann 7.83 Hz" },
    { left: 136, right: 144, leftPan: -60, rightPan: 60, duration: 40000, label: "Integration", brainwave: "Alpha 8 Hz" },
    { left: 136, right: 146, leftPan: -100, rightPan: 100, duration: 35000, label: "Gentle Return", brainwave: "Alpha 10 Hz" },
  ];
  
  // ADVANCED TRANSCENDENT MEDITATION - Scientific enlightenment protocol
  // 25 minutes total - Research-based optimal brainwave entrainment for profound meditation
  // Based on studies: Experienced meditators show increased theta + gamma bursts
  // Alpha-theta training is proven effective for achieving deep meditative states
  // 40 Hz gamma observed in Tibetan monks during "compassion meditation"
  // Uses 136.1 Hz carrier - the "OM" frequency (Earth's rotation around the Sun)
  // Schumann resonance integration for Earth synchronization
  const TRANSCENDENT_MEDITATION_SEQUENCE = [
    // Phase 1: Grounding & Sacred Space (4 minutes)
    // Establish calm presence with alpha and Earth connection
    { left: 136.1, right: 146.1, leftPan: -100, rightPan: 100, duration: 50000, label: "Sacred Space", brainwave: "Alpha 10 Hz" },
    { left: 136.1, right: 145.1, leftPan: -90, rightPan: 90, duration: 50000, label: "Breath Anchor", brainwave: "Alpha 9 Hz" },
    { left: 136.1, right: 143.93, leftPan: -80, rightPan: 80, duration: 55000, label: "Earth Resonance", brainwave: "Schumann 7.83 Hz" },
    { left: 136.1, right: 144.1, leftPan: -70, rightPan: 70, duration: 50000, label: "Present Moment", brainwave: "Alpha 8 Hz" },
    
    // Phase 2: Alpha-Theta Descent (5 minutes)
    // Gradual transition through the "twilight" zone - gateway to deep meditation
    { left: 136.1, right: 143.6, leftPan: -65, rightPan: 65, duration: 55000, label: "Twilight Entry", brainwave: "Alpha-Theta 7.5 Hz" },
    { left: 136.1, right: 143.1, leftPan: -60, rightPan: 60, duration: 60000, label: "Inner Gateway", brainwave: "Theta 7 Hz" },
    { left: 136.1, right: 142.6, leftPan: -55, rightPan: 55, duration: 60000, label: "Consciousness Shift", brainwave: "Theta 6.5 Hz" },
    { left: 136.1, right: 142.1, leftPan: -50, rightPan: 50, duration: 60000, label: "Deep Within", brainwave: "Theta 6 Hz" },
    { left: 136.1, right: 141.6, leftPan: -45, rightPan: 45, duration: 55000, label: "Soul Space", brainwave: "Theta 5.5 Hz" },
    
    // Phase 3: Deep Theta Immersion (8 minutes)
    // Extended time in profound theta - the core meditative experience
    // This is where insights, visions, and deep peace occur
    { left: 136.1, right: 141.1, leftPan: -40, rightPan: 40, duration: 65000, label: "Pure Awareness", brainwave: "Theta 5 Hz" },
    { left: 136.1, right: 140.6, leftPan: -35, rightPan: 35, duration: 70000, label: "Infinite Mind", brainwave: "Theta 4.5 Hz" },
    { left: 136.1, right: 140.1, leftPan: -30, rightPan: 30, duration: 75000, label: "Void", brainwave: "Deep Theta 4 Hz" },
    { left: 136.1, right: 140.6, leftPan: -25, rightPan: 25, duration: 70000, label: "Stillness", brainwave: "Theta 4.5 Hz" },
    { left: 136.1, right: 141.1, leftPan: -30, rightPan: 30, duration: 65000, label: "Unity", brainwave: "Theta 5 Hz" },
    { left: 136.1, right: 143.93, leftPan: -35, rightPan: 35, duration: 60000, label: "Earth Heart", brainwave: "Schumann 7.83 Hz" },
    { left: 136.1, right: 141.1, leftPan: -30, rightPan: 30, duration: 60000, label: "Boundless", brainwave: "Theta 5 Hz" },
    
    // Phase 4: Gamma Enlightenment Burst (4 minutes)
    // Brief gamma activation - observed in advanced meditators during peak states
    // Associated with feelings of bliss, insight, and expanded consciousness
    { left: 136.1, right: 142.1, leftPan: -25, rightPan: 25, duration: 45000, label: "Rising Light", brainwave: "Theta 6 Hz" },
    { left: 136.1, right: 146.1, leftPan: -20, rightPan: 20, duration: 45000, label: "Awakening", brainwave: "Alpha 10 Hz" },
    { left: 136.1, right: 156.1, leftPan: -15, rightPan: 15, duration: 55000, label: "Insight Flash", brainwave: "Beta 20 Hz" },
    { left: 136.1, right: 176.1, leftPan: -10, rightPan: 10, duration: 60000, label: "Enlightenment", brainwave: "Gamma 40 Hz" },
    { left: 136.1, right: 156.1, leftPan: -15, rightPan: 15, duration: 45000, label: "Bliss Wave", brainwave: "Beta 20 Hz" },
    
    // Phase 5: Integration & Gentle Return (4 minutes)
    // Gradual return through theta to alpha - integrating the experience
    // Ends in calm, clear awareness
    { left: 136.1, right: 146.1, leftPan: -25, rightPan: 25, duration: 45000, label: "Descending", brainwave: "Alpha 10 Hz" },
    { left: 136.1, right: 143.93, leftPan: -35, rightPan: 35, duration: 50000, label: "Grounded Light", brainwave: "Schumann 7.83 Hz" },
    { left: 136.1, right: 144.1, leftPan: -50, rightPan: 50, duration: 50000, label: "Integration", brainwave: "Alpha 8 Hz" },
    { left: 136.1, right: 145.1, leftPan: -70, rightPan: 70, duration: 45000, label: "Wholeness", brainwave: "Alpha 9 Hz" },
    { left: 136.1, right: 146.1, leftPan: -100, rightPan: 100, duration: 45000, label: "Complete", brainwave: "Alpha 10 Hz" },
  ];
  
  // THIRD EYE AWAKENING - Scientific pineal gland activation protocol
  // 22 minutes total - Research-based frequencies for inner vision and third eye opening
  // Based on: 852 Hz & 963 Hz Solfeggio frequencies for pineal/Ajna activation
  // Theta waves (4-7 Hz) associated with visualization and mental imagery
  // 40 Hz Gamma creates the "illumination" effect - heightened perception
  // 144 Hz associated with light codes and higher consciousness
  // Uses 288 Hz carrier - octave relationship with 144 Hz and 576 Hz (crown frequencies)
  // Progressive activation from grounding → visualization → third eye frequencies → gamma illumination
  const THIRD_EYE_SEQUENCE = [
    // Phase 1: Grounding & Preparation (3 minutes)
    // Ground before ascending - essential for safe third eye work
    // OM frequency and Schumann to anchor in body and Earth
    { left: 136.1, right: 146.1, leftPan: -100, rightPan: 100, duration: 45000, label: "Body Anchor", brainwave: "Alpha 10 Hz" },
    { left: 136.1, right: 143.93, leftPan: -90, rightPan: 90, duration: 50000, label: "Earth Root", brainwave: "Schumann 7.83 Hz" },
    { left: 136.1, right: 144.1, leftPan: -80, rightPan: 80, duration: 45000, label: "Centered", brainwave: "Alpha 8 Hz" },
    { left: 144, right: 151, leftPan: -70, rightPan: 70, duration: 45000, label: "Light Carrier", brainwave: "Theta 7 Hz" },
    
    // Phase 2: Theta Visualization Activation (4 minutes)
    // Deep theta to activate inner vision and mental imagery centers
    // Narrowing stereo field to focus attention inward
    { left: 144, right: 150, leftPan: -60, rightPan: 60, duration: 50000, label: "Inner Gaze", brainwave: "Theta 6 Hz" },
    { left: 144, right: 149, leftPan: -50, rightPan: 50, duration: 55000, label: "Vision Opening", brainwave: "Theta 5 Hz" },
    { left: 144, right: 148.5, leftPan: -40, rightPan: 40, duration: 55000, label: "Mental Screen", brainwave: "Theta 4.5 Hz" },
    { left: 144, right: 148, leftPan: -35, rightPan: 35, duration: 55000, label: "Image Formation", brainwave: "Theta 4 Hz" },
    
    // Phase 3: Third Eye Solfeggio Activation (6 minutes)
    // 852 Hz (third eye) and 963 Hz (pineal/crown) - the core activation frequencies
    // Extended time for deep resonance with the pineal gland
    { left: 852, right: 858, leftPan: -30, rightPan: 30, duration: 60000, label: "852 Hz Ajna", brainwave: "Theta 6 Hz" },
    { left: 852, right: 857, leftPan: -25, rightPan: 25, duration: 65000, label: "Third Eye Open", brainwave: "Theta 5 Hz" },
    { left: 852, right: 856, leftPan: -20, rightPan: 20, duration: 60000, label: "Inner Sight", brainwave: "Theta 4 Hz" },
    { left: 963, right: 969, leftPan: -25, rightPan: 25, duration: 60000, label: "963 Hz Pineal", brainwave: "Theta 6 Hz" },
    { left: 963, right: 968, leftPan: -20, rightPan: 20, duration: 65000, label: "Crown Connect", brainwave: "Theta 5 Hz" },
    { left: 963, right: 967, leftPan: -15, rightPan: 15, duration: 55000, label: "Divine Vision", brainwave: "Theta 4 Hz" },
    
    // Phase 4: Gamma Illumination (5 minutes)
    // 40 Hz gamma for the "light" experience - heightened perception
    // This creates the illumination sensation reported in third eye activation
    { left: 288, right: 298, leftPan: -15, rightPan: 15, duration: 45000, label: "Rising Light", brainwave: "Alpha 10 Hz" },
    { left: 288, right: 308, leftPan: -10, rightPan: 10, duration: 50000, label: "Light Intensify", brainwave: "Beta 20 Hz" },
    { left: 288, right: 318, leftPan: -8, rightPan: 8, duration: 55000, label: "Brilliance", brainwave: "Beta 30 Hz" },
    { left: 288, right: 328, leftPan: -5, rightPan: 5, duration: 65000, label: "Illumination", brainwave: "Gamma 40 Hz" },
    { left: 288, right: 318, leftPan: -10, rightPan: 10, duration: 50000, label: "Radiance", brainwave: "Beta 30 Hz" },
    
    // Phase 5: Integration & Sustained Vision (4 minutes)
    // Return to theta with third eye carrier - maintaining enhanced vision
    // Gradual grounding while preserving the activated state
    { left: 852, right: 862, leftPan: -20, rightPan: 20, duration: 50000, label: "Vision Stable", brainwave: "Alpha 10 Hz" },
    { left: 852, right: 859.83, leftPan: -30, rightPan: 30, duration: 50000, label: "Earth Vision", brainwave: "Schumann 7.83 Hz" },
    { left: 144, right: 151, leftPan: -50, rightPan: 50, duration: 45000, label: "Light Body", brainwave: "Theta 7 Hz" },
    { left: 136.1, right: 143.93, leftPan: -70, rightPan: 70, duration: 45000, label: "Grounded Sight", brainwave: "Schumann 7.83 Hz" },
    { left: 136.1, right: 144.1, leftPan: -100, rightPan: 100, duration: 40000, label: "Awakened", brainwave: "Alpha 8 Hz" },
  ];
  
  // THETA DREAMS - Creative theta for visualization and dreams
  // 5 minutes - Deep theta with flowing spatial audio
  const THETA_SEQUENCE = [
    { left: 111, right: 121, leftPan: -100, rightPan: 100, duration: 30000, label: "Settling Mind", brainwave: "Alpha 10 Hz" },
    { left: 111, right: 119, leftPan: -80, rightPan: 80, duration: 35000, label: "Softening", brainwave: "Alpha 8 Hz" },
    { left: 111, right: 118, leftPan: -60, rightPan: 70, duration: 40000, label: "Dream Gateway", brainwave: "Theta 7 Hz" },
    { left: 111, right: 117, leftPan: -50, rightPan: 60, duration: 45000, label: "Theta Immersion", brainwave: "Theta 6 Hz" },
    { left: 111, right: 116, leftPan: -40, rightPan: 50, duration: 50000, label: "Deep Theta", brainwave: "Theta 5 Hz" },
    { left: 111, right: 115, leftPan: -30, rightPan: 40, duration: 45000, label: "Subconscious", brainwave: "Theta 4 Hz" },
    { left: 111, right: 117, leftPan: -50, rightPan: 60, duration: 35000, label: "Rising", brainwave: "Theta 6 Hz" },
    { left: 111, right: 119, leftPan: -80, rightPan: 90, duration: 30000, label: "Awakening", brainwave: "Alpha 8 Hz" },
  ];
  
  // BRAIN MASSAGE - Ultra-low delta for deep recovery
  // 6 minutes - Very slow waves with gentle, soothing pan movements
  const MASSAGE_SEQUENCE = [
    { left: 80, right: 88, leftPan: -100, rightPan: 100, duration: 35000, label: "Settling In", brainwave: "Alpha 8 Hz" },
    { left: 80, right: 86, leftPan: -70, rightPan: 70, duration: 40000, label: "Softening Mind", brainwave: "Theta 6 Hz" },
    { left: 80, right: 84, leftPan: -50, rightPan: 50, duration: 50000, label: "Deep Soothing", brainwave: "Theta 4 Hz" },
    { left: 80, right: 83, leftPan: -30, rightPan: 30, duration: 55000, label: "Neural Calm", brainwave: "Delta 3 Hz" },
    { left: 80, right: 82, leftPan: -20, rightPan: 20, duration: 55000, label: "Brain Rest", brainwave: "Delta 2 Hz" },
    { left: 80, right: 81.5, leftPan: -10, rightPan: 10, duration: 50000, label: "Deep Massage", brainwave: "Delta 1.5 Hz" },
    { left: 80, right: 83, leftPan: -30, rightPan: 30, duration: 40000, label: "Gentle Rise", brainwave: "Delta 3 Hz" },
    { left: 80, right: 86, leftPan: -60, rightPan: 60, duration: 35000, label: "Refreshed", brainwave: "Theta 6 Hz" },
  ];
  
  // DELTA DIVE - Deepest delta for cellular recovery
  // 5 minutes - Progressive descent to very deep delta
  const DELTA_SEQUENCE = [
    { left: 90, right: 98, leftPan: -100, rightPan: 100, duration: 30000, label: "Preparation", brainwave: "Alpha 8 Hz" },
    { left: 90, right: 96, leftPan: -80, rightPan: 80, duration: 35000, label: "Deepening", brainwave: "Theta 6 Hz" },
    { left: 90, right: 94, leftPan: -60, rightPan: 60, duration: 40000, label: "Theta Border", brainwave: "Theta 4 Hz" },
    { left: 90, right: 93, leftPan: -40, rightPan: 40, duration: 45000, label: "Delta Entry", brainwave: "Delta 3 Hz" },
    { left: 90, right: 92, leftPan: -30, rightPan: 30, duration: 50000, label: "Deep Delta", brainwave: "Delta 2 Hz" },
    { left: 90, right: 91, leftPan: -20, rightPan: 20, duration: 50000, label: "Ultra Deep", brainwave: "Delta 1 Hz" },
    { left: 90, right: 90.5, leftPan: -10, rightPan: 10, duration: 45000, label: "Cellular Rest", brainwave: "Deep Delta 0.5 Hz" },
    { left: 90, right: 93, leftPan: -40, rightPan: 40, duration: 35000, label: "Gentle Return", brainwave: "Delta 3 Hz" },
  ];
  
  // STRESS RELIEF - Alpha-theta border for anxiety release
  // 5 minutes - Calming frequencies with stabilizing pan
  const STRESS_SEQUENCE = [
    { left: 150, right: 162, leftPan: -100, rightPan: 100, duration: 30000, label: "Acknowledging", brainwave: "Alpha 12 Hz" },
    { left: 150, right: 160, leftPan: -90, rightPan: 90, duration: 35000, label: "Breath Sync", brainwave: "Alpha 10 Hz" },
    { left: 150, right: 158, leftPan: -70, rightPan: 70, duration: 40000, label: "Releasing", brainwave: "Alpha 8 Hz" },
    { left: 150, right: 157, leftPan: -50, rightPan: 50, duration: 45000, label: "Letting Go", brainwave: "Theta 7 Hz" },
    { left: 150, right: 156, leftPan: -40, rightPan: 40, duration: 45000, label: "Peace", brainwave: "Theta 6 Hz" },
    { left: 150, right: 157.83, leftPan: -50, rightPan: 50, duration: 40000, label: "Earth Ground", brainwave: "Schumann 7.83 Hz" },
    { left: 150, right: 158, leftPan: -70, rightPan: 70, duration: 35000, label: "Stability", brainwave: "Alpha 8 Hz" },
    { left: 150, right: 160, leftPan: -100, rightPan: 100, duration: 30000, label: "Renewed", brainwave: "Alpha 10 Hz" },
  ];
  
  // ADVANCED ANXIETY RELIEF - Scientific anxiety dissolution protocol
  // 18 minutes total - Research-based optimal brainwave entrainment for anxiety
  // Based on studies: Alpha enhancement (10 Hz) is most effective for anxiety reduction
  // Alpha-Theta crossover (7-8 Hz) enables emotional processing and release
  // SMR (12-15 Hz) promotes calm alertness without hypervigilance
  // Uses 136.1 Hz carrier - the "OM" frequency traditionally associated with calm
  // Schumann resonance integration for natural grounding
  const ANXIETY_RELIEF_SEQUENCE = [
    // Phase 1: Safety & Grounding (3 minutes)
    // SMR/Low Beta for alert calm, establishing safety before descent
    { left: 136.1, right: 148.1, leftPan: -100, rightPan: 100, duration: 40000, label: "Safe Space", brainwave: "SMR 12 Hz" },
    { left: 136.1, right: 147.1, leftPan: -90, rightPan: 90, duration: 45000, label: "Present Moment", brainwave: "Alpha 11 Hz" },
    { left: 136.1, right: 146.1, leftPan: -80, rightPan: 80, duration: 50000, label: "Settling In", brainwave: "Alpha 10 Hz" },
    { left: 136.1, right: 145.1, leftPan: -70, rightPan: 70, duration: 45000, label: "Body Awareness", brainwave: "Alpha 9 Hz" },
    
    // Phase 2: Alpha Enhancement (4 minutes)
    // Extended 10 Hz alpha - research shows this is the "sweet spot" for anxiety reduction
    // Multiple passes through 10 Hz with Schumann integration
    { left: 136.1, right: 146.1, leftPan: -65, rightPan: 65, duration: 55000, label: "Alpha Wave", brainwave: "Alpha 10 Hz" },
    { left: 136.1, right: 143.93, leftPan: -60, rightPan: 60, duration: 50000, label: "Earth Sync", brainwave: "Schumann 7.83 Hz" },
    { left: 136.1, right: 146.1, leftPan: -55, rightPan: 55, duration: 55000, label: "Calm Alpha", brainwave: "Alpha 10 Hz" },
    { left: 136.1, right: 145.1, leftPan: -50, rightPan: 50, duration: 50000, label: "Deepening Calm", brainwave: "Alpha 9 Hz" },
    
    // Phase 3: Alpha-Theta Border (5 minutes)
    // The therapeutic "crossover" zone (7-8 Hz) - where emotional processing occurs
    // Extended time here for maximum anxiety release and emotional integration
    { left: 136.1, right: 144.1, leftPan: -45, rightPan: 45, duration: 55000, label: "Letting Go", brainwave: "Alpha 8 Hz" },
    { left: 136.1, right: 143.93, leftPan: -40, rightPan: 40, duration: 60000, label: "Natural Rhythm", brainwave: "Schumann 7.83 Hz" },
    { left: 136.1, right: 143.6, leftPan: -35, rightPan: 35, duration: 60000, label: "Crossover Zone", brainwave: "Alpha-Theta 7.5 Hz" },
    { left: 136.1, right: 143.1, leftPan: -30, rightPan: 30, duration: 65000, label: "Release Point", brainwave: "Theta 7 Hz" },
    { left: 136.1, right: 143.93, leftPan: -35, rightPan: 35, duration: 55000, label: "Integration", brainwave: "Schumann 7.83 Hz" },
    
    // Phase 4: Deep Calm Theta (3 minutes)
    // Lower theta for profound calm - not too deep to maintain awareness
    { left: 136.1, right: 142.1, leftPan: -30, rightPan: 30, duration: 55000, label: "Deep Calm", brainwave: "Theta 6 Hz" },
    { left: 136.1, right: 141.1, leftPan: -25, rightPan: 25, duration: 60000, label: "Inner Peace", brainwave: "Theta 5 Hz" },
    { left: 136.1, right: 142.1, leftPan: -30, rightPan: 30, duration: 50000, label: "Serenity", brainwave: "Theta 6 Hz" },
    
    // Phase 5: Stable Return (3 minutes)
    // Gradual return to functional, calm alpha - user remains calm but alert
    { left: 136.1, right: 143.93, leftPan: -40, rightPan: 40, duration: 50000, label: "Grounded", brainwave: "Schumann 7.83 Hz" },
    { left: 136.1, right: 144.1, leftPan: -50, rightPan: 50, duration: 45000, label: "Rising Gently", brainwave: "Alpha 8 Hz" },
    { left: 136.1, right: 145.1, leftPan: -60, rightPan: 60, duration: 45000, label: "Clarity", brainwave: "Alpha 9 Hz" },
    { left: 136.1, right: 146.1, leftPan: -70, rightPan: 70, duration: 40000, label: "Renewed Calm", brainwave: "Alpha 10 Hz" },
  ];
  
  // LUCID REST - Theta-delta for conscious relaxation
  // 5 minutes - Hovering at theta-delta border for aware rest
  const LUCID_SEQUENCE = [
    { left: 120, right: 130, leftPan: -100, rightPan: 100, duration: 30000, label: "Settling", brainwave: "Alpha 10 Hz" },
    { left: 120, right: 128, leftPan: -80, rightPan: 80, duration: 35000, label: "Deepening", brainwave: "Alpha 8 Hz" },
    { left: 120, right: 126, leftPan: -60, rightPan: 60, duration: 40000, label: "Theta Entry", brainwave: "Theta 6 Hz" },
    { left: 120, right: 125, leftPan: -50, rightPan: 50, duration: 45000, label: "Lucid Theta", brainwave: "Theta 5 Hz" },
    { left: 120, right: 124, leftPan: -40, rightPan: 40, duration: 45000, label: "Aware Rest", brainwave: "Theta 4 Hz" },
    { left: 120, right: 123.5, leftPan: -35, rightPan: 35, duration: 45000, label: "Border State", brainwave: "Theta 3.5 Hz" },
    { left: 120, right: 125, leftPan: -50, rightPan: 50, duration: 35000, label: "Rising", brainwave: "Theta 5 Hz" },
    { left: 120, right: 128, leftPan: -80, rightPan: 80, duration: 30000, label: "Emergence", brainwave: "Alpha 8 Hz" },
  ];
  
  // 8D IMMERSION - Full surround sound spatial experience
  // 6 minutes - Rotating sound field with alpha-theta for immersive relaxation
  const IMMERSION_SEQUENCE = [
    { left: 144, right: 154, leftPan: -100, rightPan: 100, duration: 35000, label: "Centering", brainwave: "Alpha 10 Hz" },
    { left: 144, right: 152, leftPan: -50, rightPan: -50, duration: 40000, label: "Left Embrace", brainwave: "Alpha 8 Hz" },
    { left: 144, right: 151, leftPan: 50, rightPan: 50, duration: 40000, label: "Right Flow", brainwave: "Theta 7 Hz" },
    { left: 144, right: 150, leftPan: -70, rightPan: 70, duration: 45000, label: "Wide Field", brainwave: "Theta 6 Hz" },
    { left: 144, right: 150, leftPan: 70, rightPan: -70, duration: 45000, label: "Surround Swap", brainwave: "Theta 6 Hz" },
    { left: 144, right: 150, leftPan: 0, rightPan: 0, duration: 40000, label: "Center Focus", brainwave: "Theta 6 Hz" },
    { left: 144, right: 151, leftPan: -30, rightPan: 30, duration: 40000, label: "Gentle Return", brainwave: "Theta 7 Hz" },
    { left: 144, right: 154, leftPan: -100, rightPan: 100, duration: 35000, label: "Grounded", brainwave: "Alpha 10 Hz" },
  ];
  
  // HEARTBEAT SYNC - Healthy resting heart rhythm entrainment
  // 5 minutes - Steady 60 BPM (healthy resting heart rate) with calming binaural beats
  // Based on coherent heart rhythm for HRV optimization and stress reduction
  const HEARTBEAT_SEQUENCE = [
    // Phase 1: Attunement - Match healthy 60 BPM rhythm
    { left: 136, right: 146, leftPan: -100, rightPan: 100, duration: 20000, label: "Heart Attunement", brainwave: "Alpha 10 Hz" },
    { left: 136, right: 144, leftPan: -90, rightPan: 90, duration: 20000, label: "Rhythm Sync", brainwave: "Alpha 8 Hz" },
    // Phase 2: Coherence - Theta for heart-brain coherence  
    { left: 136, right: 143, leftPan: -80, rightPan: 80, duration: 25000, label: "Heart Coherence", brainwave: "Theta 7 Hz" },
    { left: 136, right: 142, leftPan: -70, rightPan: 70, duration: 25000, label: "Steady Rhythm", brainwave: "Theta 6 Hz" },
    // Phase 3: Deep Calm - Lower theta for parasympathetic activation
    { left: 136, right: 141, leftPan: -60, rightPan: 60, duration: 30000, label: "Calm Heart", brainwave: "Theta 5 Hz" },
    { left: 136, right: 140, leftPan: -50, rightPan: 50, duration: 30000, label: "Rest & Digest", brainwave: "Theta 4 Hz" },
    // Phase 4: Integration - Gentle return with heart-centered awareness
    { left: 136, right: 141, leftPan: -60, rightPan: 60, duration: 25000, label: "Heart Center", brainwave: "Theta 5 Hz" },
    { left: 136, right: 143.83, leftPan: -80, rightPan: 80, duration: 25000, label: "Earth Heart", brainwave: "Schumann 7.83 Hz" },
    { left: 136, right: 144, leftPan: -100, rightPan: 100, duration: 20000, label: "Balanced Heart", brainwave: "Alpha 8 Hz" },
  ];
  
  // ADVANCED BODY RESTORATION - Scientific cellular healing protocol
  // 22 minutes total - Research-based optimal brainwave entrainment for physical healing
  // Based on studies: Delta waves (0.5-4 Hz) trigger growth hormone release
  // Deep delta associated with cellular regeneration and tissue repair
  // Theta activates parasympathetic "rest and digest" healing mode
  // 10 Hz alpha shown to reduce inflammation markers
  // Ultra-low delta (0.5-2 Hz) associated with pain reduction
  // Uses 111 Hz carrier - associated with cell regeneration in some studies
  const BODY_RESTORATION_SEQUENCE = [
    // Phase 1: Relaxation & Cortisol Reduction (3 minutes)
    // Alpha waves to reduce stress hormones and prepare body for healing
    { left: 111, right: 121, leftPan: -100, rightPan: 100, duration: 45000, label: "Body Scan", brainwave: "Alpha 10 Hz" },
    { left: 111, right: 120, leftPan: -90, rightPan: 90, duration: 45000, label: "Tension Release", brainwave: "Alpha 9 Hz" },
    { left: 111, right: 119, leftPan: -80, rightPan: 80, duration: 45000, label: "Stress Dissolve", brainwave: "Alpha 8 Hz" },
    { left: 111, right: 118.83, leftPan: -70, rightPan: 70, duration: 50000, label: "Earth Ground", brainwave: "Schumann 7.83 Hz" },
    
    // Phase 2: Vagus Nerve & Parasympathetic Activation (4 minutes)
    // Theta for "rest and digest" mode - activates body's healing systems
    { left: 111, right: 118, leftPan: -65, rightPan: 65, duration: 55000, label: "Vagus Activation", brainwave: "Theta 7 Hz" },
    { left: 111, right: 117, leftPan: -60, rightPan: 60, duration: 60000, label: "Rest & Digest", brainwave: "Theta 6 Hz" },
    { left: 111, right: 116, leftPan: -55, rightPan: 55, duration: 60000, label: "Immune Boost", brainwave: "Theta 5 Hz" },
    { left: 111, right: 115, leftPan: -50, rightPan: 50, duration: 55000, label: "Healing Mode", brainwave: "Theta 4 Hz" },
    
    // Phase 3: Cellular Regeneration (7 minutes)
    // Deep delta for growth hormone release and cellular repair
    // Extended time at optimal healing frequencies
    { left: 111, right: 114, leftPan: -45, rightPan: 45, duration: 65000, label: "Cell Renewal", brainwave: "Delta 3 Hz" },
    { left: 111, right: 113.5, leftPan: -40, rightPan: 40, duration: 70000, label: "Deep Healing", brainwave: "Delta 2.5 Hz" },
    { left: 111, right: 113, leftPan: -35, rightPan: 35, duration: 75000, label: "Growth Hormone", brainwave: "Delta 2 Hz" },
    { left: 111, right: 112.5, leftPan: -30, rightPan: 30, duration: 75000, label: "Tissue Repair", brainwave: "Delta 1.5 Hz" },
    { left: 111, right: 112, leftPan: -25, rightPan: 25, duration: 70000, label: "Regeneration", brainwave: "Delta 1 Hz" },
    { left: 111, right: 111.75, leftPan: -20, rightPan: 20, duration: 65000, label: "Deep Restore", brainwave: "Delta 0.75 Hz" },
    
    // Phase 4: Pain & Inflammation Relief (4 minutes)
    // Ultra-low delta for pain reduction, brief alpha for anti-inflammatory effect
    { left: 111, right: 111.5, leftPan: -15, rightPan: 15, duration: 60000, label: "Pain Release", brainwave: "Ultra Delta 0.5 Hz" },
    { left: 111, right: 112, leftPan: -20, rightPan: 20, duration: 55000, label: "Soothe", brainwave: "Delta 1 Hz" },
    { left: 111, right: 113, leftPan: -30, rightPan: 30, duration: 50000, label: "Inflammation Ease", brainwave: "Delta 2 Hz" },
    { left: 111, right: 121, leftPan: -40, rightPan: 40, duration: 45000, label: "Anti-Inflam Alpha", brainwave: "Alpha 10 Hz" },
    
    // Phase 5: Integration & Vitality (4 minutes)
    // Gradual return through theta to alpha - feeling restored and refreshed
    { left: 111, right: 118.83, leftPan: -50, rightPan: 50, duration: 50000, label: "Earth Vitality", brainwave: "Schumann 7.83 Hz" },
    { left: 111, right: 118, leftPan: -60, rightPan: 60, duration: 50000, label: "Body Harmony", brainwave: "Theta 7 Hz" },
    { left: 111, right: 119, leftPan: -70, rightPan: 70, duration: 45000, label: "Energy Rise", brainwave: "Alpha 8 Hz" },
    { left: 111, right: 120, leftPan: -85, rightPan: 85, duration: 45000, label: "Renewed", brainwave: "Alpha 9 Hz" },
    { left: 111, right: 121, leftPan: -100, rightPan: 100, duration: 40000, label: "Vitality", brainwave: "Alpha 10 Hz" },
  ];
  
  // COSMIC BREATH - Rising/falling frequencies with expanding/contracting spatial field
  // 6 minutes - Simulates deep breathing with audio that "inhales" and "exhales"
  // Frequencies rise on inhale, fall on exhale; pan expands and contracts
  const BREATH_SEQUENCE = [
    // Breath 1 - Normal pace (4 sec inhale, 4 sec exhale)
    { left: 120, right: 120, leftPan: -30, rightPan: 30, duration: 4000, label: "Inhale ↑", brainwave: "Centering" },
    { left: 120, right: 130, leftPan: -100, rightPan: 100, duration: 4000, label: "Full Breath", brainwave: "Alpha 10 Hz" },
    { left: 120, right: 120, leftPan: -30, rightPan: 30, duration: 4000, label: "Exhale ↓", brainwave: "Release" },
    { left: 120, right: 128, leftPan: -100, rightPan: 100, duration: 4000, label: "Empty", brainwave: "Alpha 8 Hz" },
    // Breath 2 - Slowing (5 sec cycles)
    { left: 120, right: 120, leftPan: -20, rightPan: 20, duration: 5000, label: "Deep Inhale ↑", brainwave: "Expanding" },
    { left: 120, right: 128, leftPan: -100, rightPan: 100, duration: 5000, label: "Full Breath", brainwave: "Alpha 8 Hz" },
    { left: 120, right: 120, leftPan: -20, rightPan: 20, duration: 5000, label: "Long Exhale ↓", brainwave: "Releasing" },
    { left: 120, right: 127, leftPan: -100, rightPan: 100, duration: 5000, label: "Stillness", brainwave: "Theta 7 Hz" },
    // Breath 3 - Deep breathing (6 sec cycles)
    { left: 120, right: 120, leftPan: -10, rightPan: 10, duration: 6000, label: "Ocean Inhale ↑", brainwave: "Deep Draw" },
    { left: 120, right: 127, leftPan: -100, rightPan: 100, duration: 6000, label: "Wave Peak", brainwave: "Theta 7 Hz" },
    { left: 120, right: 120, leftPan: -10, rightPan: 10, duration: 6000, label: "Ocean Exhale ↓", brainwave: "Ebb" },
    { left: 120, right: 126, leftPan: -100, rightPan: 100, duration: 6000, label: "Calm Sea", brainwave: "Theta 6 Hz" },
    // Breath 4 - Very slow, meditative (7 sec cycles)
    { left: 120, right: 120, leftPan: 0, rightPan: 0, duration: 7000, label: "Cosmic Inhale ↑", brainwave: "One" },
    { left: 120, right: 126, leftPan: -100, rightPan: 100, duration: 7000, label: "Universe", brainwave: "Theta 6 Hz" },
    { left: 120, right: 120, leftPan: 0, rightPan: 0, duration: 7000, label: "Cosmic Exhale ↓", brainwave: "Infinite" },
    { left: 120, right: 125, leftPan: -50, rightPan: 50, duration: 7000, label: "Pure Being", brainwave: "Theta 5 Hz" },
  ];

  // SPACE CLEARING - Sacred frequency protocol for clearing and harmonizing spaces
  // 18 minutes total - Uses Solfeggio frequencies and sacred tones for energetic cleansing
  // IMPORTANT: Designed for SPEAKER playback to fill and clear room spaces
  // Based on: Ancient Solfeggio scale, Schumann resonance, 432 Hz universal harmony
  // The carrier frequencies themselves carry the clearing effect when played through speakers
  // Binaural components add subtle pulsing that enhances the clearing vibration
  // Progressive sweep from grounding → clearing → transformation → purification → sealing
  const SPACE_CLEARING_SEQUENCE = [
    // Phase 1: Opening & Grounding (3 minutes)
    // OM frequency (136.1 Hz) to establish sacred space, Schumann for Earth connection
    // Wide stereo spread to fill the room corners
    { left: 136.1, right: 143.93, leftPan: -100, rightPan: 100, duration: 50000, label: "Sacred Opening", brainwave: "Schumann 7.83 Hz" },
    { left: 136.1, right: 143.1, leftPan: -100, rightPan: 100, duration: 50000, label: "OM Resonance", brainwave: "Theta 7 Hz" },
    { left: 174, right: 181.83, leftPan: -100, rightPan: 100, duration: 55000, label: "Foundation Tone", brainwave: "Schumann 7.83 Hz" },
    
    // Phase 2: Low Frequency Clearing (3 minutes)
    // Solfeggio 174 Hz (foundation) and 285 Hz (energy field) to clear dense energy
    // Dynamic panning to "sweep" through the space
    { left: 174, right: 180, leftPan: -100, rightPan: -100, duration: 35000, label: "Clearing Left", brainwave: "Theta 6 Hz" },
    { left: 174, right: 180, leftPan: 100, rightPan: 100, duration: 35000, label: "Clearing Right", brainwave: "Theta 6 Hz" },
    { left: 285, right: 291, leftPan: -100, rightPan: 100, duration: 50000, label: "Energy Field", brainwave: "Theta 6 Hz" },
    { left: 285, right: 292, leftPan: 100, rightPan: -100, duration: 50000, label: "Field Sweep", brainwave: "Theta 7 Hz" },
    
    // Phase 3: Liberation & Transformation (4 minutes)
    // Solfeggio 396 Hz (liberation), 417 Hz (change), 528 Hz (miracle/DNA)
    // These are the active "clearing" frequencies - removing stagnant energy
    { left: 396, right: 402, leftPan: -100, rightPan: 100, duration: 50000, label: "Liberation", brainwave: "Theta 6 Hz" },
    { left: 396, right: 403.83, leftPan: -80, rightPan: 80, duration: 45000, label: "Release Fear", brainwave: "Schumann 7.83 Hz" },
    { left: 417, right: 423, leftPan: -100, rightPan: 100, duration: 50000, label: "Facilitate Change", brainwave: "Theta 6 Hz" },
    { left: 417, right: 425, leftPan: 80, rightPan: -80, duration: 45000, label: "Transmutation", brainwave: "Alpha 8 Hz" },
    { left: 528, right: 534, leftPan: -100, rightPan: 100, duration: 55000, label: "Miracle Tone", brainwave: "Theta 6 Hz" },
    
    // Phase 4: High Frequency Purification (4 minutes)
    // Solfeggio 639 Hz (connection), 741 Hz (awakening), 852 Hz (spiritual order)
    // Higher frequencies to refine and brighten the space
    { left: 639, right: 646, leftPan: -100, rightPan: 100, duration: 50000, label: "Harmonize", brainwave: "Theta 7 Hz" },
    { left: 639, right: 647.83, leftPan: -70, rightPan: 70, duration: 45000, label: "Connection", brainwave: "Schumann 7.83 Hz" },
    { left: 741, right: 749, leftPan: -100, rightPan: 100, duration: 50000, label: "Awakening", brainwave: "Alpha 8 Hz" },
    { left: 741, right: 751, leftPan: 70, rightPan: -70, duration: 45000, label: "Cleanse Toxins", brainwave: "Alpha 10 Hz" },
    { left: 852, right: 860, leftPan: -100, rightPan: 100, duration: 50000, label: "Spiritual Order", brainwave: "Alpha 8 Hz" },
    
    // Phase 5: Crown Activation & Sealing (4 minutes)
    // Solfeggio 963 Hz (divine), return to 432 Hz (universal harmony), seal with Schumann
    // This phase "seals" the cleared space with positive, harmonious energy
    { left: 963, right: 971, leftPan: -100, rightPan: 100, duration: 50000, label: "Divine Light", brainwave: "Alpha 8 Hz" },
    { left: 963, right: 973, leftPan: -80, rightPan: 80, duration: 50000, label: "Crown Opening", brainwave: "Alpha 10 Hz" },
    { left: 432, right: 439.83, leftPan: -100, rightPan: 100, duration: 55000, label: "Universal Harmony", brainwave: "Schumann 7.83 Hz" },
    { left: 432, right: 442, leftPan: -100, rightPan: 100, duration: 50000, label: "432 Hz Balance", brainwave: "Alpha 10 Hz" },
    { left: 136.1, right: 143.93, leftPan: -100, rightPan: 100, duration: 50000, label: "OM Seal", brainwave: "Schumann 7.83 Hz" },
    { left: 136.1, right: 143.93, leftPan: 0, rightPan: 0, duration: 40000, label: "Space Blessed", brainwave: "Schumann 7.83 Hz" },
  ];

  // MYSTERY MODE - Generates a unique random sequence each time (safe template)
  // Creates varied experiences while following brainwave safety guidelines
  function generateMysterySequence() {
    const sequence = [];
    
    // Safe frequency ranges for base (left channel)
    const baseFrequencies = [100, 110, 120, 130, 136, 144, 150, 160];
    const baseFreq = baseFrequencies[Math.floor(Math.random() * baseFrequencies.length)];
    
    // Random journey type determines the overall arc
    const journeyTypes = ['relaxation', 'meditation', 'exploration', 'grounding'];
    const journeyType = journeyTypes[Math.floor(Math.random() * journeyTypes.length)];
    
    // Brainwave targets based on journey type
    let brainwaveArc;
    switch (journeyType) {
      case 'relaxation':
        brainwaveArc = [10, 8, 7, 6, 5, 6, 8, 10]; // Alpha to theta and back
        break;
      case 'meditation':
        brainwaveArc = [10, 8, 6, 5, 4, 5, 7, 10]; // Deeper theta focus
        break;
      case 'exploration':
        brainwaveArc = [12, 10, 8, 10, 7, 8, 10, 12]; // Varied alpha-theta
        break;
      case 'grounding':
        brainwaveArc = [10, 7.83, 6, 7.83, 5, 7.83, 8, 10]; // Schumann resonance focus
        break;
    }
    
    // Random labels for mystery effect
    const mysteryLabels = [
      ['Entering...', 'Shifting...', 'Deepening...', 'Floating...', 'Drifting...', 'Rising...', 'Emerging...', 'Returning...'],
      ['Portal Open', 'Descent', 'Inner Space', 'Void', 'Stillness', 'Ascent', 'Light', 'Home'],
      ['Wave 1', 'Wave 2', 'Wave 3', 'Wave 4', 'Wave 5', 'Wave 6', 'Wave 7', 'Wave 8'],
      ['Phase α', 'Phase β', 'Phase γ', 'Phase δ', 'Phase ε', 'Phase ζ', 'Phase η', 'Phase θ']
    ];
    const labelSet = mysteryLabels[Math.floor(Math.random() * mysteryLabels.length)];
    
    // Generate 8 phases with safe transitions
    for (let i = 0; i < 8; i++) {
      const binauralBeat = brainwaveArc[i];
      const rightFreq = baseFreq + binauralBeat;
      
      // Randomize duration between 20-40 seconds per phase
      const duration = 20000 + Math.floor(Math.random() * 20000);
      
      // Generate safe pan values - gradual narrowing then widening
      // Middle phases have narrower pan (more centered feel)
      const panIntensity = i < 4 ? (100 - i * 15) : (40 + (i - 4) * 15);
      const leftPan = -panIntensity + Math.floor(Math.random() * 20 - 10);
      const rightPan = panIntensity + Math.floor(Math.random() * 20 - 10);
      
      // Brainwave label
      let brainwaveLabel;
      if (binauralBeat >= 12) brainwaveLabel = `Alpha ${binauralBeat} Hz`;
      else if (binauralBeat >= 8) brainwaveLabel = `Alpha ${binauralBeat} Hz`;
      else if (binauralBeat === 7.83) brainwaveLabel = 'Schumann 7.83 Hz';
      else if (binauralBeat >= 4) brainwaveLabel = `Theta ${binauralBeat} Hz`;
      else brainwaveLabel = `Delta ${binauralBeat} Hz`;
      
      sequence.push({
        left: baseFreq,
        right: rightFreq,
        leftPan: Math.max(-100, Math.min(100, leftPan)),
        rightPan: Math.max(-100, Math.min(100, rightPan)),
        duration: duration,
        label: labelSet[i],
        brainwave: brainwaveLabel
      });
    }
    
    return sequence;
  }

  const QUICK_START_PRESETS = {
    focus: { sequence: FOCUS_SEQUENCE, name: "Focus Mode", color: "#f59e0b" },
    deepFocus: { sequence: DEEP_FOCUS_SEQUENCE, name: "Deep Focus", color: "#b45309" },
    relax: { sequence: RELAX_SEQUENCE, name: "Relaxation", color: "#34d399" },
    sleep: { sequence: SLEEP_SEQUENCE, name: "Sleep Prep", color: "#818cf8" },
    deepSleep: { sequence: DEEP_SLEEP_SEQUENCE, name: "Deep Sleep", color: "#1e3a5f" },
    meditation: { sequence: MEDITATION_SEQUENCE, name: "Deep Meditation", color: "#a78bfa" },
    transcendent: { sequence: TRANSCENDENT_MEDITATION_SEQUENCE, name: "Transcendent", color: "#7c3aed" },
    thirdEye: { sequence: THIRD_EYE_SEQUENCE, name: "Third Eye", color: "#4f46e5" },
    theta: { sequence: THETA_SEQUENCE, name: "Theta Dreams", color: "#c084fc" },
    massage: { sequence: MASSAGE_SEQUENCE, name: "Brain Massage", color: "#f472b6" },
    bodyRestore: { sequence: BODY_RESTORATION_SEQUENCE, name: "Body Restore", color: "#be185d" },
    delta: { sequence: DELTA_SEQUENCE, name: "Delta Dive", color: "#60a5fa" },
    stress: { sequence: STRESS_SEQUENCE, name: "Stress Relief", color: "#4ade80" },
    anxietyRelief: { sequence: ANXIETY_RELIEF_SEQUENCE, name: "Anxiety Relief", color: "#059669" },
    lucid: { sequence: LUCID_SEQUENCE, name: "Lucid Rest", color: "#22d3d8" },
    immersion: { sequence: IMMERSION_SEQUENCE, name: "8D Immersion", color: "#fb923c" },
    heartbeat: { sequence: HEARTBEAT_SEQUENCE, name: "Heartbeat Sync", color: "#ef4444" },
    breath: { sequence: BREATH_SEQUENCE, name: "Cosmic Breath", color: "#06b6d4" },
    spaceClear: { sequence: SPACE_CLEARING_SEQUENCE, name: "Space Clearing", color: "#0d9488" },
    quantum: { sequence: null, name: "Quantum", color: "#8b5cf6", isRandom: true },
  };
  
  // Get total duration of a sequence
  function getSequenceDuration(sequence) {
    return sequence.reduce((total, step) => total + step.duration, 0);
  }
  
  // Create phase markers for the progress bar
  function createQSPhaseMarkers(sequence, totalDuration) {
    if (!qsPhaseMarkers) return;
    
    // Clear existing markers
    qsPhaseMarkers.innerHTML = '';
    
    // Create markers at each phase boundary (skip first phase)
    let cumulative = 0;
    sequence.forEach((step, i) => {
      if (i > 0) {
        const marker = document.createElement('div');
        marker.className = 'qs-phase-marker';
        marker.style.left = `${(cumulative / totalDuration) * 100}%`;
        marker.title = step.label;
        qsPhaseMarkers.appendChild(marker);
      }
      cumulative += step.duration;
    });
  }
  
  // Format time as MM:SS
  function formatQSTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // Update status bar UI
  function updateQuickStartOverlay(label, brainwave, stepIndex, totalSteps, progress, elapsedMs) {
    if (qsLabel) qsLabel.textContent = label;
    if (qsBrainwave) qsBrainwave.textContent = brainwave;
    if (qsProgressFill) qsProgressFill.style.width = `${progress * 100}%`;
    if (qsElapsed && typeof elapsedMs === 'number') qsElapsed.textContent = formatQSTime(elapsedMs);
    if (qsTotal) qsTotal.textContent = formatQSTime(quickStartTotalDuration);
  }
  
  // Update button progress bar
  function updateButtonProgress(preset, progress) {
    const btn = document.querySelector(`.quick-start-btn[data-preset="${preset}"]`);
    if (btn) {
      const progressBar = btn.querySelector('.qsb-progress');
      if (progressBar) {
        progressBar.style.width = `${progress * 100}%`;
      }
    }
  }
  
  // Helper to update pan slider UI for Quick Start
  function updateQSPanSliderUI(wheelId, panValue) {
    const slider = document.querySelector(`.pan-slider[data-wheel="${wheelId}"]`);
    if (slider) {
      slider.value = panValue;
    }
  }
  
  // Animate wheels smoothly between frequencies (with optional pan support)
  function animateQuickStartWheels(fromLeft, toLeft, fromRight, toRight, duration, onComplete, fromLeftPan, toLeftPan, fromRightPan, toRightPan) {
    const startTime = performance.now();
    const hasPan = typeof fromLeftPan === 'number' && typeof toLeftPan === 'number';
    
    // iOS Safari fix: Don't use linearRampToValueAtTime directly on oscillators
    // as it conflicts with setTargetAtTime called by scheduleOscillatorSync.
    // Let the wheel setHz + scheduleOscillatorSync handle audio updates,
    // which is the same approach that works for binaural beat presets.
    
    function animate(currentTime) {
      if (!quickStartRunning) return;
      
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = qsEasing.easeInOutCubic(progress);
      
      // Calculate current frequencies
      const leftFreq = fromLeft + (toLeft - fromLeft) * eased;
      const rightFreq = fromRight + (toRight - fromRight) * eased;
      
      // Update wheel visuals
      wheelL.setHz(leftFreq);
      wheelR.setHz(rightFreq);
      
      // Animate pan if values provided
      if (hasPan) {
        const leftPan = fromLeftPan + (toLeftPan - fromLeftPan) * eased;
        const rightPan = fromRightPan + (toRightPan - fromRightPan) * eased;
        setPan('wheelL', Math.round(leftPan));
        setPan('wheelR', Math.round(rightPan));
        updateQSPanSliderUI('wheelL', Math.round(leftPan));
        updateQSPanSliderUI('wheelR', Math.round(rightPan));
      }
      
      // Update live info display
      updateLiveInfo();
      
      if (progress < 1 && quickStartRunning) {
        quickStartAnimationFrame = requestAnimationFrame(animate);
      } else if (progress >= 1) {
        wheelL.setHz(toLeft);
        wheelR.setHz(toRight);
        if (hasPan) {
          setPan('wheelL', toLeftPan);
          setPan('wheelR', toRightPan);
          updateQSPanSliderUI('wheelL', toLeftPan);
          updateQSPanSliderUI('wheelR', toRightPan);
        }
        updateLiveInfo();
        if (onComplete) onComplete();
      }
    }
    
    quickStartAnimationFrame = requestAnimationFrame(animate);
  }
  
  // Play a single step in the sequence
  function playQuickStartStep(preset, stepIndex) {
    const presetData = QUICK_START_PRESETS[preset];
    if (!presetData || !quickStartRunning || stepIndex >= presetData.sequence.length) {
      endQuickStart();
      return;
    }
    
    const sequence = presetData.sequence;
    const step = sequence[stepIndex];
    quickStartCurrentStep = stepIndex;
    
    // Calculate overall progress
    let elapsedDuration = 0;
    for (let i = 0; i < stepIndex; i++) {
      elapsedDuration += sequence[i].duration;
    }
    const overallProgress = elapsedDuration / quickStartTotalDuration;
    
    // Update overlay UI
    updateQuickStartOverlay(step.label, step.brainwave, stepIndex, sequence.length, overallProgress, elapsedDuration);
    
    // Get current frequencies
    const currentLeft = wheelL.getHz();
    const currentRight = wheelR.getHz();
    
    // Get current pan values (convert from -1..1 to -100..100)
    const currentLeftPan = Math.round(wheelLPan * 100);
    const currentRightPan = Math.round(wheelRPan * 100);
    
    // Check if step has pan values
    const hasPan = typeof step.leftPan === 'number' && typeof step.rightPan === 'number';
    
    // Animate to target frequencies (and optionally pan)
    animateQuickStartWheels(
      currentLeft, step.left,
      currentRight, step.right,
      step.duration,
      () => {
        // Update progress during the step
        const stepProgress = (elapsedDuration + step.duration) / quickStartTotalDuration;
        updateQuickStartOverlay(step.label, step.brainwave, stepIndex, sequence.length, stepProgress);
        updateButtonProgress(preset, stepProgress);
        
        // Move to next step
        quickStartStepTimeout = setTimeout(() => {
          playQuickStartStep(preset, stepIndex + 1);
        }, 500);
      },
      hasPan ? currentLeftPan : undefined,
      hasPan ? step.leftPan : undefined,
      hasPan ? currentRightPan : undefined,
      hasPan ? step.rightPan : undefined
    );
    
    // Update progress during animation
    const progressUpdateInterval = setInterval(() => {
      if (!quickStartRunning || quickStartCurrentStep !== stepIndex) {
        clearInterval(progressUpdateInterval);
        return;
      }
      
      const now = performance.now();
      const stepElapsed = now - (quickStartStartTime + elapsedDuration);
      const currentElapsed = elapsedDuration + Math.min(stepElapsed, step.duration);
      const currentProgress = currentElapsed / quickStartTotalDuration;
      
      updateButtonProgress(preset, currentProgress);
      
      // Update elapsed time and progress bar
      if (qsElapsed) qsElapsed.textContent = formatQSTime(currentElapsed);
      if (qsProgressFill) qsProgressFill.style.width = `${currentProgress * 100}%`;
    }, 100);
  }
  
  // Start a quick start preset
  function startQuickStart(preset) {
    if (quickStartRunning) {
      stopQuickStart();
    }
    
    const presetData = QUICK_START_PRESETS[preset];
    if (!presetData) return;
    
    // Stop any other running modes
    if (demoRunning && typeof stopDemo === 'function') {
      stopDemo();
    }
    if (programRunning) {
      stopProgram(true);
    }
    if (dynamicJourneyRunning) {
      stopDynamicJourney();
    }
    
    // For mystery mode, generate a fresh random sequence each time
    if (presetData.isRandom) {
      presetData.sequence = generateMysterySequence();
    }
    
    quickStartRunning = true;
    quickStartCurrentPreset = preset;
    quickStartCurrentStep = 0;
    quickStartStartTime = performance.now();
    quickStartTotalDuration = getSequenceDuration(presetData.sequence);
    
    // Update button state
    quickStartBtns.forEach(btn => {
      btn.classList.remove('is-playing');
      const progressBar = btn.querySelector('.qsb-progress');
      if (progressBar) progressBar.style.width = '0%';
    });
    
    const activeBtn = document.querySelector(`.quick-start-btn[data-preset="${preset}"]`);
    if (activeBtn) {
      activeBtn.classList.add('is-playing');
    }
    
    // Show status bar and set preset name
    if (quickStartDisplay) {
      quickStartDisplay.hidden = false;
    }
    if (qsCurrentName) {
      qsCurrentName.textContent = presetData.name;
    }
    if (qsTotal) {
      qsTotal.textContent = formatQSTime(quickStartTotalDuration);
    }
    if (qsProgressFill) {
      qsProgressFill.style.width = '0%';
    }
    
    // Create phase markers
    createQSPhaseMarkers(presetData.sequence, quickStartTotalDuration);
    
    // Ensure audio is playing with fade-in to prevent click
    ensureAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    // Use fade-in to prevent click sound
    startAudio(true);
    setTransportActive('play');
    
    // Start the sequence
    playQuickStartStep(preset, 0);
  }
  
  // Stop quick start
  function stopQuickStart() {
    if (!quickStartRunning) return;
    
    quickStartRunning = false;
    quickStartCurrentPreset = null;
    
    // Cancel animations and timeouts
    if (quickStartAnimationFrame) {
      cancelAnimationFrame(quickStartAnimationFrame);
      quickStartAnimationFrame = null;
    }
    if (quickStartStepTimeout) {
      clearTimeout(quickStartStepTimeout);
      quickStartStepTimeout = null;
    }
    
    // Update button states
    quickStartBtns.forEach(btn => {
      btn.classList.remove('is-playing');
      const progressBar = btn.querySelector('.qsb-progress');
      if (progressBar) progressBar.style.width = '0%';
    });
    
    // Hide status bar
    if (quickStartDisplay) {
      quickStartDisplay.hidden = true;
    }
    
    // Reset pan to defaults
    setPan('wheelL', -100);
    setPan('wheelR', 100);
    updateQSPanSliderUI('wheelL', -100);
    updateQSPanSliderUI('wheelR', 100);
    
    // Stop audio playback
    stopAudio();
    setTransportActive('stop');
  }
  
  // End quick start (completed naturally) - loops back to start for continuous experience
  function endQuickStart() {
    const wasPreset = quickStartCurrentPreset;
    
    if (!wasPreset || !quickStartRunning) {
      quickStartRunning = false;
      quickStartBtns.forEach(btn => btn.classList.remove('is-playing'));
      if (quickStartDisplay) quickStartDisplay.hidden = true;
      return;
    }
    
    // Show transition message before looping
    if (qsLabel) {
      qsLabel.textContent = "✨ Cycling...";
      if (qsBrainwave) qsBrainwave.textContent = "Continuous session";
    }
    
    // Reset progress and loop the sequence
    updateButtonProgress(wasPreset, 0);
    quickStartCurrentStep = 0;
    quickStartStartTime = performance.now();
    
    // Brief pause then restart
    quickStartStepTimeout = setTimeout(() => {
      if (quickStartRunning && quickStartCurrentPreset === wasPreset) {
        playQuickStartStep(wasPreset, 0);
      }
    }, 1500);
  }
  
  // Event listeners for quick start buttons
  quickStartBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      if (quickStartRunning && quickStartCurrentPreset === preset) {
        stopQuickStart();
      } else {
        startQuickStart(preset);
      }
    });
  });
  
  // Category filtering for Quick Start
  const qsCategories = document.getElementById('qsCategories');
  const qsCategoryPills = qsCategories ? qsCategories.querySelectorAll('.qs-category-pill') : [];
  
  function filterQuickStartByCategory(category) {
    // Update active pill
    qsCategoryPills.forEach(pill => {
      pill.classList.toggle('active', pill.dataset.category === category);
    });
    
    // Filter buttons with animation
    quickStartBtns.forEach(btn => {
      const categories = btn.dataset.categories ? btn.dataset.categories.split(',') : ['all'];
      const shouldShow = category === 'all' || categories.includes(category);
      
      if (shouldShow) {
        btn.classList.remove('qs-hidden');
        btn.classList.add('qs-visible');
        // Remove animation class after it completes
        setTimeout(() => btn.classList.remove('qs-visible'), 300);
      } else {
        btn.classList.add('qs-hidden');
        btn.classList.remove('qs-visible');
      }
    });
  }
  
  // Category pill click handlers
  qsCategoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterQuickStartByCategory(pill.dataset.category);
    });
  });
  
  // Stop button in status bar
  if (qsStopBtn) {
    qsStopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      stopQuickStart();
    });
  }
  
  // Stop quick start when transport controls are clicked
  const transportStop = document.getElementById('stop');
  const transportReset = document.getElementById('reset');
  
  if (transportStop) {
    transportStop.addEventListener('click', () => {
      if (quickStartRunning) {
        stopQuickStart();
      }
    });
  }
  
  if (transportReset) {
    transportReset.addEventListener('click', () => {
      if (quickStartRunning) {
        stopQuickStart();
      }
    });
  }
  
  // Stop quick start when user manually interacts with wheels
  function handleQuickStartWheelInteraction() {
    if (quickStartRunning) {
      stopQuickStart();
    }
  }
  
  // Expose stopQuickStart for cross-reference
  window.stopQuickStartFn = stopQuickStart;

  // ===== DEMO MODE =====
  // Choreographed showcase of Nestorium's capabilities
  
  const demoBtn = document.getElementById('demoBtn');
  const demoOverlay = document.getElementById('demoOverlay');
  const demoLabel = document.getElementById('demoLabel');
  const demoProgressDots = document.getElementById('demoProgressDots');
  
  // Demo sequence - a musical journey through harmonic intervals with spatial audio (~2 minutes)
  // Pan values: -100 = full left, 0 = center, 100 = full right
  const DEMO_SEQUENCE = [
    // Standard stereo separation
    { left: 256, right: 256, leftPan: -100, rightPan: 100, duration: 6000, label: "Unison (1:1)" },
    { left: 256, right: 384, leftPan: -100, rightPan: 100, duration: 7000, label: "Perfect Fifth (2:3)" },
    // Spatial crossover - swap channels
    { left: 288, right: 432, leftPan: 50, rightPan: -50, duration: 6000, label: "Spatial Crossover ✦" },
    { left: 320, right: 400, leftPan: -100, rightPan: 100, duration: 7000, label: "Major Third (4:5)" },
    // Center focus - both in middle
    { left: 256, right: 512, leftPan: -30, rightPan: 30, duration: 7500, label: "Center Focus ✦" },
    { left: 384, right: 512, leftPan: -100, rightPan: 100, duration: 6000, label: "Perfect Fourth (3:4)" },
    // Rotating sound field
    { left: 320, right: 384, leftPan: 100, rightPan: -100, duration: 7000, label: "Inverted Field ✦" },
    { left: 300, right: 500, leftPan: -100, rightPan: 100, duration: 7000, label: "Major Sixth (3:5)" },
    // Wide panorama sweep
    { left: 200, right: 600, leftPan: -100, rightPan: 100, duration: 4000, label: "Wide Sweep" },
    { left: 200, right: 600, leftPan: 100, rightPan: -100, duration: 4000, label: "Spatial Rotation ✦" },
    // Centered experience
    { left: 432, right: 432, leftPan: 0, rightPan: 0, duration: 7500, label: "Centered Unison ✦" },
    { left: 7.83, right: 7.83, leftPan: -50, rightPan: 50, duration: 7000, label: "Schumann Resonance" },
    { left: 432, right: 440, leftPan: -100, rightPan: 100, duration: 7000, label: "432 Hz vs 440 Hz" },
    { left: 256, right: 264, leftPan: -100, rightPan: 100, duration: 7000, label: "Alpha Binaural (8 Hz)" },
    // Return to defaults
    { left: 256, right: 256, leftPan: -100, rightPan: 100, duration: 5000, label: "Return to Unison" },
    // Fade out to silence (using very low freq to avoid oscillator issues)
    { left: 1, right: 1, leftPan: -100, rightPan: 100, duration: 4000, label: "Fading Out..." },
  ];
  
  // Default wheel values for reset
  const DEMO_DEFAULTS = {
    leftFreq: 256,
    rightFreq: 256,
    leftPan: -100,
    rightPan: 100
  };
  
  // Demo state
  let demoRunning = false;
  let demoCurrentStep = 0;
  let demoAnimationFrame = null;
  let demoStepTimeout = null;
  
  // Easing functions
  const demoEasing = {
    easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
    easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  };
  
  // Initialize progress dots
  function initDemoProgressDots() {
    if (!demoProgressDots) return;
    demoProgressDots.innerHTML = '';
    for (let i = 0; i < DEMO_SEQUENCE.length; i++) {
      const dot = document.createElement('span');
      dot.className = 'demo-progress-dot';
      dot.dataset.step = i;
      demoProgressDots.appendChild(dot);
    }
  }
  
  // Update progress dots
  function updateDemoProgressDots(currentStep) {
    if (!demoProgressDots) return;
    const dots = demoProgressDots.querySelectorAll('.demo-progress-dot');
    dots.forEach((dot, idx) => {
      dot.classList.remove('active', 'completed');
      if (idx < currentStep) {
        dot.classList.add('completed');
      } else if (idx === currentStep) {
        dot.classList.add('active');
      }
    });
  }
  
  // Update demo label with animation
  function updateDemoLabel(text) {
    if (!demoLabel) return;
    demoLabel.classList.add('transitioning');
    setTimeout(() => {
      demoLabel.textContent = text;
      demoLabel.classList.remove('transitioning');
    }, 200);
  }
  
  // Helper to update pan slider UI
  function updatePanSliderUI(wheelId, panValue) {
    const slider = document.querySelector(`.pan-slider[data-wheel="${wheelId}"]`);
    if (slider) {
      slider.value = panValue;
    }
  }
  
  // Animate both wheels simultaneously with smooth interpolation (including pan)
  function animateDemoWheels(fromLeft, toLeft, fromRight, toRight, fromLeftPan, toLeftPan, fromRightPan, toRightPan, duration, onComplete) {
    const startTime = performance.now();
    
    // iOS Safari fix: Don't use linearRampToValueAtTime directly on oscillators
    // as it conflicts with setTargetAtTime called by scheduleOscillatorSync.
    // Let the wheel setHz + scheduleOscillatorSync handle audio updates,
    // which is the same approach that works for binaural beat presets.
    
    function animate(currentTime) {
      if (!demoRunning) return;
      
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = demoEasing.easeInOutSine(progress);
      
      // Calculate current frequencies
      const leftFreq = fromLeft + (toLeft - fromLeft) * eased;
      const rightFreq = fromRight + (toRight - fromRight) * eased;
      
      // Calculate current pan values
      const leftPan = fromLeftPan + (toLeftPan - fromLeftPan) * eased;
      const rightPan = fromRightPan + (toRightPan - fromRightPan) * eased;
      
      // Update wheel visuals (setHz updates both visual position and display)
      wheelL.setHz(leftFreq);
      wheelR.setHz(rightFreq);
      
      // Update pan values and UI
      setPan('wheelL', Math.round(leftPan));
      setPan('wheelR', Math.round(rightPan));
      updatePanSliderUI('wheelL', Math.round(leftPan));
      updatePanSliderUI('wheelR', Math.round(rightPan));
      
      // Update live info display
      updateLiveInfo();
      
      if (progress < 1 && demoRunning) {
        demoAnimationFrame = requestAnimationFrame(animate);
      } else if (progress >= 1) {
        // Ensure we land exactly on target
        wheelL.setHz(toLeft);
        wheelR.setHz(toRight);
        setPan('wheelL', toLeftPan);
        setPan('wheelR', toRightPan);
        updatePanSliderUI('wheelL', toLeftPan);
        updatePanSliderUI('wheelR', toRightPan);
        updateLiveInfo();
        if (onComplete) onComplete();
      }
    }
    
    demoAnimationFrame = requestAnimationFrame(animate);
  }
  
  // Play a single demo step
  function playDemoStep(stepIndex) {
    if (!demoRunning || stepIndex >= DEMO_SEQUENCE.length) {
      endDemo();
      return;
    }
    
    const step = DEMO_SEQUENCE[stepIndex];
    demoCurrentStep = stepIndex;
    
    // Update UI
    updateDemoLabel(step.label);
    updateDemoProgressDots(stepIndex);
    
    // Get current frequencies
    const currentLeft = wheelL.getHz();
    const currentRight = wheelR.getHz();
    
    // Get current pan values (convert from -1..1 to -100..100)
    const currentLeftPan = Math.round(wheelLPan * 100);
    const currentRightPan = Math.round(wheelRPan * 100);
    
    // Animate to target frequencies and pan positions
    animateDemoWheels(
      currentLeft, step.left,
      currentRight, step.right,
      currentLeftPan, step.leftPan,
      currentRightPan, step.rightPan,
      step.duration,
      () => {
        // Brief pause at each step for the interval to be appreciated
        demoStepTimeout = setTimeout(() => {
          playDemoStep(stepIndex + 1);
        }, 500);
      }
    );
  }
  
  // Start demo
  function startDemo() {
    if (demoRunning) return;
    
    // Stop any running programs or journeys
    if (programRunning) {
      stopProgram(true);
    }
    if (dynamicJourneyRunning) {
      stopDynamicJourney();
    }
    if (quickStartRunning) {
      stopQuickStart();
    }
    
    demoRunning = true;
    demoCurrentStep = 0;
    
    // Update button state
    if (demoBtn) {
      demoBtn.classList.add('is-running');
      demoBtn.querySelector('.demo-btn-text').textContent = 'Stop';
    }
    
    // Show overlay
    if (demoOverlay) {
      demoOverlay.hidden = false;
    }
    
    // Initialize progress dots
    initDemoProgressDots();
    
    // Ensure audio is playing
    ensureAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    startAudio();
    setTransportActive('play');
    
    // Start the sequence
    playDemoStep(0);
  }
  
  // Stop demo
  function stopDemo() {
    if (!demoRunning) return;
    
    demoRunning = false;
    
    // Cancel any pending animations or timeouts
    if (demoAnimationFrame) {
      cancelAnimationFrame(demoAnimationFrame);
      demoAnimationFrame = null;
    }
    if (demoStepTimeout) {
      clearTimeout(demoStepTimeout);
      demoStepTimeout = null;
    }
    
    // Update button state
    if (demoBtn) {
      demoBtn.classList.remove('is-running');
      demoBtn.querySelector('.demo-btn-text').textContent = 'Demo';
    }
    
    // Hide overlay
    if (demoOverlay) {
      demoOverlay.hidden = true;
    }
    
    // Audio continues playing at last frequency
  }
  
  // End demo (completed naturally)
  function endDemo() {
    demoRunning = false;
    
    // Update button state
    if (demoBtn) {
      demoBtn.classList.remove('is-running');
      demoBtn.querySelector('.demo-btn-text').textContent = 'Demo';
    }
    
    // Show completion briefly
    if (demoLabel) {
      updateDemoLabel('✨ Demo Complete');
    }
    
    // Update all dots to completed
    if (demoProgressDots) {
      const dots = demoProgressDots.querySelectorAll('.demo-progress-dot');
      dots.forEach(dot => {
        dot.classList.remove('active');
        dot.classList.add('completed');
      });
    }
    
    // Stop audio playback
    stopAudio();
    setTransportActive('stop');
    
    // Reset pan controls to defaults (doesn't trigger audio)
    setPan('wheelL', DEMO_DEFAULTS.leftPan);
    setPan('wheelR', DEMO_DEFAULTS.rightPan);
    updatePanSliderUI('wheelL', DEMO_DEFAULTS.leftPan);
    updatePanSliderUI('wheelR', DEMO_DEFAULTS.rightPan);
    
    // Hide overlay after a moment
    setTimeout(() => {
      if (demoOverlay) {
        demoOverlay.hidden = true;
      }
    }, 2000);
  }
  
  // Toggle demo on button click
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      if (demoRunning) {
        stopDemo();
      } else {
        startDemo();
      }
    });
  }
  
  // Stop demo when other transport controls are clicked
  const stopBtn = document.getElementById('stop');
  const resetBtn = document.getElementById('reset');
  
  if (stopBtn) {
    const originalStopHandler = stopBtn.onclick;
    stopBtn.addEventListener('click', () => {
      if (demoRunning) {
        stopDemo();
      }
    });
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (demoRunning) {
        stopDemo();
      }
    });
  }
  
  // Stop demo if user manually drags wheels
  const wheelLElement = document.getElementById('wheelL');
  const wheelRElement = document.getElementById('wheelR');
  
  function handleManualWheelInteraction() {
    if (demoRunning) {
      stopDemo();
    }
    if (quickStartRunning) {
      stopQuickStart();
    }
  }
  
  if (wheelLElement) {
    wheelLElement.addEventListener('pointerdown', (e) => {
      // Only stop if user is dragging the pointer
      if (e.target.closest('.pointer') || e.target.closest('.inner-pointer') || e.target.closest('.inner-circle')) {
        handleManualWheelInteraction();
      }
    });
  }
  
  if (wheelRElement) {
    wheelRElement.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.pointer') || e.target.closest('.inner-pointer') || e.target.closest('.inner-circle')) {
        handleManualWheelInteraction();
      }
    });
  }
  
  // Expose stopDemo for cross-reference
  window.stopDemoFn = stopDemo;

  // ===== EXPERIENCES SECTION TABS =====
  // Tab switching for Quick Start / Guided Journeys / Dynamic Journeys
  
  const experiencesTabs = document.querySelectorAll('.experience-tab');
  const experiencesPanels = document.querySelectorAll('.experience-panel');
  
  function switchExperienceTab(tabId) {
    // Update tab buttons
    experiencesTabs.forEach(tab => {
      const isActive = tab.dataset.tab === tabId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });
    
    // Update panels
    experiencesPanels.forEach(panel => {
      const isActive = panel.dataset.panel === tabId;
      panel.classList.toggle('active', isActive);
    });
  }
  
  // Add click handlers to tabs
  experiencesTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      switchExperienceTab(tabId);
    });
  });
  
  // Auto-switch to relevant tab when a journey/experience is running
  // This ensures user sees the active content
  function autoSwitchToActiveTab() {
    if (quickStartRunning) {
      switchExperienceTab('quickstart');
    } else if (programRunning) {
      switchExperienceTab('guided');
    } else if (dynamicJourneyRunning) {
      switchExperienceTab('dynamic');
    }
  }
  
  // PWA: register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(()=>{});
    });
  }

})();
