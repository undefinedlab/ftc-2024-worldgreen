import { gsap } from 'gsap';

export const createPopupAnimations = () => {
  let popupOpenTl, popupCloseTl, popupFadeTl;
  let isAnimating = false;

  const initAnimations = (canvas2DRef, popupRef) => {
    if (!canvas2DRef?.current || !popupRef?.current) return;

    // Initial popup opening animation
    popupOpenTl = gsap.timeline({ 
      paused: true,
      onComplete: () => { isAnimating = false; }
    })
      .fromTo(canvas2DRef.current, 
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      )
      .fromTo(popupRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
        "<"
      );

    // Closing animation
    popupCloseTl = gsap.timeline({ 
      paused: true,
      onComplete: () => { isAnimating = false; }
    })
      .to(popupRef.current,
        { opacity: 0, y: -20, duration: 0.3, ease: "power2.in" }
      )
      .to(canvas2DRef.current,
        { opacity: 0, duration: 0.3, ease: "power2.in" },
        "<"
      );

    // Visibility-based fade animation
    popupFadeTl = gsap.timeline({ paused: true })
      .to(popupRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut"
      });
  };

  const showPopupAnimation = (eventMesh, isOpening, canvas2DRef, popupRef) => {
    if (isAnimating) return;
    isAnimating = true;

    if (!popupOpenTl) {
      initAnimations(canvas2DRef, popupRef);
    }

    if (popupOpenTl && isOpening) {
      popupOpenTl.restart();
    }
  };

  const hidePopupAnimation = (canvas2DRef, popupRef) => {
    if (isAnimating) return;
    isAnimating = true;

    if (!popupCloseTl) {
      initAnimations(canvas2DRef, popupRef);
    }

    if (popupCloseTl) {
      popupCloseTl.restart();
    }
  };

  const updatePopupVisibility = (selectedEvent, camera, popupRef) => {
    if (!selectedEvent || !popupRef?.current || !popupFadeTl) return;

    // Get the dot's position in world space
    const dotPosition = selectedEvent.position.clone();
    
    // Calculate dot's angle relative to camera
    const cameraPosition = camera.position.clone();
    const dotToCameraVector = cameraPosition.sub(dotPosition);
    const angle = dotPosition.angleTo(dotToCameraVector);

    // Determine visibility threshold (adjust these values to fine-tune the fade)
    const FADE_START = Math.PI * 0.35; // Start fading at ~63 degrees
    const FADE_END = Math.PI * 0.45;   // Complete fade at ~81 degrees

    if (angle > FADE_END) {
      // Dot is on the far side - ensure popup is hidden
      gsap.set(popupRef.current, { opacity: 0 });
    } else if (angle > FADE_START) {
      // Dot is in the fade zone - interpolate opacity
      const fadeProgress = (angle - FADE_START) / (FADE_END - FADE_START);
      gsap.to(popupRef.current, {
        opacity: 1 - fadeProgress,
        duration: 0.2,
        ease: "power1.inOut"
      });
    } else {
      // Dot is fully visible - ensure popup is shown
      gsap.to(popupRef.current, {
        opacity: 1,
        duration: 0.2,
        ease: "power1.inOut"
      });
    }
  };

  return { 
    showPopupAnimation, 
    hidePopupAnimation, 
    updatePopupVisibility 
  };
};