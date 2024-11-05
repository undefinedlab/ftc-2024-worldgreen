import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { POINT_SIZE, latLongToVector3 } from './utils';
import { gsap } from 'gsap';

const FADE_START = -0.1; 
const FADE_END = 0.2;    
const VISIBILITY_THRESHOLD = 0.1;

export const createEventPoints = (scene, events) => {
  if (!Array.isArray(events)) {
    console.warn('Events must be an array');
    return [];
  }

  console.log('Creating points for events:', events);
  const eventGeometry = new THREE.SphereGeometry(POINT_SIZE, 32, 32);
  const eventPoints = new THREE.Group();
  const eventMeshes = [];

  events.forEach(event => {
    if (!event.coordinates || typeof event.coordinates.lat !== 'number' || typeof event.coordinates.lng !== 'number') {
      console.warn('Invalid coordinates for event:', event);
      return;
    }

    // Create position for the point
    const position = latLongToVector3(event.coordinates.lat, event.coordinates.lng, 1.015);
    position.x *= 1.3;
    position.z *= 1.3;
    
    // Create the point material
    const eventMaterial = new THREE.MeshBasicMaterial({
      color: getProjectTypeColor(event.type),
      transparent: true,
      opacity: 1
    });
    
    // Create the point mesh
    const eventMesh = new THREE.Mesh(eventGeometry, eventMaterial);
    eventMesh.position.copy(position);
    eventMesh.userData = event;
    eventMesh.scale.set(1, 1, 1);
    eventPoints.add(eventMesh);

    // Create label
    const labelDiv = document.createElement('div');
    labelDiv.className = 'event-label';
    labelDiv.style.display = 'none';
    labelDiv.style.opacity = '0';
    labelDiv.innerHTML = `
      <div class="comment-item">
        <span class="project-type">${event.category}</span>
      </div>
    `;
    
    const label = new CSS2DObject(labelDiv);
    label.position.copy(position);
    scene.add(label);
    eventMesh.userData.label = label;

    // Create popup container
    const popupDiv = document.createElement('div');
    popupDiv.className = 'project-popup-container';
    popupDiv.style.opacity = '0';
    popupDiv.style.display = 'none';
    popupDiv.style.pointerEvents = 'none';
    
    const popup = new CSS2DObject(popupDiv);
    popup.position.copy(position);
    scene.add(popup);
    eventMesh.userData.popup = popup;

    eventMeshes.push(eventMesh);
  });

  scene.add(eventPoints);
  return eventMeshes;
};

export const updatePointVisibility = (eventMeshes, camera, selectedEvent, hoveredEvent) => {
  const cameraPosition = new THREE.Vector3();
  camera.getWorldPosition(cameraPosition);

  eventMeshes.forEach(mesh => {
    const dotProduct = mesh.position.clone().normalize().dot(cameraPosition.normalize());
    const visibility = smoothstep(FADE_START, FADE_END, dotProduct);
    const isVisible = visibility > VISIBILITY_THRESHOLD;
    
    // Update mesh visibility
    mesh.material.opacity = visibility;
    
    // Handle all attached content visibility
    if (mesh.userData.label) {
      mesh.userData.label.element.style.opacity = visibility;
      mesh.userData.label.element.style.display = isVisible ? 'block' : 'none';
    }

    if (mesh.userData.popup) {
      const popupElement = mesh.userData.popup.element;
      popupElement.style.opacity = visibility;
      popupElement.style.display = isVisible ? 'block' : 'none';
      popupElement.style.pointerEvents = isVisible ? 'auto' : 'none';
    }

    if (mesh === selectedEvent) {
      if (isVisible) {
        mesh.material.color.setHex(0xffff00);
        mesh.scale.set(2, 2, 2);
        if (mesh.userData.label) {
          updateLabelContent(mesh);
        }
        if (mesh.userData.popup) {
          updatePopupContent(mesh);
        }
      } else {
        if (mesh.userData.label) {
          mesh.userData.label.element.style.display = 'none';
        }
        if (mesh.userData.popup) {
          mesh.userData.popup.element.style.display = 'none';
        }
      }
    } else if (mesh === hoveredEvent) {
      if (isVisible) {
        mesh.material.color.setHex(0xFFFFFF);
        mesh.scale.set(1.5, 1.5, 1.5);
      } else {
        mesh.material.color.setHex(getProjectTypeColor(mesh.userData.type));
        mesh.scale.set(1, 1, 1);
      }
    } else {
      mesh.material.color.setHex(getProjectTypeColor(mesh.userData.type));
      mesh.scale.set(1, 1, 1);
      if (mesh.userData.label) {
        mesh.userData.label.element.style.display = 'none';
      }
      if (mesh.userData.popup) {
        mesh.userData.popup.element.style.display = 'none';
      }
    }
  });
};

