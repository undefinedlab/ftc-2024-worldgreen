import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { GLOBE_RADIUS, POINT_SIZE, AUTO_ROTATE_SPEED, FRUSTUM_SIZE, getCategoryColor } from './utils';
import { createGlobeMaterial } from './shaders/globeMaterial';
import { createPopupAnimations } from './popupAnimations';
import { createEventHandlers } from './eventHandlers';
import { StretchShader } from './shaders/stretchShader';
import { createEventPoints, updatePointVisibility, selectEvent, hoverEvent } from './events';

export const createSceneManager = (containerRef, canvas3DRef, canvas2DRef, popupRef, setIsInitialized, setPopupContent) => {
  let renderer, scene, camera, raycaster, controls;
  let globe, globeMesh;
  let earthTexture, mapMaterial;
  let eventMeshes = [];
  let eventHandlers;
  let clock;
  let composer, stretchPass;
  let isSceneReady = false; 
  let selectedEvent = null;
  let hoveredEvent = null;
  let labelRenderer;

  const { showPopupAnimation, hidePopupAnimation } = createPopupAnimations();

  const handleGlobalClick = (event) => {
    const popupElement = popupRef.current?.querySelector('.project-popup');
    const isClickInsidePopup = popupElement?.contains(event.target);
    
    if (!isClickInsidePopup && eventHandlers) {
      const intersects = eventHandlers.checkIntersects(event);
      if (!intersects) {
        handleEventSelection(null);
      }
    }
  };

  const initEventHandlers = () => {
    eventHandlers = createEventHandlers(
      containerRef,
      canvas3DRef,
      raycaster,
      camera,
      globe,
      eventMeshes,
      mapMaterial,
      popupRef,
      clock,
      showPopupAnimation,
      handleEventSelection,
      handleEventHover
    );
    eventHandlers.addCanvasEvents();
    window.addEventListener('click', handleGlobalClick);
  };

  const cleanup = () => {
    if (scene) {
      // Remove globe
      if (globe) {
        scene.remove(globe);
        globe = null;
      }

      // Remove globe mesh
      if (globeMesh) {
        scene.remove(globeMesh);
        globeMesh = null;
      }

      // Safely remove event meshes
      if (Array.isArray(eventMeshes)) {
        eventMeshes.forEach(mesh => {
          if (mesh && mesh.userData && mesh.userData.label) {
            scene.remove(mesh.userData.label);
          }
          scene.remove(mesh);
        });
        eventMeshes = [];
      }
    }

    // Clean up label renderer
    if (labelRenderer) {
      if (labelRenderer.domElement && labelRenderer.domElement.parentNode) {
        labelRenderer.domElement.parentNode.removeChild(labelRenderer.domElement);
      }
      labelRenderer = null;
    }

    // Clean up renderer
    if (renderer) {
      renderer.dispose();
      renderer = null;
    }

    // Clean up controls
    if (controls) {
      controls.dispose();
      controls = null;
    }

    // Clean up composer
    if (composer) {
      composer.dispose();
      composer = null;
    }

    // Remove event listeners
    window.removeEventListener('click', handleGlobalClick);
    document.removeEventListener('click', handleCloseButtonClick);

    // Reset all other references
    camera = null;
    raycaster = null;
    earthTexture = null;
    mapMaterial = null;
    eventHandlers = null;
    clock = null;
    stretchPass = null;
    isSceneReady = false;
    selectedEvent = null;
    hoveredEvent = null;
  };

  const handleEventSelection = (eventMesh) => {
    if (selectedEvent) {
      resetEventAppearance(selectedEvent);
    }

    if (eventMesh === selectedEvent) {
      selectedEvent = null;
      setPopupContent('');
      hidePopupAnimation(clock, canvas2DRef, popupRef);
      return;
    }

    if (eventMesh) {
      selectedEvent = eventMesh;
      selectEvent(selectedEvent, setPopupContent, showPopupAnimation, clock, canvas2DRef, popupRef);
    } else {
      selectedEvent = null;
      setPopupContent('');
      hidePopupAnimation(clock, canvas2DRef, popupRef);
    }
  };

  const resetEventAppearance = (eventMesh) => {
    if (eventMesh) {
      eventMesh.material.color.setHex(getCategoryColor(eventMesh.userData.category));
      eventMesh.scale.set(1, 1, 1);
      if (eventMesh.userData.label) {
        eventMesh.userData.label.element.style.display = 'none';
      }
    }
  };

  
  const initScene = (initialEvents) => {
    if (!containerRef.current || !canvas3DRef.current || !canvas2DRef.current || !popupRef.current) {
      return;
    }

    initRenderers();
    initCamera();
    initComposer();
    initRaycaster();
    initClock();
    createOrbitControls();

    new THREE.TextureLoader().load(
      "./images/earth-map-colored.png",
      (mapTex) => {
        earthTexture = mapTex;
        earthTexture.repeat.set(1, 1);
      

        createGlobe();
        eventMeshes = createEventPoints(scene, initialEvents);
        initEventHandlers();
        updateSize();
        isSceneReady = true;
        setIsInitialized(true);
      }
    );

    document.addEventListener('click', handleCloseButtonClick);
  };

  const initRenderers = () => {
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    containerRef.current.appendChild(labelRenderer.domElement);

    renderer = new THREE.WebGLRenderer({ canvas: canvas3DRef.current, alpha: true });
    renderer.setPixelRatio(2);

    scene = new THREE.Scene();
  };

  const initCamera = () => {
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const frustumSize = 2.2;
    camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2, 
      frustumSize * aspect / 2, 
      frustumSize / 2, 
      frustumSize / -2, 
      0.1, 
      1000
    );
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
  };

  const initComposer = () => {
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    stretchPass = new ShaderPass(StretchShader);
    composer.addPass(stretchPass);
  };

  const initRaycaster = () => {
    raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.1; 
    raycaster.far = 5.15;
  };

  const initClock = () => {
    clock = new THREE.Clock();
  };

  const createOrbitControls = () => {
    controls = new OrbitControls(camera, canvas3DRef.current);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI * 3 / 4;
    controls.autoRotate = true;
    controls.enableRotate = true;
    controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
    controls.domElement = canvas3DRef.current;
  };

  const createGlobe = () => {
    const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 124, 124);
    globeGeometry.scale(1.3, 1, 1.3);
    
    mapMaterial = createGlobeMaterial(earthTexture);
  
    globe = new THREE.Points(globeGeometry, mapMaterial);
    scene.add(globe);
  
    globeMesh = new THREE.Mesh(globeGeometry, new THREE.MeshBasicMaterial({
      color: 0xDADADA,
      transparent: true,
      opacity: 0.1
    }));
    scene.add(globeMesh);
  };



  const handleCloseButtonClick = (event) => {
    if (event.target.classList.contains('close-button')) {
      const meshUuid = event.target.getAttribute('data-mesh-uuid');
      closeEventMessage(meshUuid, eventMeshes, handleEventSelection);
    }
  };



  const handleEventHover = (eventMesh) => {
    hoveredEvent = hoverEvent(eventMesh);
  };


  const updateEvents = (filteredEvents) => {
    eventMeshes.forEach(mesh => {
      const isVisible = filteredEvents.some(event => event.id === mesh.userData.id);
      mesh.visible = isVisible;
      if (mesh.userData.label) {
        mesh.userData.label.visible = isVisible;
      }
    });
  
    if (eventHandlers) {
      eventHandlers.updateEventMeshes(eventMeshes.filter(mesh => mesh.visible));
    }
  };


  const render = () => {
    if (!isSceneReady) return;
    
    mapMaterial.uniforms.u_time_since_click.value = clock.getElapsedTime();
    const hoveredEventMesh = eventHandlers.checkIntersects();
    handleEventHover(hoveredEventMesh);
    
    if (controls) {
      controls.update();
    }
    
    updatePointVisibility(eventMeshes.filter(mesh => mesh.visible), camera, selectedEvent, hoveredEvent, popupRef);
    
    if (selectedEvent) {
      const { updatePopupVisibility } = createPopupAnimations();
      updatePopupVisibility(selectedEvent, camera, popupRef);
    }

    updatePopupPosition();
    composer.render();
    if (labelRenderer) {
      labelRenderer.render(scene, camera);
    }
  };


  const updatePopupPosition = () => {
    if (selectedEvent && popupRef.current) {
      const vector = selectedEvent.position.clone();
      vector.project(camera);
      
      const x = (vector.x * 0.5 + 0.5) * canvas3DRef.current.clientWidth;
      const y = (-vector.y * 0.5 + 0.5) * canvas3DRef.current.clientHeight;
      
      if (vector.z > 1) {
        popupRef.current.style.display = 'none';
      } else {
        popupRef.current.style.display = 'block';
        popupRef.current.style.transform = `translate(-50%, -100%) translate(${x}px,${y}px)`;
      }
    }
  };

  const deselectCurrentEvent = () => {
    if (selectedEvent) {
      resetEventAppearance(selectedEvent);
      selectedEvent = null;
      const { hidePopupAnimation } = createPopupAnimations();
      hidePopupAnimation(clock, canvas2DRef, popupRef);
    }
  };



  const updateSize = () => {
    if (!containerRef.current || !renderer || !canvas2DRef.current || !mapMaterial) return;
  
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    renderer.setSize(width, height);
    composer.setSize(width, height);
    canvas2DRef.current.width = width;
    canvas2DRef.current.height = height;
    
    const aspect = width / height;
    camera.left = FRUSTUM_SIZE * aspect / -1.3;
    camera.right = FRUSTUM_SIZE * aspect / 1.3;
    camera.top = FRUSTUM_SIZE / 2;
    camera.bottom = FRUSTUM_SIZE / -2;
    camera.updateProjectionMatrix();
    
    mapMaterial.uniforms.u_dot_size.value = POINT_SIZE * Math.min(width, height);
    
    if (labelRenderer) {
      labelRenderer.setSize(width, height);
    }
  };



  return {
    initScene,
    updateSize,
    render,
    cleanup,
    deselectCurrentEvent ,
    updateEvents,
  };
};