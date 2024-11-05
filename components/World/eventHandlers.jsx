import * as THREE from 'three';
import { formatCoordinates } from './utils';

export const createEventHandlers = (
  containerRef,
  canvas3DRef,
  rayCaster,
  camera,
  globe, // This might be undefined
  eventMeshes,
  mapMaterial,
  popupRef,
  clock,
  showPopupAnimation,
  selectEvent,
  hoverEvent
) => {
  let mouse = new THREE.Vector2(-1, -1);
  let dragged = false;
  const MAX_HOVER_DISTANCE = 0.1; 

  const updateMousePosition = (eX, eY) => {
    mouse.x = (eX - containerRef.current.offsetLeft) / containerRef.current.offsetWidth * 2 - 1;
    mouse.y = -((eY - containerRef.current.offsetTop) / containerRef.current.offsetHeight) * 2 + 1;
  };

  const checkIntersects = () => {
    rayCaster.setFromCamera(mouse, camera);
    const intersects = rayCaster.intersectObjects(eventMeshes);

    if (intersects.length > 0) {
      if (intersects[0].distance <= MAX_HOVER_DISTANCE) {
        return intersects[0].object;
      }
    }

    if (globe && globe.type === "Points") {
      const globeIntersects = rayCaster.intersectObject(globe);
      if (globeIntersects.length > 0) {
        const intersectionPoint = globeIntersects[0].point;
        let closestEvent = null;
        let minDistance = Infinity;

        eventMeshes.forEach(eventMesh => {
          const distance = intersectionPoint.distanceTo(eventMesh.position);
          if (distance < minDistance && distance <= MAX_HOVER_DISTANCE) {
            minDistance = distance;
            closestEvent = eventMesh;
          }
        });

        return closestEvent;
      }
    }

    return null;
  };
  const handleClick = (e) => {
    updateMousePosition(
      e.targetTouches ? e.targetTouches[0].pageX : e.clientX,
      e.targetTouches ? e.targetTouches[0].pageY : e.clientY,
    );
  
    const intersectedEvent = checkIntersects();
    selectEvent(intersectedEvent);  // This will be null if clicking empty space
  };

  
  const handleMouseMove = (e) => {
    updateMousePosition(e.clientX, e.clientY);
    const intersectedEvent = checkIntersects();
    hoverEvent(intersectedEvent);
  };

  const addCanvasEvents = () => {
    if (!containerRef.current) return;

    containerRef.current.addEventListener("mousemove", handleMouseMove);
    containerRef.current.addEventListener("click", handleClick);

    let timestamp;
    canvas3DRef.current.addEventListener("mousedown", () => {
      timestamp = Date.now();
    });
    canvas3DRef.current.addEventListener("mouseup", () => {
      dragged = (Date.now() - timestamp) > 200;
    });
  };

  const updateEventMeshes = (newEventMeshes) => {
    eventMeshes = newEventMeshes;
  };

  return {
    handleMouseMove,
    checkIntersects,
    addCanvasEvents,
    updateEventMeshes
  };
};