export const selectEvent = (eventMesh, setPopupContent, animationFunction, clock) => {
  if (!eventMesh) return;

  const eventData = eventMesh.userData;
  
  if (eventMesh.userData.popup) {
    updatePopupContent(eventMesh);
    const popup = eventMesh.userData.popup;
    
    gsap.fromTo(popup.element, 
      { opacity: 0, scale: 0.8 },
      { 
        opacity: 1, 
        scale: 1, 
        duration: 0.3, 
        ease: "power2.out",
        pointerEvents: 'auto'
      }
    );
  }

  eventMesh.material.color.setHex(0xffff00);
  eventMesh.scale.set(2, 2, 2);

  if (eventMesh.userData.label) {
    eventMesh.userData.label.element.style.display = 'block';
    updateLabelContent(eventMesh);
  }

  clock.start();
};

export const hoverEvent = (eventMesh) => {
  if (eventMesh) {
    eventMesh.material.color.setHex(0xFFFFFF);
    eventMesh.scale.set(1.5, 1.5, 1.5);
    if (eventMesh.userData.label) {
      eventMesh.userData.label.element.style.display = 'none';
    }
    return eventMesh;
  }
  return null;
};

export const closeEventMessage = (meshUuid, eventMeshes, onSelectEvent) => {
  const mesh = eventMeshes.find(m => m.uuid === meshUuid);
  if (mesh) {
    onSelectEvent(null);
  }
};

const updatePopupContent = (mesh) => {
  if (!mesh.userData.popup) return;
  
  const eventData = mesh.userData;
  const formattedDate = new Date(eventData.properties.startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  mesh.userData.popup.element.innerHTML = `
    <div class="project-popup-overlay">
      <div class="project-popup">
        <div class="popup-header">
          <h3>${eventData.category}</h3>
          <span class="close-button" data-mesh-uuid="${eventData.id}">×</span>
        </div>
        
        <img src="${eventData.properties.thumbnailUri}" 
             alt="${eventData.category}" 
             class="project-thumbnail"
             onerror="this.src='/placeholder-image.jpg'"/>
        
        <div class="project-details">
          <div class="project-bio">
            ${eventData.properties.bio}
          </div>
          
          <div class="project-stats">
            <div class="stat">
              <span class="stat-label">Size</span>
              <span class="stat-value">${eventData.properties.size}</span>
            </div>
            <div class="stat">
              <span class="stat-label">CO₂ Extracted</span>
              <span class="stat-value">${eventData.properties.co2Extracted} tonnes</span>
            </div>
            <div class="stat">
              <span class="stat-label">Upvotes</span>
              <span class="stat-value">${eventData.properties.upvotes}</span>
            </div>
          </div>
          
          <div class="project-footer">
            <span class="project-author">
              Created by ${eventData.properties.authorName}
            </span>
            <span class="project-date">
              Started on ${formattedDate}
            </span>
            <span class="project-location">
              📍 ${eventData.coordinates.lat.toFixed(4)}, ${eventData.coordinates.lng.toFixed(4)}
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
};

const updateLabelContent = (mesh) => {
  const eventData = mesh.userData;
  mesh.userData.label.element.innerHTML = `
    <div class="comment-item">
      <img 
        src="${eventData.properties.thumbnailUri || '/placeholder-image.jpg'}" 
        alt="${eventData.category}"
        class="project-image"
        onerror="this.src='/placeholder-image.jpg'"
      />
      <div class="project-info">
        <span class="project-type">${eventData.category}</span>
        <span class="project-co2">CO₂: ${eventData.properties.co2Extracted || 1} tonnes</span>
      </div>
    </div>
  `;
};

const getProjectTypeColor = (type) => {
  switch (type) {
    case 'green-project':
      return 0x00ff7f;
    default:
      return 0xffffff;
  }
};

function smoothstep(min, max, value) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}