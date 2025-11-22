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
  function startAudio(){
    ensureAudio();
    const t = audioCtx.currentTime + 0.01;
    if (!wheel1.started){ wheel1.osc.start(t); wheel1.started=true; }
    if (!wheel2.started){ wheel2.osc.start(t); wheel2.started=true; }
    if (!monoOsc1.started){ monoOsc1.start(t); monoOsc1.started=true; }
    if (!monoOsc2.started){ monoOsc2.start(t); monoOsc2.started=true; }
    updateOscillators();
    updateMonoOscillators();
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
    setTransportActive('stop');
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
  const PRESETS = [
    { name: 'OM Low', left: 68.05, right: 68.05 },
    { name: 'OM', left: 136.10, right: 136.10 },
    { name: 'OM Third', left: 136.10, right: 170.025 },
    { name: 'OM Fifth', left: 136.10, right: 204.15 }
  ];

  const KEYBOARD_NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const KEYBOARD_KEY_COUNT = 88;
  const KEYBOARD_START_MIDI = 21; // A0
  const KEYBOARD_WHITE_TOTAL = 52;
  const BLACK_KEY_POSITION_OFFSET = 0.62;
  const pianoKeyboardEl = document.getElementById('pianoKeyboard');
  const keyboardTargetButtons = document.querySelectorAll('.keyboard-target-btn');
  const keyboardTargetsState = { left: true, right: true };
  let pianoKeys = [];
  const pianoHighlightState = { left: null, right: null };

  function buildPianoKeyboard() {
    if (!pianoKeyboardEl) return;
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
    pianoKeyboardEl.appendChild(inner);
    pianoKeys = keys.map((key, idx) => ({
      ...key,
      nextFrequency: keys[idx + 1]?.frequency ?? key.frequency
    }));
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
  
  // Convert frequency to piano note name with cents deviation
  function frequencyToNote(frequency) {
    if (!Number.isFinite(frequency) || frequency <= 0) return { note: '—', cents: 0 };
    
    // Check if frequency is below human hearing range (15 Hz)
    if (frequency < 15) return { note: 'BELOW_HEARING', cents: 0 };
    
    // A4 = 440 Hz, MIDI note 69
    const A4 = 440;
    const A4_MIDI = 69;
    
    // Calculate the MIDI note number (can be fractional)
    const noteNumber = 12 * Math.log2(frequency / A4) + A4_MIDI;
    
    // Round to nearest MIDI note
    const nearestMidi = Math.round(noteNumber);
    
    // Calculate cents deviation from the nearest note (-50 to +50 cents)
    const cents = Math.round((noteNumber - nearestMidi) * 100);
    
    // Get note name based on current system
    const noteNames = NOTE_NAMES[noteSystem];
    const noteIndex = nearestMidi % 12;
    const octave = Math.floor(nearestMidi / 12) - 1;
    const noteName = noteNames[noteIndex] + octave;
    
    return { note: noteName, cents };
  }

  // Update live information display
  function updateLiveInfo() {
    const leftWheelNoteEl = document.getElementById('leftWheelNote');
    const rightWheelNoteEl = document.getElementById('rightWheelNote');
    const leftWheelFreqEl = document.getElementById('leftWheelFreq');
    const rightWheelFreqEl = document.getElementById('rightWheelFreq');
    const frequencyDiffEl = document.getElementById('frequencyDiff');
    
    if (!leftWheelNoteEl || !rightWheelNoteEl || !leftWheelFreqEl || !rightWheelFreqEl || !frequencyDiffEl) return;
    if (!wheelL || !wheelR) return;
    
    const leftFreq = wheelL.getHz();
    const rightFreq = wheelR.getHz();
    
    // Get note names with cents
    const leftNote = frequencyToNote(leftFreq);
    const rightNote = frequencyToNote(rightFreq);
    
    // Format note display with cents
    const formatNoteDisplay = (noteData) => {
      if (noteData.note === '—') return '—';
      if (noteData.note === 'BELOW_HEARING') return '🔇';
      const centsStr = noteData.cents === 0 ? '' : 
        (noteData.cents > 0 ? ` +${noteData.cents}¢` : ` ${noteData.cents}¢`);
      return `${noteData.note}${centsStr}`;
    };
    
    // Update note names and styling
    leftWheelNoteEl.textContent = formatNoteDisplay(leftNote);
    rightWheelNoteEl.textContent = formatNoteDisplay(rightNote);
    
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
  }

  function updateWheelTargetIndicators() {
    // Update visual indicators on wheels based on keyboard target state
    const wheelLEl = document.getElementById('wheelL');
    const wheelREl = document.getElementById('wheelR');
    
    if (wheelLEl) {
      wheelLEl.classList.toggle('piano-target-active', keyboardTargetsState.left);
    }
    if (wheelREl) {
      wheelREl.classList.toggle('piano-target-active', keyboardTargetsState.right);
    }
  }

  function initKeyboardTargets() {
    keyboardTargetButtons.forEach(btn => {
      const target = btn.dataset.target;
      if (!target) return;
      const active = btn.classList.contains('is-active');
      keyboardTargetsState[target] = active;
      btn.setAttribute('aria-pressed', String(active));
      btn.addEventListener('click', () => {
        const next = !btn.classList.contains('is-active');
        keyboardTargetsState[target] = next;
        btn.classList.toggle('is-active', next);
        btn.setAttribute('aria-pressed', String(next));
        updateWheelTargetIndicators();
      });
    });
    // Initialize wheel indicators
    updateWheelTargetIndicators();
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
      ensurePlaying();
      scheduleOscillatorSync();
      keyEl.classList.add('is-triggered');
      setTimeout(() => keyEl.classList.remove('is-triggered'), 160);
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

  wheelL.setOnChange(() => { 
    if (!isApplyingPreset && presetSelect) {
      presetSelect.value = '';
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
    if (!isApplyingPreset && presetSelect) {
      presetSelect.value = '';
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
  initKeyboardTargets();
  
  // Initialize live info display
  updateLiveInfo();
  
  // Note system toggle button
  const noteSystemToggle = document.getElementById('noteSystemToggle');
  noteSystemToggle?.addEventListener('click', () => {
    // Toggle between systems
    noteSystem = noteSystem === 'alphabetical' ? 'solfege' : 'alphabetical';
    
    // Update button label
    const toggleLabel = noteSystemToggle.querySelector('.toggle-label');
    if (toggleLabel) {
      toggleLabel.textContent = noteSystem === 'alphabetical' ? 'Musical Note' : 'Solfeggio';
    }
    
    // Update live info display with new note system
    updateLiveInfo();
    
    // Update piano keyboard labels
    updatePianoKeyLabels();
  });
  
  pianoKeyboardEl?.addEventListener('pointerdown', handlePianoPointerDown);
  pianoKeyboardEl?.addEventListener('keydown', handlePianoKeydown);
  pianoKeyboardEl?.addEventListener('wheel', (e) => {
    if (!keyboardTargetsState.left && !keyboardTargetsState.right) return;
    e.preventDefault();
    const direction = e.deltaY < 0 ? 1 : -1;
    const magnitude = Math.min(3, Math.abs(e.deltaY) * SCROLL_SCALE);
    nudgeSelectedWheels(direction * (SCROLL_BASE_STEP + magnitude));
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
      
      // Set the new frequencies
      wheelL.setHz(newL);
      wheelR.setHz(newR);
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
    
    wheelL.reset();
    wheelR.reset();
    if (presetSelect) presetSelect.value = '';
    // Reset mono volume to 0%
    updateMonoVolume(0);
    // Reset fine-tune offset and rotation
    fineTuneOffset = 0;
    fineTuneRotation = 0;
    updateFineTuneDisplay();
    
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
  });

  // PWA: register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(()=>{});
    });
  }

})();
